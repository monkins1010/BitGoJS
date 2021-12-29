var Buffer = require('safe-buffer').Buffer;
var bcrypto = require('./crypto');
var bscript = require('./script');
var { BufferReader, BufferWriter } = require('./bufferutils');
var coins = require('./coins');
var opcodes = require('bitcoin-ops');
var networks = require('./networks');
var typeforce = require('typeforce');
var types = require('./types');
var varuint = require('varuint-bitcoin');
var blake2b = require('@bitgo/blake2b');
var zcashVersion = require('./forks/zcash/version');
function varSliceSize(someScript) {
    var length = someScript.length;
    return varuint.encodingLength(length) + length;
}
function vectorSize(someVector) {
    var length = someVector.length;
    return varuint.encodingLength(length) + someVector.reduce(function (sum, witness) {
        return sum + varSliceSize(witness);
    }, 0);
}
// By default, assume is a bitcoin transaction
function Transaction(network = networks.bitcoin) {
    this.version = 1;
    this.locktime = 0;
    this.ins = [];
    this.outs = [];
    this.network = network;
    if (coins.isZcashCompatible(network)) {
        // ZCash version >= 2
        this.joinsplits = [];
        this.joinsplitPubkey = [];
        this.joinsplitSig = [];
        // ZCash version >= 3
        this.overwintered = 0; // 1 if the transaction is post overwinter upgrade, 0 otherwise
        this.versionGroupId = 0; // 0x03C48270 (63210096) for overwinter and 0x892F2085 (2301567109) for sapling
        this.expiryHeight = 0; // Block height after which this transactions will expire, or 0 to disable expiry
        // Must be updated along with version
        this.consensusBranchId = network.consensusBranchId[this.version];
    }
    if (coins.isDash(network)) {
        // Dash version = 3
        this.type = 0;
        this.extraPayload = Buffer.alloc(0);
    }
}
Transaction.DEFAULT_SEQUENCE = 0xffffffff;
Transaction.SIGHASH_ALL = 0x01;
Transaction.SIGHASH_NONE = 0x02;
Transaction.SIGHASH_SINGLE = 0x03;
Transaction.SIGHASH_ANYONECANPAY = 0x80;
/**
 * Enable BIP143 hashing with custom forkID
 * https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/replay-protected-sighash.md
 */
Transaction.SIGHASH_FORKID = 0x40;
/** @deprecated use SIGHASH_FORKID */
Transaction.SIGHASH_BITCOINCASHBIP143 = Transaction.SIGHASH_FORKID;
Transaction.ADVANCED_TRANSACTION_MARKER = 0x00;
Transaction.ADVANCED_TRANSACTION_FLAG = 0x01;
var EMPTY_SCRIPT = Buffer.allocUnsafe(0);
var EMPTY_WITNESS = [];
var ZERO = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
var ONE = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');
// Used to represent the absence of a value
var VALUE_UINT64_MAX = Buffer.from('ffffffffffffffff', 'hex');
var VALUE_INT64_ZERO = Buffer.from('0000000000000000', 'hex');
var BLANK_OUTPUT = {
    script: EMPTY_SCRIPT,
    valueBuffer: VALUE_UINT64_MAX
};
Transaction.DASH_NORMAL = 0;
Transaction.DASH_PROVIDER_REGISTER = 1;
Transaction.DASH_PROVIDER_UPDATE_SERVICE = 2;
Transaction.DASH_PROVIDER_UPDATE_REGISTRAR = 3;
Transaction.DASH_PROVIDER_UPDATE_REVOKE = 4;
Transaction.DASH_COINBASE = 5;
Transaction.DASH_QUORUM_COMMITMENT = 6;
Transaction.fromBuffer = function (buffer, network = networks.bitcoin, __noStrict) {
    let bufferReader = new BufferReader(buffer);
    let tx = new Transaction(network);
    tx.version = bufferReader.readInt32();
    if (coins.isZcashCompatible(network)) {
        // Split the header into fOverwintered and nVersion
        tx.overwintered = tx.version >>> 31; // Must be 1 for version 3 and up
        tx.version = tx.version & 0x07FFFFFFF; // 3 for overwinter
        if (tx.overwintered && !network.consensusBranchId.hasOwnProperty(tx.version)) {
            throw new Error('Unsupported Zcash transaction');
        }
        tx.consensusBranchId = network.consensusBranchId[tx.version];
    }
    if (coins.isDash(network)) {
        tx.type = tx.version >> 16;
        tx.version = tx.version & 0xffff;
        if (tx.version === 3 && (tx.type < Transaction.DASH_NORMAL || tx.type > Transaction.DASH_QUORUM_COMMITMENT)) {
            throw new Error('Unsupported Dash transaction type');
        }
    }
    var marker = bufferReader.readUInt8();
    var flag = bufferReader.readUInt8();
    var hasWitnesses = false;
    if (marker === Transaction.ADVANCED_TRANSACTION_MARKER &&
        flag === Transaction.ADVANCED_TRANSACTION_FLAG &&
        !coins.isZcashCompatible(network)) {
        hasWitnesses = true;
    }
    else {
        bufferReader.offset -= 2;
    }
    if (tx.isOverwinterCompatible()) {
        tx.versionGroupId = bufferReader.readUInt32();
    }
    var vinLen = bufferReader.readVarInt();
    for (var i = 0; i < vinLen; ++i) {
        tx.ins.push({
            hash: bufferReader.readSlice(32),
            index: bufferReader.readUInt32(),
            script: bufferReader.readVarSlice(),
            sequence: bufferReader.readUInt32(),
            witness: EMPTY_WITNESS
        });
    }
    var voutLen = bufferReader.readVarInt();
    for (i = 0; i < voutLen; ++i) {
        tx.outs.push({
            value: bufferReader.readUInt64(),
            script: bufferReader.readVarSlice()
        });
    }
    if (hasWitnesses) {
        for (i = 0; i < vinLen; ++i) {
            tx.ins[i].witness = bufferReader.readVector();
        }
        // was this pointless?
        if (!tx.hasWitnesses())
            throw new Error('Transaction has superfluous witness data');
    }
    tx.locktime = bufferReader.readUInt32();
    if (coins.isZcashCompatible(network)) {
        if (tx.isOverwinterCompatible()) {
            tx.expiryHeight = bufferReader.readUInt32();
        }
        if (tx.isSaplingCompatible()) {
            tx.valueBalance = bufferReader.readSlice(8);
            if (!tx.valueBalance.equals(VALUE_INT64_ZERO)) {
                /* istanbul ignore next */
                throw new Error(`unsupported valueBalance`);
            }
            var nShieldedSpend = bufferReader.readVarInt();
            if (nShieldedSpend !== 0) {
                /* istanbul ignore next */
                throw new Error(`shielded spend not supported`);
            }
            var nShieldedOutput = bufferReader.readVarInt();
            if (nShieldedOutput !== 0) {
                /* istanbul ignore next */
                throw new Error(`shielded output not supported`);
            }
        }
        if (tx.supportsJoinSplits()) {
            var joinSplitsLen = bufferReader.readVarInt();
            if (joinSplitsLen !== 0) {
                /* istanbul ignore next */
                throw new Error(`joinSplits not supported`);
            }
        }
    }
    if (tx.isDashSpecialTransaction()) {
        tx.extraPayload = bufferReader.readVarSlice();
    }
    tx.network = network;
    if (__noStrict)
        return tx;
    if (bufferReader.offset !== buffer.length)
        throw new Error('Transaction has unexpected data');
    return tx;
};
Transaction.fromHex = function (hex, network) {
    return Transaction.fromBuffer(Buffer.from(hex, 'hex'), network);
};
Transaction.isCoinbaseHash = function (buffer) {
    typeforce(types.Hash256bit, buffer);
    for (var i = 0; i < 32; ++i) {
        if (buffer[i] !== 0)
            return false;
    }
    return true;
};
Transaction.prototype.isSaplingCompatible = function () {
    return coins.isZcashCompatible(this.network) && this.version >= zcashVersion.SAPLING;
};
Transaction.prototype.isOverwinterCompatible = function () {
    return coins.isZcashCompatible(this.network) && this.version >= zcashVersion.OVERWINTER;
};
Transaction.prototype.supportsJoinSplits = function () {
    return coins.isZcashCompatible(this.network) && this.version >= zcashVersion.JOINSPLITS_SUPPORT;
};
Transaction.prototype.versionSupportsDashSpecialTransactions = function () {
    return coins.isDash(this.network) && this.version >= 3;
};
Transaction.prototype.isDashSpecialTransaction = function () {
    return this.versionSupportsDashSpecialTransactions() && this.type !== Transaction.DASH_NORMAL;
};
Transaction.prototype.isCoinbase = function () {
    return this.ins.length === 1 && Transaction.isCoinbaseHash(this.ins[0].hash);
};
Transaction.prototype.addInput = function (hash, index, sequence, scriptSig) {
    typeforce(types.tuple(types.Hash256bit, types.UInt32, types.maybe(types.UInt32), types.maybe(types.Buffer)), arguments);
    if (types.Null(sequence)) {
        sequence = Transaction.DEFAULT_SEQUENCE;
    }
    // Add the input and return the input's index
    return (this.ins.push({
        hash: hash,
        index: index,
        script: scriptSig || EMPTY_SCRIPT,
        sequence: sequence,
        witness: EMPTY_WITNESS
    }) - 1);
};
Transaction.prototype.addOutput = function (scriptPubKey, value) {
    typeforce(types.tuple(types.Buffer, types.Satoshi), arguments);
    // Add the output and return the output's index
    return (this.outs.push({
        script: scriptPubKey,
        value: value
    }) - 1);
};
Transaction.prototype.hasWitnesses = function () {
    return this.ins.some(function (x) {
        return x.witness.length !== 0;
    });
};
Transaction.prototype.weight = function () {
    var base = this.__byteLength(false);
    var total = this.__byteLength(true);
    return base * 3 + total;
};
Transaction.prototype.virtualSize = function () {
    return Math.ceil(this.weight() / 4);
};
Transaction.prototype.byteLength = function () {
    return this.__byteLength(true);
};
Transaction.prototype.zcashTransactionByteLength = function () {
    if (!coins.isZcashCompatible(this.network)) {
        throw new Error('zcashTransactionByteLength can only be called when using Zcash or compatible network');
    }
    var byteLength = 0;
    byteLength += 4; // Header
    if (this.isOverwinterCompatible()) {
        byteLength += 4; // nVersionGroupId
    }
    byteLength += varuint.encodingLength(this.ins.length); // tx_in_count
    byteLength += this.ins.reduce(function (sum, input) { return sum + 40 + varSliceSize(input.script); }, 0); // tx_in
    byteLength += varuint.encodingLength(this.outs.length); // tx_out_count
    byteLength += this.outs.reduce(function (sum, output) { return sum + 8 + varSliceSize(output.script); }, 0); // tx_out
    byteLength += 4; // lock_time
    if (this.isOverwinterCompatible()) {
        byteLength += 4; // nExpiryHeight
    }
    if (this.isSaplingCompatible()) {
        byteLength += 8; // valueBalance
        byteLength += varuint.encodingLength(0); // inputs
        byteLength += varuint.encodingLength(0); // outputs
    }
    if (this.supportsJoinSplits()) {
        byteLength += varuint.encodingLength(0); // joinsplits
    }
    return byteLength;
};
Transaction.prototype.__byteLength = function (__allowWitness) {
    var hasWitnesses = __allowWitness && this.hasWitnesses();
    if (coins.isZcashCompatible(this.network)) {
        return this.zcashTransactionByteLength();
    }
    return ((hasWitnesses ? 10 : 8) +
        varuint.encodingLength(this.ins.length) +
        varuint.encodingLength(this.outs.length) +
        this.ins.reduce(function (sum, input) { return sum + 40 + varSliceSize(input.script); }, 0) +
        this.outs.reduce(function (sum, output) { return sum + 8 + varSliceSize(output.script); }, 0) +
        (this.isDashSpecialTransaction() ? varSliceSize(this.extraPayload) : 0) +
        (hasWitnesses ? this.ins.reduce(function (sum, input) { return sum + vectorSize(input.witness); }, 0) : 0));
};
Transaction.prototype.clone = function () {
    var newTx = new Transaction(this.network);
    newTx.version = this.version;
    newTx.locktime = this.locktime;
    newTx.network = this.network;
    if (coins.isDash(this.network)) {
        newTx.type = this.type;
        newTx.extraPayload = this.extraPayload;
    }
    if (coins.isZcashCompatible(this.network)) {
        newTx.consensusBranchId = this.consensusBranchId;
    }
    if (this.isOverwinterCompatible()) {
        newTx.overwintered = this.overwintered;
        newTx.versionGroupId = this.versionGroupId;
        newTx.expiryHeight = this.expiryHeight;
    }
    if (this.isSaplingCompatible()) {
        newTx.valueBalance = this.valueBalance;
    }
    newTx.ins = this.ins.map(function (txIn) {
        return {
            hash: txIn.hash,
            index: txIn.index,
            script: txIn.script,
            sequence: txIn.sequence,
            witness: txIn.witness
        };
    });
    newTx.outs = this.outs.map(function (txOut) {
        return {
            script: txOut.script,
            value: txOut.value
        };
    });
    return newTx;
};
/**
 * Get Zcash header or version
 * @returns {number}
 */
Transaction.prototype.getHeader = function () {
    var mask = (this.overwintered ? 1 : 0);
    var header = this.version | (mask << 31);
    return header;
};
/**
 * Hash transaction for signing a specific input.
 *
 * Bitcoin uses a different hash for each signed transaction input.
 * This method copies the transaction, makes the necessary changes based on the
 * hashType, and then hashes the result.
 * This hash can then be used to sign the provided transaction input.
 */
Transaction.prototype.hashForSignature = function (inIndex, prevOutScript, hashType) {
    typeforce(types.tuple(types.UInt32, types.Buffer, /* types.UInt8 */ types.Number), arguments);
    // https://github.com/bitcoin/bitcoin/blob/master/src/test/sighash_tests.cpp#L29
    if (inIndex >= this.ins.length)
        return ONE;
    // ignore OP_CODESEPARATOR
    var ourScript = bscript.compile(bscript.decompile(prevOutScript).filter(function (x) {
        return x !== opcodes.OP_CODESEPARATOR;
    }));
    var txTmp = this.clone();
    // SIGHASH_NONE: ignore all outputs? (wildcard payee)
    if ((hashType & 0x1f) === Transaction.SIGHASH_NONE) {
        txTmp.outs = [];
        // ignore sequence numbers (except at inIndex)
        txTmp.ins.forEach(function (input, i) {
            if (i === inIndex)
                return;
            input.sequence = 0;
        });
        // SIGHASH_SINGLE: ignore all outputs, except at the same index?
    }
    else if ((hashType & 0x1f) === Transaction.SIGHASH_SINGLE) {
        // https://github.com/bitcoin/bitcoin/blob/master/src/test/sighash_tests.cpp#L60
        if (inIndex >= this.outs.length)
            return ONE;
        // truncate outputs after
        txTmp.outs.length = inIndex + 1;
        // "blank" outputs before
        for (var i = 0; i < inIndex; i++) {
            txTmp.outs[i] = BLANK_OUTPUT;
        }
        // ignore sequence numbers (except at inIndex)
        txTmp.ins.forEach(function (input, y) {
            if (y === inIndex)
                return;
            input.sequence = 0;
        });
    }
    // SIGHASH_ANYONECANPAY: ignore inputs entirely?
    if (hashType & Transaction.SIGHASH_ANYONECANPAY) {
        txTmp.ins = [txTmp.ins[inIndex]];
        txTmp.ins[0].script = ourScript;
        // SIGHASH_ALL: only ignore input scripts
    }
    else {
        // "blank" others input scripts
        txTmp.ins.forEach(function (input) { input.script = EMPTY_SCRIPT; });
        txTmp.ins[inIndex].script = ourScript;
    }
    // serialize and hash
    var buffer = Buffer.allocUnsafe(txTmp.__byteLength(false) + 4);
    buffer.writeInt32LE(hashType, buffer.length - 4);
    txTmp.__toBuffer(buffer, 0, false);
    return bcrypto.hash256(buffer);
};
/**
 * Calculate the hash to verify the signature against
 * @param inIndex
 * @param prevoutScript
 * @param value - The previous output's amount
 * @param hashType
 * @param isSegwit
 * @returns {*}
 */
Transaction.prototype.hashForSignatureByNetwork = function (inIndex, prevoutScript, value, hashType, isSegwit) {
    switch (coins.getMainnet(this.network)) {
        case networks.zcash:
        case networks.verus:
        case networks.kmd:
        case networks.default:
            return this.hashForZcashSignature(inIndex, prevoutScript, value, hashType);
        case networks.bitcoincash:
        case networks.bitcoinsv:
        case networks.bitcoingold:
            /*
              Bitcoin Cash supports a FORKID flag. When set, we hash using hashing algorithm
               that is used for segregated witness transactions (defined in BIP143).
      
              The flag is also used by BitcoinSV and BitcoinGold
      
              https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/replay-protected-sighash.md
             */
            var addForkId = (hashType & Transaction.SIGHASH_FORKID) > 0;
            if (addForkId) {
                /*
                  ``The sighash type is altered to include a 24-bit fork id in its most significant bits.''
                  We also use unsigned right shift operator `>>>` to cast to UInt32
                  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Unsigned_right_shift
                 */
                hashType = (hashType | this.network.forkId << 8) >>> 0;
                return this.hashForWitnessV0(inIndex, prevoutScript, value, hashType);
            }
    }
    if (isSegwit) {
        return this.hashForWitnessV0(inIndex, prevoutScript, value, hashType);
    }
    else {
        return this.hashForSignature(inIndex, prevoutScript, hashType);
    }
};
/** @deprecated use hashForSignatureByNetwork */
/* istanbul ignore next */
Transaction.prototype.hashForCashSignature = function (...args) {
    if (coins.getMainnet(this.network) !== networks.bitcoincash &&
        coins.getMainnet(this.network) !== networks.bitcoinsv) {
        throw new Error(`called hashForCashSignature on transaction with network ${coins.getNetworkName(this.network)}`);
    }
    return this.hashForSignatureByNetwork(...args);
};
/** @deprecated use hashForSignatureByNetwork */
/* istanbul ignore next */
Transaction.prototype.hashForGoldSignature = function (...args) {
    if (coins.getMainnet(this.network) !== networks.bitcoingold) {
        throw new Error(`called hashForGoldSignature on transaction with network ${coins.getNetworkName(this.network)}`);
    }
    return this.hashForSignatureByNetwork(...args);
};
/**
 * Blake2b hashing algorithm for Zcash
 * @param bufferToHash
 * @param personalization
 * @returns 256-bit BLAKE2b hash
 */
Transaction.prototype.getBlake2bHash = function (bufferToHash, personalization) {
    var out = Buffer.allocUnsafe(32);
    return blake2b(out.length, null, null, Buffer.from(personalization)).update(bufferToHash).digest(out);
};
/**
 * Build a hash for all or none of the transaction inputs depending on the hashtype
 * @param hashType
 * @returns double SHA-256, 256-bit BLAKE2b hash or 256-bit zero if doesn't apply
 */
Transaction.prototype.getPrevoutHash = function (hashType) {
    if (!(hashType & Transaction.SIGHASH_ANYONECANPAY)) {
        var bufferWriter = new BufferWriter(Buffer.allocUnsafe(36 * this.ins.length));
        this.ins.forEach(function (txIn) {
            bufferWriter.writeSlice(txIn.hash);
            bufferWriter.writeUInt32(txIn.index);
        });
        if (coins.isZcashCompatible(this.network)) {
            return this.getBlake2bHash(bufferWriter.buffer, 'ZcashPrevoutHash');
        }
        return bcrypto.hash256(bufferWriter.buffer);
    }
    return ZERO;
};
/**
 * Build a hash for all or none of the transactions inputs sequence numbers depending on the hashtype
 * @param hashType
 * @returns double SHA-256, 256-bit BLAKE2b hash or 256-bit zero if doesn't apply
 */
Transaction.prototype.getSequenceHash = function (hashType) {
    if (!(hashType & Transaction.SIGHASH_ANYONECANPAY) &&
        (hashType & 0x1f) !== Transaction.SIGHASH_SINGLE &&
        (hashType & 0x1f) !== Transaction.SIGHASH_NONE) {
        var bufferWriter = new BufferWriter(Buffer.allocUnsafe(4 * this.ins.length));
        this.ins.forEach(function (txIn) {
            bufferWriter.writeUInt32(txIn.sequence);
        });
        if (coins.isZcashCompatible(this.network)) {
            return this.getBlake2bHash(bufferWriter.buffer, 'ZcashSequencHash');
        }
        return bcrypto.hash256(bufferWriter.buffer);
    }
    return ZERO;
};
/**
 * Build a hash for one, all or none of the transaction outputs depending on the hashtype
 * @param hashType
 * @param inIndex
 * @returns double SHA-256, 256-bit BLAKE2b hash or 256-bit zero if doesn't apply
 */
Transaction.prototype.getOutputsHash = function (hashType, inIndex) {
    var bufferWriter;
    if ((hashType & 0x1f) !== Transaction.SIGHASH_SINGLE && (hashType & 0x1f) !== Transaction.SIGHASH_NONE) {
        // Find out the size of the outputs and write them
        var txOutsSize = this.outs.reduce(function (sum, output) {
            return sum + 8 + varSliceSize(output.script);
        }, 0);
        bufferWriter = new BufferWriter(Buffer.allocUnsafe(txOutsSize));
        this.outs.forEach(function (out) {
            bufferWriter.writeUInt64(out.value);
            bufferWriter.writeVarSlice(out.script);
        });
        if (coins.isZcashCompatible(this.network)) {
            return this.getBlake2bHash(bufferWriter.buffer, 'ZcashOutputsHash');
        }
        return bcrypto.hash256(bufferWriter.buffer);
    }
    else if ((hashType & 0x1f) === Transaction.SIGHASH_SINGLE && inIndex < this.outs.length) {
        // Write only the output specified in inIndex
        var output = this.outs[inIndex];
        bufferWriter = new BufferWriter(Buffer.allocUnsafe(8 + varSliceSize(output.script)));
        bufferWriter.writeUInt64(output.value);
        bufferWriter.writeVarSlice(output.script);
        if (coins.isZcashCompatible(this.network)) {
            return this.getBlake2bHash(bufferWriter.buffer, 'ZcashOutputsHash');
        }
        return bcrypto.hash256(bufferWriter.buffer);
    }
    return ZERO;
};
/**
 * Hash transaction for signing a transparent transaction in Zcash. Protected transactions are not supported.
 * @param inIndex
 * @param prevOutScript
 * @param value
 * @param hashType
 * @returns double SHA-256 or 256-bit BLAKE2b hash
 */
Transaction.prototype.hashForZcashSignature = function (inIndex, prevOutScript, value, hashType) {
    typeforce(types.tuple(types.UInt32, types.Buffer, types.Satoshi, types.UInt32), arguments);
    if (!coins.isZcashCompatible(this.network)) {
        throw new Error('hashForZcashSignature can only be called when using Zcash or compatible network');
    }
    if (inIndex >= this.ins.length && inIndex !== VALUE_UINT64_MAX) {
        /* istanbul ignore next */
        throw new Error('Input index is out of range');
    }
    if (this.isOverwinterCompatible()) {
        var hashPrevouts = this.getPrevoutHash(hashType);
        var hashSequence = this.getSequenceHash(hashType);
        var hashOutputs = this.getOutputsHash(hashType, inIndex);
        var hashJoinSplits = ZERO;
        var hashShieldedSpends = ZERO;
        var hashShieldedOutputs = ZERO;
        var bufferWriter;
        var baseBufferSize = 0;
        baseBufferSize += 4 * 5; // header, nVersionGroupId, lock_time, nExpiryHeight, hashType
        baseBufferSize += 32 * 4; // 256 hashes: hashPrevouts, hashSequence, hashOutputs, hashJoinSplits
        if (inIndex !== VALUE_UINT64_MAX) {
            // If this hash is for a transparent input signature (i.e. not for txTo.joinSplitSig), we need extra space
            baseBufferSize += 4 * 2; // input.index, input.sequence
            baseBufferSize += 8; // value
            baseBufferSize += 32; // input.hash
            baseBufferSize += varSliceSize(prevOutScript); // prevOutScript
        }
        if (this.isSaplingCompatible()) {
            baseBufferSize += 32 * 2; // hashShieldedSpends and hashShieldedOutputs
            baseBufferSize += 8; // valueBalance
        }
        bufferWriter = new BufferWriter(Buffer.alloc(baseBufferSize));
        bufferWriter.writeInt32(this.getHeader());
        bufferWriter.writeUInt32(this.versionGroupId);
        bufferWriter.writeSlice(hashPrevouts);
        bufferWriter.writeSlice(hashSequence);
        bufferWriter.writeSlice(hashOutputs);
        bufferWriter.writeSlice(hashJoinSplits);
        if (this.isSaplingCompatible()) {
            bufferWriter.writeSlice(hashShieldedSpends);
            bufferWriter.writeSlice(hashShieldedOutputs);
        }
        bufferWriter.writeUInt32(this.locktime);
        bufferWriter.writeUInt32(this.expiryHeight);
        if (this.isSaplingCompatible()) {
            bufferWriter.writeSlice(VALUE_INT64_ZERO);
        }
        bufferWriter.writeUInt32(hashType);
        // If this hash is for a transparent input signature (i.e. not for txTo.joinSplitSig):
        if (inIndex !== VALUE_UINT64_MAX) {
            // The input being signed (replacing the scriptSig with scriptCode + amount)
            // The prevout may already be contained in hashPrevout, and the nSequence
            // may already be contained in hashSequence.
            var input = this.ins[inIndex];
            bufferWriter.writeSlice(input.hash);
            bufferWriter.writeUInt32(input.index);
            bufferWriter.writeVarSlice(prevOutScript);
            bufferWriter.writeUInt64(value);
            bufferWriter.writeUInt32(input.sequence);
        }
        var personalization = Buffer.alloc(16);
        var prefix = 'ZcashSigHash';
        personalization.write(prefix);
        personalization.writeUInt32LE(this.consensusBranchId, prefix.length);
        return this.getBlake2bHash(bufferWriter.buffer, personalization);
    }
    /* istanbul ignore next */
    throw new Error(`unsupported version`);
};
Transaction.prototype.hashForWitnessV0 = function (inIndex, prevOutScript, value, hashType) {
    typeforce(types.tuple(types.UInt32, types.Buffer, types.Satoshi, types.UInt32), arguments);
    var hashPrevouts = this.getPrevoutHash(hashType);
    var hashSequence = this.getSequenceHash(hashType);
    var hashOutputs = this.getOutputsHash(hashType, inIndex);
    var bufferWriter = new BufferWriter(Buffer.allocUnsafe(156 + varSliceSize(prevOutScript)));
    var input = this.ins[inIndex];
    bufferWriter.writeInt32(this.version);
    bufferWriter.writeSlice(hashPrevouts);
    bufferWriter.writeSlice(hashSequence);
    bufferWriter.writeSlice(input.hash);
    bufferWriter.writeUInt32(input.index);
    bufferWriter.writeVarSlice(prevOutScript);
    bufferWriter.writeUInt64(value);
    bufferWriter.writeUInt32(input.sequence);
    bufferWriter.writeSlice(hashOutputs);
    bufferWriter.writeUInt32(this.locktime);
    bufferWriter.writeUInt32(hashType);
    return bcrypto.hash256(bufferWriter.buffer);
};
Transaction.prototype.getHash = function () {
    return bcrypto.hash256(this.__toBuffer(undefined, undefined, false));
};
Transaction.prototype.getId = function () {
    // transaction hash's are displayed in reverse order
    return this.getHash().reverse().toString('hex');
};
Transaction.prototype.toBuffer = function (buffer, initialOffset) {
    return this.__toBuffer(buffer, initialOffset, true);
};
Transaction.prototype.__toBuffer = function (buffer, initialOffset, __allowWitness) {
    if (!buffer)
        buffer = Buffer.allocUnsafe(this.__byteLength(__allowWitness));
    const bufferWriter = new BufferWriter(buffer, initialOffset || 0);
    function writeUInt16(i) {
        bufferWriter.offset = bufferWriter.buffer.writeUInt16LE(i, bufferWriter.offset);
    }
    if (this.isOverwinterCompatible()) {
        var mask = (this.overwintered ? 1 : 0);
        bufferWriter.writeInt32(this.version | (mask << 31)); // Set overwinter bit
        bufferWriter.writeUInt32(this.versionGroupId);
    }
    else if (this.isDashSpecialTransaction()) {
        writeUInt16(this.version);
        writeUInt16(this.type);
    }
    else {
        bufferWriter.writeInt32(this.version);
    }
    var hasWitnesses = __allowWitness && this.hasWitnesses();
    if (hasWitnesses) {
        bufferWriter.writeUInt8(Transaction.ADVANCED_TRANSACTION_MARKER);
        bufferWriter.writeUInt8(Transaction.ADVANCED_TRANSACTION_FLAG);
    }
    bufferWriter.writeVarInt(this.ins.length);
    this.ins.forEach(function (txIn) {
        bufferWriter.writeSlice(txIn.hash);
        bufferWriter.writeUInt32(txIn.index);
        bufferWriter.writeVarSlice(txIn.script);
        bufferWriter.writeUInt32(txIn.sequence);
    });
    bufferWriter.writeVarInt(this.outs.length);
    this.outs.forEach(function (txOut) {
        if (!txOut.valueBuffer) {
            bufferWriter.writeUInt64(txOut.value);
        }
        else {
            bufferWriter.writeSlice(txOut.valueBuffer);
        }
        bufferWriter.writeVarSlice(txOut.script);
    });
    if (hasWitnesses) {
        this.ins.forEach(function (input) {
            bufferWriter.writeVector(input.witness);
        });
    }
    bufferWriter.writeUInt32(this.locktime);
    if (this.isOverwinterCompatible()) {
        bufferWriter.writeUInt32(this.expiryHeight);
    }
    if (this.isSaplingCompatible()) {
        bufferWriter.writeSlice(VALUE_INT64_ZERO);
        bufferWriter.writeVarInt(0); // vShieldedSpendLength
        bufferWriter.writeVarInt(0); // vShieldedOutputLength
    }
    if (this.supportsJoinSplits()) {
        bufferWriter.writeVarInt(0); // joinsSplits length
    }
    if (this.isDashSpecialTransaction()) {
        bufferWriter.writeVarSlice(this.extraPayload);
    }
    if (initialOffset !== undefined)
        return buffer.slice(initialOffset, bufferWriter.offset);
    // avoid slicing unless necessary
    // TODO (https://github.com/BitGo/bitgo-utxo-lib/issues/11): we shouldn't have to slice the final buffer
    return buffer.slice(0, bufferWriter.offset);
};
Transaction.prototype.toHex = function () {
    return this.toBuffer().toString('hex');
};
Transaction.prototype.setInputScript = function (index, scriptSig) {
    typeforce(types.tuple(types.Number, types.Buffer), arguments);
    this.ins[index].script = scriptSig;
};
Transaction.prototype.setWitness = function (index, witness) {
    typeforce(types.tuple(types.Number, [types.Buffer]), arguments);
    this.ins[index].witness = witness;
};
module.exports = Transaction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdHJhbnNhY3Rpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLE1BQU0sQ0FBQTtBQUMxQyxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUE7QUFDakMsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFBO0FBQ2pDLElBQUksRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFBO0FBQzdELElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQTtBQUM5QixJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUE7QUFDcEMsSUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFBO0FBQ3BDLElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTtBQUNwQyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDOUIsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUE7QUFDeEMsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUE7QUFFdkMsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLHVCQUF1QixDQUFDLENBQUE7QUFFbkQsU0FBUyxZQUFZLENBQUUsVUFBVTtJQUMvQixJQUFJLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFBO0lBRTlCLE9BQU8sT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUE7QUFDaEQsQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFFLFVBQVU7SUFDN0IsSUFBSSxNQUFNLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FB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cmVxdWlyZSgnc2FmZS1idWZmZXInKS5CdWZmZXJcbnZhciBiY3J5cHRvID0gcmVxdWlyZSgnLi9jcnlwdG8nKVxudmFyIGJzY3JpcHQgPSByZXF1aXJlKCcuL3NjcmlwdCcpXG52YXIgeyBCdWZmZXJSZWFkZXIsIEJ1ZmZlcldyaXRlciB9ID0gcmVxdWlyZSgnLi9idWZmZXJ1dGlscycpXG52YXIgY29pbnMgPSByZXF1aXJlKCcuL2NvaW5zJylcbnZhciBvcGNvZGVzID0gcmVxdWlyZSgnYml0Y29pbi1vcHMnKVxudmFyIG5ldHdvcmtzID0gcmVxdWlyZSgnLi9uZXR3b3JrcycpXG52YXIgdHlwZWZvcmNlID0gcmVxdWlyZSgndHlwZWZvcmNlJylcbnZhciB0eXBlcyA9IHJlcXVpcmUoJy4vdHlwZXMnKVxudmFyIHZhcnVpbnQgPSByZXF1aXJlKCd2YXJ1aW50LWJpdGNvaW4nKVxudmFyIGJsYWtlMmIgPSByZXF1aXJlKCdAYml0Z28vYmxha2UyYicpXG5cbnZhciB6Y2FzaFZlcnNpb24gPSByZXF1aXJlKCcuL2ZvcmtzL3pjYXNoL3ZlcnNpb24nKVxuXG5mdW5jdGlvbiB2YXJTbGljZVNpemUgKHNvbWVTY3JpcHQpIHtcbiAgdmFyIGxlbmd0aCA9IHNvbWVTY3JpcHQubGVuZ3RoXG5cbiAgcmV0dXJuIHZhcnVpbnQuZW5jb2RpbmdMZW5ndGgobGVuZ3RoKSArIGxlbmd0aFxufVxuXG5mdW5jdGlvbiB2ZWN0b3JTaXplIChzb21lVmVjdG9yKSB7XG4gIHZhciBsZW5ndGggPSBzb21lVmVjdG9yLmxlbmd0aFxuXG4gIHJldHVybiB2YXJ1aW50LmVuY29kaW5nTGVuZ3RoKGxlbmd0aCkgKyBzb21lVmVjdG9yLnJlZHVjZShmdW5jdGlvbiAoc3VtLCB3aXRuZXNzKSB7XG4gICAgcmV0dXJuIHN1bSArIHZhclNsaWNlU2l6ZSh3aXRuZXNzKVxuICB9LCAwKVxufVxuXG4vLyBCeSBkZWZhdWx0LCBhc3N1bWUgaXMgYSBiaXRjb2luIHRyYW5zYWN0aW9uXG5mdW5jdGlvbiBUcmFuc2FjdGlvbiAobmV0d29yayA9IG5ldHdvcmtzLmJpdGNvaW4pIHtcbiAgdGhpcy52ZXJzaW9uID0gMVxuICB0aGlzLmxvY2t0aW1lID0gMFxuICB0aGlzLmlucyA9IFtdXG4gIHRoaXMub3V0cyA9IFtdXG4gIHRoaXMubmV0d29yayA9IG5ldHdvcmtcbiAgaWYgKGNvaW5zLmlzWmNhc2hDb21wYXRpYmxlKG5ldHdvcmspKSB7XG4gICAgLy8gWkNhc2ggdmVyc2lvbiA+PSAyXG4gICAgdGhpcy5qb2luc3BsaXRzID0gW11cbiAgICB0aGlzLmpvaW5zcGxpdFB1YmtleSA9IFtdXG4gICAgdGhpcy5qb2luc3BsaXRTaWcgPSBbXVxuICAgIC8vIFpDYXNoIHZlcnNpb24gPj0gM1xuICAgIHRoaXMub3ZlcndpbnRlcmVkID0gMCAgLy8gMSBpZiB0aGUgdHJhbnNhY3Rpb24gaXMgcG9zdCBvdmVyd2ludGVyIHVwZ3JhZGUsIDAgb3RoZXJ3aXNlXG4gICAgdGhpcy52ZXJzaW9uR3JvdXBJZCA9IDAgIC8vIDB4MDNDNDgyNzAgKDYzMjEwMDk2KSBmb3Igb3ZlcndpbnRlciBhbmQgMHg4OTJGMjA4NSAoMjMwMTU2NzEwOSkgZm9yIHNhcGxpbmdcbiAgICB0aGlzLmV4cGlyeUhlaWdodCA9IDAgIC8vIEJsb2NrIGhlaWdodCBhZnRlciB3aGljaCB0aGlzIHRyYW5zYWN0aW9ucyB3aWxsIGV4cGlyZSwgb3IgMCB0byBkaXNhYmxlIGV4cGlyeVxuICAgIC8vIE11c3QgYmUgdXBkYXRlZCBhbG9uZyB3aXRoIHZlcnNpb25cbiAgICB0aGlzLmNvbnNlbnN1c0JyYW5jaElkID0gbmV0d29yay5jb25zZW5zdXNCcmFuY2hJZFt0aGlzLnZlcnNpb25dXG4gIH1cbiAgaWYgKGNvaW5zLmlzRGFzaChuZXR3b3JrKSkge1xuICAgIC8vIERhc2ggdmVyc2lvbiA9IDNcbiAgICB0aGlzLnR5cGUgPSAwXG4gICAgdGhpcy5leHRyYVBheWxvYWQgPSBCdWZmZXIuYWxsb2MoMClcbiAgfVxufVxuXG5UcmFuc2FjdGlvbi5ERUZBVUxUX1NFUVVFTkNFID0gMHhmZmZmZmZmZlxuVHJhbnNhY3Rpb24uU0lHSEFTSF9BTEwgPSAweDAxXG5UcmFuc2FjdGlvbi5TSUdIQVNIX05PTkUgPSAweDAyXG5UcmFuc2FjdGlvbi5TSUdIQVNIX1NJTkdMRSA9IDB4MDNcblRyYW5zYWN0aW9uLlNJR0hBU0hfQU5ZT05FQ0FOUEFZID0gMHg4MFxuLyoqXG4gKiBFbmFibGUgQklQMTQzIGhhc2hpbmcgd2l0aCBjdXN0b20gZm9ya0lEXG4gKiBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbmNhc2hvcmcvYml0Y29pbmNhc2gub3JnL2Jsb2IvbWFzdGVyL3NwZWMvcmVwbGF5LXByb3RlY3RlZC1zaWdoYXNoLm1kXG4gKi9cblRyYW5zYWN0aW9uLlNJR0hBU0hfRk9SS0lEID0gMHg0MFxuLyoqIEBkZXByZWNhdGVkIHVzZSBTSUdIQVNIX0ZPUktJRCAqL1xuVHJhbnNhY3Rpb24uU0lHSEFTSF9CSVRDT0lOQ0FTSEJJUDE0MyA9IFRyYW5zYWN0aW9uLlNJR0hBU0hfRk9SS0lEXG5UcmFuc2FjdGlvbi5BRFZBTkNFRF9UUkFOU0FDVElPTl9NQVJLRVIgPSAweDAwXG5UcmFuc2FjdGlvbi5BRFZBTkNFRF9UUkFOU0FDVElPTl9GTEFHID0gMHgwMVxuXG52YXIgRU1QVFlfU0NSSVBUID0gQnVmZmVyLmFsbG9jVW5zYWZlKDApXG52YXIgRU1QVFlfV0lUTkVTUyA9IFtdXG52YXIgWkVSTyA9IEJ1ZmZlci5mcm9tKCcwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwJywgJ2hleCcpXG52YXIgT05FID0gQnVmZmVyLmZyb20oJzAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEnLCAnaGV4Jylcbi8vIFVzZWQgdG8gcmVwcmVzZW50IHRoZSBhYnNlbmNlIG9mIGEgdmFsdWVcbnZhciBWQUxVRV9VSU5UNjRfTUFYID0gQnVmZmVyLmZyb20oJ2ZmZmZmZmZmZmZmZmZmZmYnLCAnaGV4JylcbnZhciBWQUxVRV9JTlQ2NF9aRVJPID0gQnVmZmVyLmZyb20oJzAwMDAwMDAwMDAwMDAwMDAnLCAnaGV4JylcbnZhciBCTEFOS19PVVRQVVQgPSB7XG4gIHNjcmlwdDogRU1QVFlfU0NSSVBULFxuICB2YWx1ZUJ1ZmZlcjogVkFMVUVfVUlOVDY0X01BWFxufVxuXG5UcmFuc2FjdGlvbi5EQVNIX05PUk1BTCA9IDBcblRyYW5zYWN0aW9uLkRBU0hfUFJPVklERVJfUkVHSVNURVIgPSAxXG5UcmFuc2FjdGlvbi5EQVNIX1BST1ZJREVSX1VQREFURV9TRVJWSUNFID0gMlxuVHJhbnNhY3Rpb24uREFTSF9QUk9WSURFUl9VUERBVEVfUkVHSVNUUkFSID0gM1xuVHJhbnNhY3Rpb24uREFTSF9QUk9WSURFUl9VUERBVEVfUkVWT0tFID0gNFxuVHJhbnNhY3Rpb24uREFTSF9DT0lOQkFTRSA9IDVcblRyYW5zYWN0aW9uLkRBU0hfUVVPUlVNX0NPTU1JVE1FTlQgPSA2XG5cblRyYW5zYWN0aW9uLmZyb21CdWZmZXIgPSBmdW5jdGlvbiAoYnVmZmVyLCBuZXR3b3JrID0gbmV0d29ya3MuYml0Y29pbiwgX19ub1N0cmljdCkge1xuICBsZXQgYnVmZmVyUmVhZGVyID0gbmV3IEJ1ZmZlclJlYWRlcihidWZmZXIpXG5cbiAgbGV0IHR4ID0gbmV3IFRyYW5zYWN0aW9uKG5ldHdvcmspXG4gIHR4LnZlcnNpb24gPSBidWZmZXJSZWFkZXIucmVhZEludDMyKClcblxuICBpZiAoY29pbnMuaXNaY2FzaENvbXBhdGlibGUobmV0d29yaykpIHtcbiAgICAvLyBTcGxpdCB0aGUgaGVhZGVyIGludG8gZk92ZXJ3aW50ZXJlZCBhbmQgblZlcnNpb25cbiAgICB0eC5vdmVyd2ludGVyZWQgPSB0eC52ZXJzaW9uID4+PiAzMSAgLy8gTXVzdCBiZSAxIGZvciB2ZXJzaW9uIDMgYW5kIHVwXG4gICAgdHgudmVyc2lvbiA9IHR4LnZlcnNpb24gJiAweDA3RkZGRkZGRiAgLy8gMyBmb3Igb3ZlcndpbnRlclxuICAgIGlmICh0eC5vdmVyd2ludGVyZWQgJiYgIW5ldHdvcmsuY29uc2Vuc3VzQnJhbmNoSWQuaGFzT3duUHJvcGVydHkodHgudmVyc2lvbikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgWmNhc2ggdHJhbnNhY3Rpb24nKVxuICAgIH1cbiAgICB0eC5jb25zZW5zdXNCcmFuY2hJZCA9IG5ldHdvcmsuY29uc2Vuc3VzQnJhbmNoSWRbdHgudmVyc2lvbl1cbiAgfVxuXG4gIGlmIChjb2lucy5pc0Rhc2gobmV0d29yaykpIHtcbiAgICB0eC50eXBlID0gdHgudmVyc2lvbiA+PiAxNlxuICAgIHR4LnZlcnNpb24gPSB0eC52ZXJzaW9uICYgMHhmZmZmXG4gICAgaWYgKHR4LnZlcnNpb24gPT09IDMgJiYgKHR4LnR5cGUgPCBUcmFuc2FjdGlvbi5EQVNIX05PUk1BTCB8fCB0eC50eXBlID4gVHJhbnNhY3Rpb24uREFTSF9RVU9SVU1fQ09NTUlUTUVOVCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgRGFzaCB0cmFuc2FjdGlvbiB0eXBlJylcbiAgICB9XG4gIH1cblxuICB2YXIgbWFya2VyID0gYnVmZmVyUmVhZGVyLnJlYWRVSW50OCgpXG4gIHZhciBmbGFnID0gYnVmZmVyUmVhZGVyLnJlYWRVSW50OCgpXG5cbiAgdmFyIGhhc1dpdG5lc3NlcyA9IGZhbHNlXG4gIGlmIChtYXJrZXIgPT09IFRyYW5zYWN0aW9uLkFEVkFOQ0VEX1RSQU5TQUNUSU9OX01BUktFUiAmJlxuICAgICAgZmxhZyA9PT0gVHJhbnNhY3Rpb24uQURWQU5DRURfVFJBTlNBQ1RJT05fRkxBRyAmJlxuICAgICAgIWNvaW5zLmlzWmNhc2hDb21wYXRpYmxlKG5ldHdvcmspKSB7XG4gICAgaGFzV2l0bmVzc2VzID0gdHJ1ZVxuICB9IGVsc2Uge1xuICAgIGJ1ZmZlclJlYWRlci5vZmZzZXQgLT0gMlxuICB9XG5cbiAgaWYgKHR4LmlzT3ZlcndpbnRlckNvbXBhdGlibGUoKSkge1xuICAgIHR4LnZlcnNpb25Hcm91cElkID0gYnVmZmVyUmVhZGVyLnJlYWRVSW50MzIoKVxuICB9XG5cbiAgdmFyIHZpbkxlbiA9IGJ1ZmZlclJlYWRlci5yZWFkVmFySW50KClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB2aW5MZW47ICsraSkge1xuICAgIHR4Lmlucy5wdXNoKHtcbiAgICAgIGhhc2g6IGJ1ZmZlclJlYWRlci5yZWFkU2xpY2UoMzIpLFxuICAgICAgaW5kZXg6IGJ1ZmZlclJlYWRlci5yZWFkVUludDMyKCksXG4gICAgICBzY3JpcHQ6IGJ1ZmZlclJlYWRlci5yZWFkVmFyU2xpY2UoKSxcbiAgICAgIHNlcXVlbmNlOiBidWZmZXJSZWFkZXIucmVhZFVJbnQzMigpLFxuICAgICAgd2l0bmVzczogRU1QVFlfV0lUTkVTU1xuICAgIH0pXG4gIH1cblxuICB2YXIgdm91dExlbiA9IGJ1ZmZlclJlYWRlci5yZWFkVmFySW50KClcbiAgZm9yIChpID0gMDsgaSA8IHZvdXRMZW47ICsraSkge1xuICAgIHR4Lm91dHMucHVzaCh7XG4gICAgICB2YWx1ZTogYnVmZmVyUmVhZGVyLnJlYWRVSW50NjQoKSxcbiAgICAgIHNjcmlwdDogYnVmZmVyUmVhZGVyLnJlYWRWYXJTbGljZSgpXG4gICAgfSlcbiAgfVxuXG4gIGlmIChoYXNXaXRuZXNzZXMpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdmluTGVuOyArK2kpIHtcbiAgICAgIHR4Lmluc1tpXS53aXRuZXNzID0gYnVmZmVyUmVhZGVyLnJlYWRWZWN0b3IoKVxuICAgIH1cblxuICAgIC8vIHdhcyB0aGlzIHBvaW50bGVzcz9cbiAgICBpZiAoIXR4Lmhhc1dpdG5lc3NlcygpKSB0aHJvdyBuZXcgRXJyb3IoJ1RyYW5zYWN0aW9uIGhhcyBzdXBlcmZsdW91cyB3aXRuZXNzIGRhdGEnKVxuICB9XG5cbiAgdHgubG9ja3RpbWUgPSBidWZmZXJSZWFkZXIucmVhZFVJbnQzMigpXG5cbiAgaWYgKGNvaW5zLmlzWmNhc2hDb21wYXRpYmxlKG5ldHdvcmspKSB7XG4gICAgaWYgKHR4LmlzT3ZlcndpbnRlckNvbXBhdGlibGUoKSkge1xuICAgICAgdHguZXhwaXJ5SGVpZ2h0ID0gYnVmZmVyUmVhZGVyLnJlYWRVSW50MzIoKVxuICAgIH1cblxuICAgIGlmICh0eC5pc1NhcGxpbmdDb21wYXRpYmxlKCkpIHtcbiAgICAgIHR4LnZhbHVlQmFsYW5jZSA9IGJ1ZmZlclJlYWRlci5yZWFkU2xpY2UoOClcbiAgICAgIGlmICghdHgudmFsdWVCYWxhbmNlLmVxdWFscyhWQUxVRV9JTlQ2NF9aRVJPKSkge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuc3VwcG9ydGVkIHZhbHVlQmFsYW5jZWApXG4gICAgICB9XG5cbiAgICAgIHZhciBuU2hpZWxkZWRTcGVuZCA9IGJ1ZmZlclJlYWRlci5yZWFkVmFySW50KClcbiAgICAgIGlmIChuU2hpZWxkZWRTcGVuZCAhPT0gMCkge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNoaWVsZGVkIHNwZW5kIG5vdCBzdXBwb3J0ZWRgKVxuICAgICAgfVxuXG4gICAgICB2YXIgblNoaWVsZGVkT3V0cHV0ID0gYnVmZmVyUmVhZGVyLnJlYWRWYXJJbnQoKVxuICAgICAgaWYgKG5TaGllbGRlZE91dHB1dCAhPT0gMCkge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNoaWVsZGVkIG91dHB1dCBub3Qgc3VwcG9ydGVkYClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHguc3VwcG9ydHNKb2luU3BsaXRzKCkpIHtcbiAgICAgIHZhciBqb2luU3BsaXRzTGVuID0gYnVmZmVyUmVhZGVyLnJlYWRWYXJJbnQoKVxuICAgICAgaWYgKGpvaW5TcGxpdHNMZW4gIT09IDApIHtcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBqb2luU3BsaXRzIG5vdCBzdXBwb3J0ZWRgKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmICh0eC5pc0Rhc2hTcGVjaWFsVHJhbnNhY3Rpb24oKSkge1xuICAgIHR4LmV4dHJhUGF5bG9hZCA9IGJ1ZmZlclJlYWRlci5yZWFkVmFyU2xpY2UoKVxuICB9XG5cbiAgdHgubmV0d29yayA9IG5ldHdvcmtcblxuICBpZiAoX19ub1N0cmljdCkgcmV0dXJuIHR4XG4gIGlmIChidWZmZXJSZWFkZXIub2Zmc2V0ICE9PSBidWZmZXIubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoJ1RyYW5zYWN0aW9uIGhhcyB1bmV4cGVjdGVkIGRhdGEnKVxuXG4gIHJldHVybiB0eFxufVxuXG5UcmFuc2FjdGlvbi5mcm9tSGV4ID0gZnVuY3Rpb24gKGhleCwgbmV0d29yaykge1xuICByZXR1cm4gVHJhbnNhY3Rpb24uZnJvbUJ1ZmZlcihCdWZmZXIuZnJvbShoZXgsICdoZXgnKSwgbmV0d29yaylcbn1cblxuVHJhbnNhY3Rpb24uaXNDb2luYmFzZUhhc2ggPSBmdW5jdGlvbiAoYnVmZmVyKSB7XG4gIHR5cGVmb3JjZSh0eXBlcy5IYXNoMjU2Yml0LCBidWZmZXIpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgMzI7ICsraSkge1xuICAgIGlmIChidWZmZXJbaV0gIT09IDApIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiB0cnVlXG59XG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5pc1NhcGxpbmdDb21wYXRpYmxlID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gY29pbnMuaXNaY2FzaENvbXBhdGlibGUodGhpcy5uZXR3b3JrKSAmJiB0aGlzLnZlcnNpb24gPj0gemNhc2hWZXJzaW9uLlNBUExJTkdcbn1cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLmlzT3ZlcndpbnRlckNvbXBhdGlibGUgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBjb2lucy5pc1pjYXNoQ29tcGF0aWJsZSh0aGlzLm5ldHdvcmspICYmIHRoaXMudmVyc2lvbiA+PSB6Y2FzaFZlcnNpb24uT1ZFUldJTlRFUlxufVxuXG5UcmFuc2FjdGlvbi5wcm90b3R5cGUuc3VwcG9ydHNKb2luU3BsaXRzID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gY29pbnMuaXNaY2FzaENvbXBhdGlibGUodGhpcy5uZXR3b3JrKSAmJiB0aGlzLnZlcnNpb24gPj0gemNhc2hWZXJzaW9uLkpPSU5TUExJVFNfU1VQUE9SVFxufVxuXG5UcmFuc2FjdGlvbi5wcm90b3R5cGUudmVyc2lvblN1cHBvcnRzRGFzaFNwZWNpYWxUcmFuc2FjdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBjb2lucy5pc0Rhc2godGhpcy5uZXR3b3JrKSAmJiB0aGlzLnZlcnNpb24gPj0gM1xufVxuXG5UcmFuc2FjdGlvbi5wcm90b3R5cGUuaXNEYXNoU3BlY2lhbFRyYW5zYWN0aW9uID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy52ZXJzaW9uU3VwcG9ydHNEYXNoU3BlY2lhbFRyYW5zYWN0aW9ucygpICYmIHRoaXMudHlwZSAhPT0gVHJhbnNhY3Rpb24uREFTSF9OT1JNQUxcbn1cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLmlzQ29pbmJhc2UgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmlucy5sZW5ndGggPT09IDEgJiYgVHJhbnNhY3Rpb24uaXNDb2luYmFzZUhhc2godGhpcy5pbnNbMF0uaGFzaClcbn1cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLmFkZElucHV0ID0gZnVuY3Rpb24gKGhhc2gsIGluZGV4LCBzZXF1ZW5jZSwgc2NyaXB0U2lnKSB7XG4gIHR5cGVmb3JjZSh0eXBlcy50dXBsZShcbiAgICB0eXBlcy5IYXNoMjU2Yml0LFxuICAgIHR5cGVzLlVJbnQzMixcbiAgICB0eXBlcy5tYXliZSh0eXBlcy5VSW50MzIpLFxuICAgIHR5cGVzLm1heWJlKHR5cGVzLkJ1ZmZlcilcbiAgKSwgYXJndW1lbnRzKVxuXG4gIGlmICh0eXBlcy5OdWxsKHNlcXVlbmNlKSkge1xuICAgIHNlcXVlbmNlID0gVHJhbnNhY3Rpb24uREVGQVVMVF9TRVFVRU5DRVxuICB9XG5cbiAgLy8gQWRkIHRoZSBpbnB1dCBhbmQgcmV0dXJuIHRoZSBpbnB1dCdzIGluZGV4XG4gIHJldHVybiAodGhpcy5pbnMucHVzaCh7XG4gICAgaGFzaDogaGFzaCxcbiAgICBpbmRleDogaW5kZXgsXG4gICAgc2NyaXB0OiBzY3JpcHRTaWcgfHwgRU1QVFlfU0NSSVBULFxuICAgIHNlcXVlbmNlOiBzZXF1ZW5jZSxcbiAgICB3aXRuZXNzOiBFTVBUWV9XSVRORVNTXG4gIH0pIC0gMSlcbn1cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLmFkZE91dHB1dCA9IGZ1bmN0aW9uIChzY3JpcHRQdWJLZXksIHZhbHVlKSB7XG4gIHR5cGVmb3JjZSh0eXBlcy50dXBsZSh0eXBlcy5CdWZmZXIsIHR5cGVzLlNhdG9zaGkpLCBhcmd1bWVudHMpXG5cbiAgLy8gQWRkIHRoZSBvdXRwdXQgYW5kIHJldHVybiB0aGUgb3V0cHV0J3MgaW5kZXhcbiAgcmV0dXJuICh0aGlzLm91dHMucHVzaCh7XG4gICAgc2NyaXB0OiBzY3JpcHRQdWJLZXksXG4gICAgdmFsdWU6IHZhbHVlXG4gIH0pIC0gMSlcbn1cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLmhhc1dpdG5lc3NlcyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuaW5zLnNvbWUoZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4geC53aXRuZXNzLmxlbmd0aCAhPT0gMFxuICB9KVxufVxuXG5UcmFuc2FjdGlvbi5wcm90b3R5cGUud2VpZ2h0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgYmFzZSA9IHRoaXMuX19ieXRlTGVuZ3RoKGZhbHNlKVxuICB2YXIgdG90YWwgPSB0aGlzLl9fYnl0ZUxlbmd0aCh0cnVlKVxuICByZXR1cm4gYmFzZSAqIDMgKyB0b3RhbFxufVxuXG5UcmFuc2FjdGlvbi5wcm90b3R5cGUudmlydHVhbFNpemUgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBNYXRoLmNlaWwodGhpcy53ZWlnaHQoKSAvIDQpXG59XG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5ieXRlTGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5fX2J5dGVMZW5ndGgodHJ1ZSlcbn1cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLnpjYXNoVHJhbnNhY3Rpb25CeXRlTGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIWNvaW5zLmlzWmNhc2hDb21wYXRpYmxlKHRoaXMubmV0d29yaykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3pjYXNoVHJhbnNhY3Rpb25CeXRlTGVuZ3RoIGNhbiBvbmx5IGJlIGNhbGxlZCB3aGVuIHVzaW5nIFpjYXNoIG9yIGNvbXBhdGlibGUgbmV0d29yaycpXG4gIH1cbiAgdmFyIGJ5dGVMZW5ndGggPSAwXG4gIGJ5dGVMZW5ndGggKz0gNCAgLy8gSGVhZGVyXG4gIGlmICh0aGlzLmlzT3ZlcndpbnRlckNvbXBhdGlibGUoKSkge1xuICAgIGJ5dGVMZW5ndGggKz0gNCAgLy8gblZlcnNpb25Hcm91cElkXG4gIH1cbiAgYnl0ZUxlbmd0aCArPSB2YXJ1aW50LmVuY29kaW5nTGVuZ3RoKHRoaXMuaW5zLmxlbmd0aCkgIC8vIHR4X2luX2NvdW50XG4gIGJ5dGVMZW5ndGggKz0gdGhpcy5pbnMucmVkdWNlKGZ1bmN0aW9uIChzdW0sIGlucHV0KSB7IHJldHVybiBzdW0gKyA0MCArIHZhclNsaWNlU2l6ZShpbnB1dC5zY3JpcHQpIH0sIDApICAvLyB0eF9pblxuICBieXRlTGVuZ3RoICs9IHZhcnVpbnQuZW5jb2RpbmdMZW5ndGgodGhpcy5vdXRzLmxlbmd0aCkgIC8vIHR4X291dF9jb3VudFxuICBieXRlTGVuZ3RoICs9IHRoaXMub3V0cy5yZWR1Y2UoZnVuY3Rpb24gKHN1bSwgb3V0cHV0KSB7IHJldHVybiBzdW0gKyA4ICsgdmFyU2xpY2VTaXplKG91dHB1dC5zY3JpcHQpIH0sIDApICAvLyB0eF9vdXRcbiAgYnl0ZUxlbmd0aCArPSA0ICAvLyBsb2NrX3RpbWVcbiAgaWYgKHRoaXMuaXNPdmVyd2ludGVyQ29tcGF0aWJsZSgpKSB7XG4gICAgYnl0ZUxlbmd0aCArPSA0ICAvLyBuRXhwaXJ5SGVpZ2h0XG4gIH1cbiAgaWYgKHRoaXMuaXNTYXBsaW5nQ29tcGF0aWJsZSgpKSB7XG4gICAgYnl0ZUxlbmd0aCArPSA4ICAvLyB2YWx1ZUJhbGFuY2VcbiAgICBieXRlTGVuZ3RoICs9IHZhcnVpbnQuZW5jb2RpbmdMZW5ndGgoMCkgLy8gaW5wdXRzXG4gICAgYnl0ZUxlbmd0aCArPSB2YXJ1aW50LmVuY29kaW5nTGVuZ3RoKDApIC8vIG91dHB1dHNcbiAgfVxuICBpZiAodGhpcy5zdXBwb3J0c0pvaW5TcGxpdHMoKSkge1xuICAgIGJ5dGVMZW5ndGggKz0gdmFydWludC5lbmNvZGluZ0xlbmd0aCgwKSAvLyBqb2luc3BsaXRzXG4gIH1cbiAgcmV0dXJuIGJ5dGVMZW5ndGhcbn1cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLl9fYnl0ZUxlbmd0aCA9IGZ1bmN0aW9uIChfX2FsbG93V2l0bmVzcykge1xuICB2YXIgaGFzV2l0bmVzc2VzID0gX19hbGxvd1dpdG5lc3MgJiYgdGhpcy5oYXNXaXRuZXNzZXMoKVxuXG4gIGlmIChjb2lucy5pc1pjYXNoQ29tcGF0aWJsZSh0aGlzLm5ldHdvcmspKSB7XG4gICAgcmV0dXJuIHRoaXMuemNhc2hUcmFuc2FjdGlvbkJ5dGVMZW5ndGgoKVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICAoaGFzV2l0bmVzc2VzID8gMTAgOiA4KSArXG4gICAgdmFydWludC5lbmNvZGluZ0xlbmd0aCh0aGlzLmlucy5sZW5ndGgpICtcbiAgICB2YXJ1aW50LmVuY29kaW5nTGVuZ3RoKHRoaXMub3V0cy5sZW5ndGgpICtcbiAgICB0aGlzLmlucy5yZWR1Y2UoZnVuY3Rpb24gKHN1bSwgaW5wdXQpIHsgcmV0dXJuIHN1bSArIDQwICsgdmFyU2xpY2VTaXplKGlucHV0LnNjcmlwdCkgfSwgMCkgK1xuICAgIHRoaXMub3V0cy5yZWR1Y2UoZnVuY3Rpb24gKHN1bSwgb3V0cHV0KSB7IHJldHVybiBzdW0gKyA4ICsgdmFyU2xpY2VTaXplKG91dHB1dC5zY3JpcHQpIH0sIDApICtcbiAgICAodGhpcy5pc0Rhc2hTcGVjaWFsVHJhbnNhY3Rpb24oKSA/IHZhclNsaWNlU2l6ZSh0aGlzLmV4dHJhUGF5bG9hZCkgOiAwKSArXG4gICAgKGhhc1dpdG5lc3NlcyA/IHRoaXMuaW5zLnJlZHVjZShmdW5jdGlvbiAoc3VtLCBpbnB1dCkgeyByZXR1cm4gc3VtICsgdmVjdG9yU2l6ZShpbnB1dC53aXRuZXNzKSB9LCAwKSA6IDApXG4gIClcbn1cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbmV3VHggPSBuZXcgVHJhbnNhY3Rpb24odGhpcy5uZXR3b3JrKVxuICBuZXdUeC52ZXJzaW9uID0gdGhpcy52ZXJzaW9uXG4gIG5ld1R4LmxvY2t0aW1lID0gdGhpcy5sb2NrdGltZVxuICBuZXdUeC5uZXR3b3JrID0gdGhpcy5uZXR3b3JrXG5cbiAgaWYgKGNvaW5zLmlzRGFzaCh0aGlzLm5ldHdvcmspKSB7XG4gICAgbmV3VHgudHlwZSA9IHRoaXMudHlwZVxuICAgIG5ld1R4LmV4dHJhUGF5bG9hZCA9IHRoaXMuZXh0cmFQYXlsb2FkXG4gIH1cblxuICBpZiAoY29pbnMuaXNaY2FzaENvbXBhdGlibGUodGhpcy5uZXR3b3JrKSkge1xuICAgIG5ld1R4LmNvbnNlbnN1c0JyYW5jaElkID0gdGhpcy5jb25zZW5zdXNCcmFuY2hJZFxuICB9XG4gIGlmICh0aGlzLmlzT3ZlcndpbnRlckNvbXBhdGlibGUoKSkge1xuICAgIG5ld1R4Lm92ZXJ3aW50ZXJlZCA9IHRoaXMub3ZlcndpbnRlcmVkXG4gICAgbmV3VHgudmVyc2lvbkdyb3VwSWQgPSB0aGlzLnZlcnNpb25Hcm91cElkXG4gICAgbmV3VHguZXhwaXJ5SGVpZ2h0ID0gdGhpcy5leHBpcnlIZWlnaHRcbiAgfVxuICBpZiAodGhpcy5pc1NhcGxpbmdDb21wYXRpYmxlKCkpIHtcbiAgICBuZXdUeC52YWx1ZUJhbGFuY2UgPSB0aGlzLnZhbHVlQmFsYW5jZVxuICB9XG5cbiAgbmV3VHguaW5zID0gdGhpcy5pbnMubWFwKGZ1bmN0aW9uICh0eEluKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhhc2g6IHR4SW4uaGFzaCxcbiAgICAgIGluZGV4OiB0eEluLmluZGV4LFxuICAgICAgc2NyaXB0OiB0eEluLnNjcmlwdCxcbiAgICAgIHNlcXVlbmNlOiB0eEluLnNlcXVlbmNlLFxuICAgICAgd2l0bmVzczogdHhJbi53aXRuZXNzXG4gICAgfVxuICB9KVxuXG4gIG5ld1R4Lm91dHMgPSB0aGlzLm91dHMubWFwKGZ1bmN0aW9uICh0eE91dCkge1xuICAgIHJldHVybiB7XG4gICAgICBzY3JpcHQ6IHR4T3V0LnNjcmlwdCxcbiAgICAgIHZhbHVlOiB0eE91dC52YWx1ZVxuICAgIH1cbiAgfSlcblxuICByZXR1cm4gbmV3VHhcbn1cblxuLyoqXG4gKiBHZXQgWmNhc2ggaGVhZGVyIG9yIHZlcnNpb25cbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5nZXRIZWFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtYXNrID0gKHRoaXMub3ZlcndpbnRlcmVkID8gMSA6IDApXG4gIHZhciBoZWFkZXIgPSB0aGlzLnZlcnNpb24gfCAobWFzayA8PCAzMSlcbiAgcmV0dXJuIGhlYWRlclxufVxuXG4vKipcbiAqIEhhc2ggdHJhbnNhY3Rpb24gZm9yIHNpZ25pbmcgYSBzcGVjaWZpYyBpbnB1dC5cbiAqXG4gKiBCaXRjb2luIHVzZXMgYSBkaWZmZXJlbnQgaGFzaCBmb3IgZWFjaCBzaWduZWQgdHJhbnNhY3Rpb24gaW5wdXQuXG4gKiBUaGlzIG1ldGhvZCBjb3BpZXMgdGhlIHRyYW5zYWN0aW9uLCBtYWtlcyB0aGUgbmVjZXNzYXJ5IGNoYW5nZXMgYmFzZWQgb24gdGhlXG4gKiBoYXNoVHlwZSwgYW5kIHRoZW4gaGFzaGVzIHRoZSByZXN1bHQuXG4gKiBUaGlzIGhhc2ggY2FuIHRoZW4gYmUgdXNlZCB0byBzaWduIHRoZSBwcm92aWRlZCB0cmFuc2FjdGlvbiBpbnB1dC5cbiAqL1xuVHJhbnNhY3Rpb24ucHJvdG90eXBlLmhhc2hGb3JTaWduYXR1cmUgPSBmdW5jdGlvbiAoaW5JbmRleCwgcHJldk91dFNjcmlwdCwgaGFzaFR5cGUpIHtcbiAgdHlwZWZvcmNlKHR5cGVzLnR1cGxlKHR5cGVzLlVJbnQzMiwgdHlwZXMuQnVmZmVyLCAvKiB0eXBlcy5VSW50OCAqLyB0eXBlcy5OdW1iZXIpLCBhcmd1bWVudHMpXG5cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW4vYml0Y29pbi9ibG9iL21hc3Rlci9zcmMvdGVzdC9zaWdoYXNoX3Rlc3RzLmNwcCNMMjlcbiAgaWYgKGluSW5kZXggPj0gdGhpcy5pbnMubGVuZ3RoKSByZXR1cm4gT05FXG5cbiAgLy8gaWdub3JlIE9QX0NPREVTRVBBUkFUT1JcbiAgdmFyIG91clNjcmlwdCA9IGJzY3JpcHQuY29tcGlsZShic2NyaXB0LmRlY29tcGlsZShwcmV2T3V0U2NyaXB0KS5maWx0ZXIoZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4geCAhPT0gb3Bjb2Rlcy5PUF9DT0RFU0VQQVJBVE9SXG4gIH0pKVxuXG4gIHZhciB0eFRtcCA9IHRoaXMuY2xvbmUoKVxuXG4gIC8vIFNJR0hBU0hfTk9ORTogaWdub3JlIGFsbCBvdXRwdXRzPyAod2lsZGNhcmQgcGF5ZWUpXG4gIGlmICgoaGFzaFR5cGUgJiAweDFmKSA9PT0gVHJhbnNhY3Rpb24uU0lHSEFTSF9OT05FKSB7XG4gICAgdHhUbXAub3V0cyA9IFtdXG5cbiAgICAvLyBpZ25vcmUgc2VxdWVuY2UgbnVtYmVycyAoZXhjZXB0IGF0IGluSW5kZXgpXG4gICAgdHhUbXAuaW5zLmZvckVhY2goZnVuY3Rpb24gKGlucHV0LCBpKSB7XG4gICAgICBpZiAoaSA9PT0gaW5JbmRleCkgcmV0dXJuXG5cbiAgICAgIGlucHV0LnNlcXVlbmNlID0gMFxuICAgIH0pXG5cbiAgICAvLyBTSUdIQVNIX1NJTkdMRTogaWdub3JlIGFsbCBvdXRwdXRzLCBleGNlcHQgYXQgdGhlIHNhbWUgaW5kZXg/XG4gIH0gZWxzZSBpZiAoKGhhc2hUeXBlICYgMHgxZikgPT09IFRyYW5zYWN0aW9uLlNJR0hBU0hfU0lOR0xFKSB7XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW4vYml0Y29pbi9ibG9iL21hc3Rlci9zcmMvdGVzdC9zaWdoYXNoX3Rlc3RzLmNwcCNMNjBcbiAgICBpZiAoaW5JbmRleCA+PSB0aGlzLm91dHMubGVuZ3RoKSByZXR1cm4gT05FXG5cbiAgICAvLyB0cnVuY2F0ZSBvdXRwdXRzIGFmdGVyXG4gICAgdHhUbXAub3V0cy5sZW5ndGggPSBpbkluZGV4ICsgMVxuXG4gICAgLy8gXCJibGFua1wiIG91dHB1dHMgYmVmb3JlXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbkluZGV4OyBpKyspIHtcbiAgICAgIHR4VG1wLm91dHNbaV0gPSBCTEFOS19PVVRQVVRcbiAgICB9XG5cbiAgICAvLyBpZ25vcmUgc2VxdWVuY2UgbnVtYmVycyAoZXhjZXB0IGF0IGluSW5kZXgpXG4gICAgdHhUbXAuaW5zLmZvckVhY2goZnVuY3Rpb24gKGlucHV0LCB5KSB7XG4gICAgICBpZiAoeSA9PT0gaW5JbmRleCkgcmV0dXJuXG5cbiAgICAgIGlucHV0LnNlcXVlbmNlID0gMFxuICAgIH0pXG4gIH1cblxuICAvLyBTSUdIQVNIX0FOWU9ORUNBTlBBWTogaWdub3JlIGlucHV0cyBlbnRpcmVseT9cbiAgaWYgKGhhc2hUeXBlICYgVHJhbnNhY3Rpb24uU0lHSEFTSF9BTllPTkVDQU5QQVkpIHtcbiAgICB0eFRtcC5pbnMgPSBbdHhUbXAuaW5zW2luSW5kZXhdXVxuICAgIHR4VG1wLmluc1swXS5zY3JpcHQgPSBvdXJTY3JpcHRcblxuICAgIC8vIFNJR0hBU0hfQUxMOiBvbmx5IGlnbm9yZSBpbnB1dCBzY3JpcHRzXG4gIH0gZWxzZSB7XG4gICAgLy8gXCJibGFua1wiIG90aGVycyBpbnB1dCBzY3JpcHRzXG4gICAgdHhUbXAuaW5zLmZvckVhY2goZnVuY3Rpb24gKGlucHV0KSB7IGlucHV0LnNjcmlwdCA9IEVNUFRZX1NDUklQVCB9KVxuICAgIHR4VG1wLmluc1tpbkluZGV4XS5zY3JpcHQgPSBvdXJTY3JpcHRcbiAgfVxuXG4gIC8vIHNlcmlhbGl6ZSBhbmQgaGFzaFxuICB2YXIgYnVmZmVyID0gQnVmZmVyLmFsbG9jVW5zYWZlKHR4VG1wLl9fYnl0ZUxlbmd0aChmYWxzZSkgKyA0KVxuICBidWZmZXIud3JpdGVJbnQzMkxFKGhhc2hUeXBlLCBidWZmZXIubGVuZ3RoIC0gNClcbiAgdHhUbXAuX190b0J1ZmZlcihidWZmZXIsIDAsIGZhbHNlKVxuXG4gIHJldHVybiBiY3J5cHRvLmhhc2gyNTYoYnVmZmVyKVxufVxuXG4vKipcbiAqIENhbGN1bGF0ZSB0aGUgaGFzaCB0byB2ZXJpZnkgdGhlIHNpZ25hdHVyZSBhZ2FpbnN0XG4gKiBAcGFyYW0gaW5JbmRleFxuICogQHBhcmFtIHByZXZvdXRTY3JpcHRcbiAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBwcmV2aW91cyBvdXRwdXQncyBhbW91bnRcbiAqIEBwYXJhbSBoYXNoVHlwZVxuICogQHBhcmFtIGlzU2Vnd2l0XG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuVHJhbnNhY3Rpb24ucHJvdG90eXBlLmhhc2hGb3JTaWduYXR1cmVCeU5ldHdvcmsgPSBmdW5jdGlvbiAoXG4gIGluSW5kZXgsXG4gIHByZXZvdXRTY3JpcHQsXG4gIHZhbHVlLFxuICBoYXNoVHlwZSxcbiAgaXNTZWd3aXQsXG4pIHtcbiAgc3dpdGNoIChjb2lucy5nZXRNYWlubmV0KHRoaXMubmV0d29yaykpIHtcbiAgICBjYXNlIG5ldHdvcmtzLnpjYXNoOlxuICAgIGNhc2UgbmV0d29ya3MudmVydXM6XG4gICAgY2FzZSBuZXR3b3Jrcy5rbWQ6XG4gICAgY2FzZSBuZXR3b3Jrcy5kZWZhdWx0OlxuICAgICAgcmV0dXJuIHRoaXMuaGFzaEZvclpjYXNoU2lnbmF0dXJlKGluSW5kZXgsIHByZXZvdXRTY3JpcHQsIHZhbHVlLCBoYXNoVHlwZSlcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoOlxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnN2OlxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGQ6XG4gICAgICAvKlxuICAgICAgICBCaXRjb2luIENhc2ggc3VwcG9ydHMgYSBGT1JLSUQgZmxhZy4gV2hlbiBzZXQsIHdlIGhhc2ggdXNpbmcgaGFzaGluZyBhbGdvcml0aG1cbiAgICAgICAgIHRoYXQgaXMgdXNlZCBmb3Igc2VncmVnYXRlZCB3aXRuZXNzIHRyYW5zYWN0aW9ucyAoZGVmaW5lZCBpbiBCSVAxNDMpLlxuXG4gICAgICAgIFRoZSBmbGFnIGlzIGFsc28gdXNlZCBieSBCaXRjb2luU1YgYW5kIEJpdGNvaW5Hb2xkXG5cbiAgICAgICAgaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW5jYXNob3JnL2JpdGNvaW5jYXNoLm9yZy9ibG9iL21hc3Rlci9zcGVjL3JlcGxheS1wcm90ZWN0ZWQtc2lnaGFzaC5tZFxuICAgICAgICovXG4gICAgICB2YXIgYWRkRm9ya0lkID0gKGhhc2hUeXBlICYgVHJhbnNhY3Rpb24uU0lHSEFTSF9GT1JLSUQpID4gMFxuXG4gICAgICBpZiAoYWRkRm9ya0lkKSB7XG4gICAgICAgIC8qXG4gICAgICAgICAgYGBUaGUgc2lnaGFzaCB0eXBlIGlzIGFsdGVyZWQgdG8gaW5jbHVkZSBhIDI0LWJpdCBmb3JrIGlkIGluIGl0cyBtb3N0IHNpZ25pZmljYW50IGJpdHMuJydcbiAgICAgICAgICBXZSBhbHNvIHVzZSB1bnNpZ25lZCByaWdodCBzaGlmdCBvcGVyYXRvciBgPj4+YCB0byBjYXN0IHRvIFVJbnQzMlxuICAgICAgICAgIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL09wZXJhdG9ycy9VbnNpZ25lZF9yaWdodF9zaGlmdFxuICAgICAgICAgKi9cbiAgICAgICAgaGFzaFR5cGUgPSAoaGFzaFR5cGUgfCB0aGlzLm5ldHdvcmsuZm9ya0lkIDw8IDgpID4+PiAwXG4gICAgICAgIHJldHVybiB0aGlzLmhhc2hGb3JXaXRuZXNzVjAoaW5JbmRleCwgcHJldm91dFNjcmlwdCwgdmFsdWUsIGhhc2hUeXBlKVxuICAgICAgfVxuICB9XG5cbiAgaWYgKGlzU2Vnd2l0KSB7XG4gICAgcmV0dXJuIHRoaXMuaGFzaEZvcldpdG5lc3NWMChpbkluZGV4LCBwcmV2b3V0U2NyaXB0LCB2YWx1ZSwgaGFzaFR5cGUpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHRoaXMuaGFzaEZvclNpZ25hdHVyZShpbkluZGV4LCBwcmV2b3V0U2NyaXB0LCBoYXNoVHlwZSlcbiAgfVxufVxuXG4vKiogQGRlcHJlY2F0ZWQgdXNlIGhhc2hGb3JTaWduYXR1cmVCeU5ldHdvcmsgKi9cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5UcmFuc2FjdGlvbi5wcm90b3R5cGUuaGFzaEZvckNhc2hTaWduYXR1cmUgPSBmdW5jdGlvbiAoLi4uYXJncykge1xuICBpZiAoXG4gICAgY29pbnMuZ2V0TWFpbm5ldCh0aGlzLm5ldHdvcmspICE9PSBuZXR3b3Jrcy5iaXRjb2luY2FzaCAmJlxuICAgIGNvaW5zLmdldE1haW5uZXQodGhpcy5uZXR3b3JrKSAhPT0gbmV0d29ya3MuYml0Y29pbnN2XG4gICkge1xuICAgIHRocm93IG5ldyBFcnJvcihgY2FsbGVkIGhhc2hGb3JDYXNoU2lnbmF0dXJlIG9uIHRyYW5zYWN0aW9uIHdpdGggbmV0d29yayAke2NvaW5zLmdldE5ldHdvcmtOYW1lKHRoaXMubmV0d29yayl9YClcbiAgfVxuICByZXR1cm4gdGhpcy5oYXNoRm9yU2lnbmF0dXJlQnlOZXR3b3JrKC4uLmFyZ3MpXG59XG5cbi8qKiBAZGVwcmVjYXRlZCB1c2UgaGFzaEZvclNpZ25hdHVyZUJ5TmV0d29yayAqL1xuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5oYXNoRm9yR29sZFNpZ25hdHVyZSA9IGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gIGlmIChjb2lucy5nZXRNYWlubmV0KHRoaXMubmV0d29yaykgIT09IG5ldHdvcmtzLmJpdGNvaW5nb2xkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBjYWxsZWQgaGFzaEZvckdvbGRTaWduYXR1cmUgb24gdHJhbnNhY3Rpb24gd2l0aCBuZXR3b3JrICR7Y29pbnMuZ2V0TmV0d29ya05hbWUodGhpcy5uZXR3b3JrKX1gKVxuICB9XG4gIHJldHVybiB0aGlzLmhhc2hGb3JTaWduYXR1cmVCeU5ldHdvcmsoLi4uYXJncylcbn1cblxuLyoqXG4gKiBCbGFrZTJiIGhhc2hpbmcgYWxnb3JpdGhtIGZvciBaY2FzaFxuICogQHBhcmFtIGJ1ZmZlclRvSGFzaFxuICogQHBhcmFtIHBlcnNvbmFsaXphdGlvblxuICogQHJldHVybnMgMjU2LWJpdCBCTEFLRTJiIGhhc2hcbiAqL1xuVHJhbnNhY3Rpb24ucHJvdG90eXBlLmdldEJsYWtlMmJIYXNoID0gZnVuY3Rpb24gKGJ1ZmZlclRvSGFzaCwgcGVyc29uYWxpemF0aW9uKSB7XG4gIHZhciBvdXQgPSBCdWZmZXIuYWxsb2NVbnNhZmUoMzIpXG4gIHJldHVybiBibGFrZTJiKG91dC5sZW5ndGgsIG51bGwsIG51bGwsIEJ1ZmZlci5mcm9tKHBlcnNvbmFsaXphdGlvbikpLnVwZGF0ZShidWZmZXJUb0hhc2gpLmRpZ2VzdChvdXQpXG59XG5cbi8qKlxuICogQnVpbGQgYSBoYXNoIGZvciBhbGwgb3Igbm9uZSBvZiB0aGUgdHJhbnNhY3Rpb24gaW5wdXRzIGRlcGVuZGluZyBvbiB0aGUgaGFzaHR5cGVcbiAqIEBwYXJhbSBoYXNoVHlwZVxuICogQHJldHVybnMgZG91YmxlIFNIQS0yNTYsIDI1Ni1iaXQgQkxBS0UyYiBoYXNoIG9yIDI1Ni1iaXQgemVybyBpZiBkb2Vzbid0IGFwcGx5XG4gKi9cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5nZXRQcmV2b3V0SGFzaCA9IGZ1bmN0aW9uIChoYXNoVHlwZSkge1xuICBpZiAoIShoYXNoVHlwZSAmIFRyYW5zYWN0aW9uLlNJR0hBU0hfQU5ZT05FQ0FOUEFZKSkge1xuICAgIHZhciBidWZmZXJXcml0ZXIgPSBuZXcgQnVmZmVyV3JpdGVyKEJ1ZmZlci5hbGxvY1Vuc2FmZSgzNiAqIHRoaXMuaW5zLmxlbmd0aCkpXG5cbiAgICB0aGlzLmlucy5mb3JFYWNoKGZ1bmN0aW9uICh0eEluKSB7XG4gICAgICBidWZmZXJXcml0ZXIud3JpdGVTbGljZSh0eEluLmhhc2gpXG4gICAgICBidWZmZXJXcml0ZXIud3JpdGVVSW50MzIodHhJbi5pbmRleClcbiAgICB9KVxuXG4gICAgaWYgKGNvaW5zLmlzWmNhc2hDb21wYXRpYmxlKHRoaXMubmV0d29yaykpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldEJsYWtlMmJIYXNoKGJ1ZmZlcldyaXRlci5idWZmZXIsICdaY2FzaFByZXZvdXRIYXNoJylcbiAgICB9XG4gICAgcmV0dXJuIGJjcnlwdG8uaGFzaDI1NihidWZmZXJXcml0ZXIuYnVmZmVyKVxuICB9XG4gIHJldHVybiBaRVJPXG59XG5cbi8qKlxuICogQnVpbGQgYSBoYXNoIGZvciBhbGwgb3Igbm9uZSBvZiB0aGUgdHJhbnNhY3Rpb25zIGlucHV0cyBzZXF1ZW5jZSBudW1iZXJzIGRlcGVuZGluZyBvbiB0aGUgaGFzaHR5cGVcbiAqIEBwYXJhbSBoYXNoVHlwZVxuICogQHJldHVybnMgZG91YmxlIFNIQS0yNTYsIDI1Ni1iaXQgQkxBS0UyYiBoYXNoIG9yIDI1Ni1iaXQgemVybyBpZiBkb2Vzbid0IGFwcGx5XG4gKi9cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5nZXRTZXF1ZW5jZUhhc2ggPSBmdW5jdGlvbiAoaGFzaFR5cGUpIHtcbiAgaWYgKCEoaGFzaFR5cGUgJiBUcmFuc2FjdGlvbi5TSUdIQVNIX0FOWU9ORUNBTlBBWSkgJiZcbiAgICAoaGFzaFR5cGUgJiAweDFmKSAhPT0gVHJhbnNhY3Rpb24uU0lHSEFTSF9TSU5HTEUgJiZcbiAgICAoaGFzaFR5cGUgJiAweDFmKSAhPT0gVHJhbnNhY3Rpb24uU0lHSEFTSF9OT05FKSB7XG4gICAgdmFyIGJ1ZmZlcldyaXRlciA9IG5ldyBCdWZmZXJXcml0ZXIoQnVmZmVyLmFsbG9jVW5zYWZlKDQgKiB0aGlzLmlucy5sZW5ndGgpKVxuXG4gICAgdGhpcy5pbnMuZm9yRWFjaChmdW5jdGlvbiAodHhJbikge1xuICAgICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKHR4SW4uc2VxdWVuY2UpXG4gICAgfSlcblxuICAgIGlmIChjb2lucy5pc1pjYXNoQ29tcGF0aWJsZSh0aGlzLm5ldHdvcmspKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRCbGFrZTJiSGFzaChidWZmZXJXcml0ZXIuYnVmZmVyLCAnWmNhc2hTZXF1ZW5jSGFzaCcpXG4gICAgfVxuICAgIHJldHVybiBiY3J5cHRvLmhhc2gyNTYoYnVmZmVyV3JpdGVyLmJ1ZmZlcilcbiAgfVxuICByZXR1cm4gWkVST1xufVxuXG4vKipcbiAqIEJ1aWxkIGEgaGFzaCBmb3Igb25lLCBhbGwgb3Igbm9uZSBvZiB0aGUgdHJhbnNhY3Rpb24gb3V0cHV0cyBkZXBlbmRpbmcgb24gdGhlIGhhc2h0eXBlXG4gKiBAcGFyYW0gaGFzaFR5cGVcbiAqIEBwYXJhbSBpbkluZGV4XG4gKiBAcmV0dXJucyBkb3VibGUgU0hBLTI1NiwgMjU2LWJpdCBCTEFLRTJiIGhhc2ggb3IgMjU2LWJpdCB6ZXJvIGlmIGRvZXNuJ3QgYXBwbHlcbiAqL1xuVHJhbnNhY3Rpb24ucHJvdG90eXBlLmdldE91dHB1dHNIYXNoID0gZnVuY3Rpb24gKGhhc2hUeXBlLCBpbkluZGV4KSB7XG4gIHZhciBidWZmZXJXcml0ZXJcbiAgaWYgKChoYXNoVHlwZSAmIDB4MWYpICE9PSBUcmFuc2FjdGlvbi5TSUdIQVNIX1NJTkdMRSAmJiAoaGFzaFR5cGUgJiAweDFmKSAhPT0gVHJhbnNhY3Rpb24uU0lHSEFTSF9OT05FKSB7XG4gICAgLy8gRmluZCBvdXQgdGhlIHNpemUgb2YgdGhlIG91dHB1dHMgYW5kIHdyaXRlIHRoZW1cbiAgICB2YXIgdHhPdXRzU2l6ZSA9IHRoaXMub3V0cy5yZWR1Y2UoZnVuY3Rpb24gKHN1bSwgb3V0cHV0KSB7XG4gICAgICByZXR1cm4gc3VtICsgOCArIHZhclNsaWNlU2l6ZShvdXRwdXQuc2NyaXB0KVxuICAgIH0sIDApXG5cbiAgICBidWZmZXJXcml0ZXIgPSBuZXcgQnVmZmVyV3JpdGVyKEJ1ZmZlci5hbGxvY1Vuc2FmZSh0eE91dHNTaXplKSlcblxuICAgIHRoaXMub3V0cy5mb3JFYWNoKGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQ2NChvdXQudmFsdWUpXG4gICAgICBidWZmZXJXcml0ZXIud3JpdGVWYXJTbGljZShvdXQuc2NyaXB0KVxuICAgIH0pXG5cbiAgICBpZiAoY29pbnMuaXNaY2FzaENvbXBhdGlibGUodGhpcy5uZXR3b3JrKSkge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0Qmxha2UyYkhhc2goYnVmZmVyV3JpdGVyLmJ1ZmZlciwgJ1pjYXNoT3V0cHV0c0hhc2gnKVxuICAgIH1cbiAgICByZXR1cm4gYmNyeXB0by5oYXNoMjU2KGJ1ZmZlcldyaXRlci5idWZmZXIpXG4gIH0gZWxzZSBpZiAoKGhhc2hUeXBlICYgMHgxZikgPT09IFRyYW5zYWN0aW9uLlNJR0hBU0hfU0lOR0xFICYmIGluSW5kZXggPCB0aGlzLm91dHMubGVuZ3RoKSB7XG4gICAgLy8gV3JpdGUgb25seSB0aGUgb3V0cHV0IHNwZWNpZmllZCBpbiBpbkluZGV4XG4gICAgdmFyIG91dHB1dCA9IHRoaXMub3V0c1tpbkluZGV4XVxuXG4gICAgYnVmZmVyV3JpdGVyID0gbmV3IEJ1ZmZlcldyaXRlcihCdWZmZXIuYWxsb2NVbnNhZmUoOCArIHZhclNsaWNlU2l6ZShvdXRwdXQuc2NyaXB0KSkpXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDY0KG91dHB1dC52YWx1ZSlcbiAgICBidWZmZXJXcml0ZXIud3JpdGVWYXJTbGljZShvdXRwdXQuc2NyaXB0KVxuXG4gICAgaWYgKGNvaW5zLmlzWmNhc2hDb21wYXRpYmxlKHRoaXMubmV0d29yaykpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldEJsYWtlMmJIYXNoKGJ1ZmZlcldyaXRlci5idWZmZXIsICdaY2FzaE91dHB1dHNIYXNoJylcbiAgICB9XG4gICAgcmV0dXJuIGJjcnlwdG8uaGFzaDI1NihidWZmZXJXcml0ZXIuYnVmZmVyKVxuICB9XG4gIHJldHVybiBaRVJPXG59XG5cbi8qKlxuICogSGFzaCB0cmFuc2FjdGlvbiBmb3Igc2lnbmluZyBhIHRyYW5zcGFyZW50IHRyYW5zYWN0aW9uIGluIFpjYXNoLiBQcm90ZWN0ZWQgdHJhbnNhY3Rpb25zIGFyZSBub3Qgc3VwcG9ydGVkLlxuICogQHBhcmFtIGluSW5kZXhcbiAqIEBwYXJhbSBwcmV2T3V0U2NyaXB0XG4gKiBAcGFyYW0gdmFsdWVcbiAqIEBwYXJhbSBoYXNoVHlwZVxuICogQHJldHVybnMgZG91YmxlIFNIQS0yNTYgb3IgMjU2LWJpdCBCTEFLRTJiIGhhc2hcbiAqL1xuVHJhbnNhY3Rpb24ucHJvdG90eXBlLmhhc2hGb3JaY2FzaFNpZ25hdHVyZSA9IGZ1bmN0aW9uIChpbkluZGV4LCBwcmV2T3V0U2NyaXB0LCB2YWx1ZSwgaGFzaFR5cGUpIHtcbiAgdHlwZWZvcmNlKHR5cGVzLnR1cGxlKHR5cGVzLlVJbnQzMiwgdHlwZXMuQnVmZmVyLCB0eXBlcy5TYXRvc2hpLCB0eXBlcy5VSW50MzIpLCBhcmd1bWVudHMpXG4gIGlmICghY29pbnMuaXNaY2FzaENvbXBhdGlibGUodGhpcy5uZXR3b3JrKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignaGFzaEZvclpjYXNoU2lnbmF0dXJlIGNhbiBvbmx5IGJlIGNhbGxlZCB3aGVuIHVzaW5nIFpjYXNoIG9yIGNvbXBhdGlibGUgbmV0d29yaycpXG4gIH1cblxuICBpZiAoaW5JbmRleCA+PSB0aGlzLmlucy5sZW5ndGggJiYgaW5JbmRleCAhPT0gVkFMVUVfVUlOVDY0X01BWCkge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnB1dCBpbmRleCBpcyBvdXQgb2YgcmFuZ2UnKVxuICB9XG5cbiAgaWYgKHRoaXMuaXNPdmVyd2ludGVyQ29tcGF0aWJsZSgpKSB7XG4gICAgdmFyIGhhc2hQcmV2b3V0cyA9IHRoaXMuZ2V0UHJldm91dEhhc2goaGFzaFR5cGUpXG4gICAgdmFyIGhhc2hTZXF1ZW5jZSA9IHRoaXMuZ2V0U2VxdWVuY2VIYXNoKGhhc2hUeXBlKVxuICAgIHZhciBoYXNoT3V0cHV0cyA9IHRoaXMuZ2V0T3V0cHV0c0hhc2goaGFzaFR5cGUsIGluSW5kZXgpXG4gICAgdmFyIGhhc2hKb2luU3BsaXRzID0gWkVST1xuICAgIHZhciBoYXNoU2hpZWxkZWRTcGVuZHMgPSBaRVJPXG4gICAgdmFyIGhhc2hTaGllbGRlZE91dHB1dHMgPSBaRVJPXG5cbiAgICB2YXIgYnVmZmVyV3JpdGVyXG4gICAgdmFyIGJhc2VCdWZmZXJTaXplID0gMFxuICAgIGJhc2VCdWZmZXJTaXplICs9IDQgKiA1ICAvLyBoZWFkZXIsIG5WZXJzaW9uR3JvdXBJZCwgbG9ja190aW1lLCBuRXhwaXJ5SGVpZ2h0LCBoYXNoVHlwZVxuICAgIGJhc2VCdWZmZXJTaXplICs9IDMyICogNCAgLy8gMjU2IGhhc2hlczogaGFzaFByZXZvdXRzLCBoYXNoU2VxdWVuY2UsIGhhc2hPdXRwdXRzLCBoYXNoSm9pblNwbGl0c1xuICAgIGlmIChpbkluZGV4ICE9PSBWQUxVRV9VSU5UNjRfTUFYKSB7XG4gICAgICAvLyBJZiB0aGlzIGhhc2ggaXMgZm9yIGEgdHJhbnNwYXJlbnQgaW5wdXQgc2lnbmF0dXJlIChpLmUuIG5vdCBmb3IgdHhUby5qb2luU3BsaXRTaWcpLCB3ZSBuZWVkIGV4dHJhIHNwYWNlXG4gICAgICBiYXNlQnVmZmVyU2l6ZSArPSA0ICogMiAgLy8gaW5wdXQuaW5kZXgsIGlucHV0LnNlcXVlbmNlXG4gICAgICBiYXNlQnVmZmVyU2l6ZSArPSA4ICAvLyB2YWx1ZVxuICAgICAgYmFzZUJ1ZmZlclNpemUgKz0gMzIgIC8vIGlucHV0Lmhhc2hcbiAgICAgIGJhc2VCdWZmZXJTaXplICs9IHZhclNsaWNlU2l6ZShwcmV2T3V0U2NyaXB0KSAgLy8gcHJldk91dFNjcmlwdFxuICAgIH1cbiAgICBpZiAodGhpcy5pc1NhcGxpbmdDb21wYXRpYmxlKCkpIHtcbiAgICAgIGJhc2VCdWZmZXJTaXplICs9IDMyICogMiAgLy8gaGFzaFNoaWVsZGVkU3BlbmRzIGFuZCBoYXNoU2hpZWxkZWRPdXRwdXRzXG4gICAgICBiYXNlQnVmZmVyU2l6ZSArPSA4ICAvLyB2YWx1ZUJhbGFuY2VcbiAgICB9XG4gICAgYnVmZmVyV3JpdGVyID0gbmV3IEJ1ZmZlcldyaXRlcihCdWZmZXIuYWxsb2MoYmFzZUJ1ZmZlclNpemUpKVxuXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlSW50MzIodGhpcy5nZXRIZWFkZXIoKSlcbiAgICBidWZmZXJXcml0ZXIud3JpdGVVSW50MzIodGhpcy52ZXJzaW9uR3JvdXBJZClcbiAgICBidWZmZXJXcml0ZXIud3JpdGVTbGljZShoYXNoUHJldm91dHMpXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlU2xpY2UoaGFzaFNlcXVlbmNlKVxuICAgIGJ1ZmZlcldyaXRlci53cml0ZVNsaWNlKGhhc2hPdXRwdXRzKVxuICAgIGJ1ZmZlcldyaXRlci53cml0ZVNsaWNlKGhhc2hKb2luU3BsaXRzKVxuICAgIGlmICh0aGlzLmlzU2FwbGluZ0NvbXBhdGlibGUoKSkge1xuICAgICAgYnVmZmVyV3JpdGVyLndyaXRlU2xpY2UoaGFzaFNoaWVsZGVkU3BlbmRzKVxuICAgICAgYnVmZmVyV3JpdGVyLndyaXRlU2xpY2UoaGFzaFNoaWVsZGVkT3V0cHV0cylcbiAgICB9XG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKHRoaXMubG9ja3RpbWUpXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKHRoaXMuZXhwaXJ5SGVpZ2h0KVxuICAgIGlmICh0aGlzLmlzU2FwbGluZ0NvbXBhdGlibGUoKSkge1xuICAgICAgYnVmZmVyV3JpdGVyLndyaXRlU2xpY2UoVkFMVUVfSU5UNjRfWkVSTylcbiAgICB9XG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKGhhc2hUeXBlKVxuXG4gICAgLy8gSWYgdGhpcyBoYXNoIGlzIGZvciBhIHRyYW5zcGFyZW50IGlucHV0IHNpZ25hdHVyZSAoaS5lLiBub3QgZm9yIHR4VG8uam9pblNwbGl0U2lnKTpcbiAgICBpZiAoaW5JbmRleCAhPT0gVkFMVUVfVUlOVDY0X01BWCkge1xuICAgICAgLy8gVGhlIGlucHV0IGJlaW5nIHNpZ25lZCAocmVwbGFjaW5nIHRoZSBzY3JpcHRTaWcgd2l0aCBzY3JpcHRDb2RlICsgYW1vdW50KVxuICAgICAgLy8gVGhlIHByZXZvdXQgbWF5IGFscmVhZHkgYmUgY29udGFpbmVkIGluIGhhc2hQcmV2b3V0LCBhbmQgdGhlIG5TZXF1ZW5jZVxuICAgICAgLy8gbWF5IGFscmVhZHkgYmUgY29udGFpbmVkIGluIGhhc2hTZXF1ZW5jZS5cbiAgICAgIHZhciBpbnB1dCA9IHRoaXMuaW5zW2luSW5kZXhdXG4gICAgICBidWZmZXJXcml0ZXIud3JpdGVTbGljZShpbnB1dC5oYXNoKVxuICAgICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKGlucHV0LmluZGV4KVxuICAgICAgYnVmZmVyV3JpdGVyLndyaXRlVmFyU2xpY2UocHJldk91dFNjcmlwdClcbiAgICAgIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQ2NCh2YWx1ZSlcbiAgICAgIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQzMihpbnB1dC5zZXF1ZW5jZSlcbiAgICB9XG5cbiAgICB2YXIgcGVyc29uYWxpemF0aW9uID0gQnVmZmVyLmFsbG9jKDE2KVxuICAgIHZhciBwcmVmaXggPSAnWmNhc2hTaWdIYXNoJ1xuICAgIHBlcnNvbmFsaXphdGlvbi53cml0ZShwcmVmaXgpXG4gICAgcGVyc29uYWxpemF0aW9uLndyaXRlVUludDMyTEUodGhpcy5jb25zZW5zdXNCcmFuY2hJZCwgcHJlZml4Lmxlbmd0aClcblxuICAgIHJldHVybiB0aGlzLmdldEJsYWtlMmJIYXNoKGJ1ZmZlcldyaXRlci5idWZmZXIsIHBlcnNvbmFsaXphdGlvbilcbiAgfVxuXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIHRocm93IG5ldyBFcnJvcihgdW5zdXBwb3J0ZWQgdmVyc2lvbmApXG59XG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5oYXNoRm9yV2l0bmVzc1YwID0gZnVuY3Rpb24gKGluSW5kZXgsIHByZXZPdXRTY3JpcHQsIHZhbHVlLCBoYXNoVHlwZSkge1xuICB0eXBlZm9yY2UodHlwZXMudHVwbGUodHlwZXMuVUludDMyLCB0eXBlcy5CdWZmZXIsIHR5cGVzLlNhdG9zaGksIHR5cGVzLlVJbnQzMiksIGFyZ3VtZW50cylcblxuICB2YXIgaGFzaFByZXZvdXRzID0gdGhpcy5nZXRQcmV2b3V0SGFzaChoYXNoVHlwZSlcbiAgdmFyIGhhc2hTZXF1ZW5jZSA9IHRoaXMuZ2V0U2VxdWVuY2VIYXNoKGhhc2hUeXBlKVxuICB2YXIgaGFzaE91dHB1dHMgPSB0aGlzLmdldE91dHB1dHNIYXNoKGhhc2hUeXBlLCBpbkluZGV4KVxuXG4gIHZhciBidWZmZXJXcml0ZXIgPSBuZXcgQnVmZmVyV3JpdGVyKEJ1ZmZlci5hbGxvY1Vuc2FmZSgxNTYgKyB2YXJTbGljZVNpemUocHJldk91dFNjcmlwdCkpKVxuICB2YXIgaW5wdXQgPSB0aGlzLmluc1tpbkluZGV4XVxuICBidWZmZXJXcml0ZXIud3JpdGVJbnQzMih0aGlzLnZlcnNpb24pXG4gIGJ1ZmZlcldyaXRlci53cml0ZVNsaWNlKGhhc2hQcmV2b3V0cylcbiAgYnVmZmVyV3JpdGVyLndyaXRlU2xpY2UoaGFzaFNlcXVlbmNlKVxuICBidWZmZXJXcml0ZXIud3JpdGVTbGljZShpbnB1dC5oYXNoKVxuICBidWZmZXJXcml0ZXIud3JpdGVVSW50MzIoaW5wdXQuaW5kZXgpXG4gIGJ1ZmZlcldyaXRlci53cml0ZVZhclNsaWNlKHByZXZPdXRTY3JpcHQpXG4gIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQ2NCh2YWx1ZSlcbiAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKGlucHV0LnNlcXVlbmNlKVxuICBidWZmZXJXcml0ZXIud3JpdGVTbGljZShoYXNoT3V0cHV0cylcbiAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKHRoaXMubG9ja3RpbWUpXG4gIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQzMihoYXNoVHlwZSlcbiAgcmV0dXJuIGJjcnlwdG8uaGFzaDI1NihidWZmZXJXcml0ZXIuYnVmZmVyKVxufVxuXG5UcmFuc2FjdGlvbi5wcm90b3R5cGUuZ2V0SGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGJjcnlwdG8uaGFzaDI1Nih0aGlzLl9fdG9CdWZmZXIodW5kZWZpbmVkLCB1bmRlZmluZWQsIGZhbHNlKSlcbn1cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLmdldElkID0gZnVuY3Rpb24gKCkge1xuICAvLyB0cmFuc2FjdGlvbiBoYXNoJ3MgYXJlIGRpc3BsYXllZCBpbiByZXZlcnNlIG9yZGVyXG4gIHJldHVybiB0aGlzLmdldEhhc2goKS5yZXZlcnNlKCkudG9TdHJpbmcoJ2hleCcpXG59XG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS50b0J1ZmZlciA9IGZ1bmN0aW9uIChidWZmZXIsIGluaXRpYWxPZmZzZXQpIHtcbiAgcmV0dXJuIHRoaXMuX190b0J1ZmZlcihidWZmZXIsIGluaXRpYWxPZmZzZXQsIHRydWUpXG59XG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5fX3RvQnVmZmVyID0gZnVuY3Rpb24gKGJ1ZmZlciwgaW5pdGlhbE9mZnNldCwgX19hbGxvd1dpdG5lc3MpIHtcbiAgaWYgKCFidWZmZXIpIGJ1ZmZlciA9IEJ1ZmZlci5hbGxvY1Vuc2FmZSh0aGlzLl9fYnl0ZUxlbmd0aChfX2FsbG93V2l0bmVzcykpXG5cbiAgY29uc3QgYnVmZmVyV3JpdGVyID0gbmV3IEJ1ZmZlcldyaXRlcihidWZmZXIsIGluaXRpYWxPZmZzZXQgfHwgMClcblxuICBmdW5jdGlvbiB3cml0ZVVJbnQxNiAoaSkge1xuICAgIGJ1ZmZlcldyaXRlci5vZmZzZXQgPSBidWZmZXJXcml0ZXIuYnVmZmVyLndyaXRlVUludDE2TEUoaSwgYnVmZmVyV3JpdGVyLm9mZnNldClcbiAgfVxuXG4gIGlmICh0aGlzLmlzT3ZlcndpbnRlckNvbXBhdGlibGUoKSkge1xuICAgIHZhciBtYXNrID0gKHRoaXMub3ZlcndpbnRlcmVkID8gMSA6IDApXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlSW50MzIodGhpcy52ZXJzaW9uIHwgKG1hc2sgPDwgMzEpKSAgLy8gU2V0IG92ZXJ3aW50ZXIgYml0XG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKHRoaXMudmVyc2lvbkdyb3VwSWQpXG4gIH0gZWxzZSBpZiAodGhpcy5pc0Rhc2hTcGVjaWFsVHJhbnNhY3Rpb24oKSkge1xuICAgIHdyaXRlVUludDE2KHRoaXMudmVyc2lvbilcbiAgICB3cml0ZVVJbnQxNih0aGlzLnR5cGUpXG4gIH0gZWxzZSB7XG4gICAgYnVmZmVyV3JpdGVyLndyaXRlSW50MzIodGhpcy52ZXJzaW9uKVxuICB9XG5cbiAgdmFyIGhhc1dpdG5lc3NlcyA9IF9fYWxsb3dXaXRuZXNzICYmIHRoaXMuaGFzV2l0bmVzc2VzKClcblxuICBpZiAoaGFzV2l0bmVzc2VzKSB7XG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDgoVHJhbnNhY3Rpb24uQURWQU5DRURfVFJBTlNBQ1RJT05fTUFSS0VSKVxuICAgIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQ4KFRyYW5zYWN0aW9uLkFEVkFOQ0VEX1RSQU5TQUNUSU9OX0ZMQUcpXG4gIH1cblxuICBidWZmZXJXcml0ZXIud3JpdGVWYXJJbnQodGhpcy5pbnMubGVuZ3RoKVxuXG4gIHRoaXMuaW5zLmZvckVhY2goZnVuY3Rpb24gKHR4SW4pIHtcbiAgICBidWZmZXJXcml0ZXIud3JpdGVTbGljZSh0eEluLmhhc2gpXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKHR4SW4uaW5kZXgpXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVmFyU2xpY2UodHhJbi5zY3JpcHQpXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVUludDMyKHR4SW4uc2VxdWVuY2UpXG4gIH0pXG5cbiAgYnVmZmVyV3JpdGVyLndyaXRlVmFySW50KHRoaXMub3V0cy5sZW5ndGgpXG4gIHRoaXMub3V0cy5mb3JFYWNoKGZ1bmN0aW9uICh0eE91dCkge1xuICAgIGlmICghdHhPdXQudmFsdWVCdWZmZXIpIHtcbiAgICAgIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQ2NCh0eE91dC52YWx1ZSlcbiAgICB9IGVsc2Uge1xuICAgICAgYnVmZmVyV3JpdGVyLndyaXRlU2xpY2UodHhPdXQudmFsdWVCdWZmZXIpXG4gICAgfVxuXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVmFyU2xpY2UodHhPdXQuc2NyaXB0KVxuICB9KVxuXG4gIGlmIChoYXNXaXRuZXNzZXMpIHtcbiAgICB0aGlzLmlucy5mb3JFYWNoKGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgYnVmZmVyV3JpdGVyLndyaXRlVmVjdG9yKGlucHV0LndpdG5lc3MpXG4gICAgfSlcbiAgfVxuXG4gIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQzMih0aGlzLmxvY2t0aW1lKVxuXG4gIGlmICh0aGlzLmlzT3ZlcndpbnRlckNvbXBhdGlibGUoKSkge1xuICAgIGJ1ZmZlcldyaXRlci53cml0ZVVJbnQzMih0aGlzLmV4cGlyeUhlaWdodClcbiAgfVxuXG4gIGlmICh0aGlzLmlzU2FwbGluZ0NvbXBhdGlibGUoKSkge1xuICAgIGJ1ZmZlcldyaXRlci53cml0ZVNsaWNlKFZBTFVFX0lOVDY0X1pFUk8pXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVmFySW50KDApIC8vIHZTaGllbGRlZFNwZW5kTGVuZ3RoXG4gICAgYnVmZmVyV3JpdGVyLndyaXRlVmFySW50KDApIC8vIHZTaGllbGRlZE91dHB1dExlbmd0aFxuICB9XG5cbiAgaWYgKHRoaXMuc3VwcG9ydHNKb2luU3BsaXRzKCkpIHtcbiAgICBidWZmZXJXcml0ZXIud3JpdGVWYXJJbnQoMCkgLy8gam9pbnNTcGxpdHMgbGVuZ3RoXG4gIH1cblxuICBpZiAodGhpcy5pc0Rhc2hTcGVjaWFsVHJhbnNhY3Rpb24oKSkge1xuICAgIGJ1ZmZlcldyaXRlci53cml0ZVZhclNsaWNlKHRoaXMuZXh0cmFQYXlsb2FkKVxuICB9XG5cbiAgaWYgKGluaXRpYWxPZmZzZXQgIT09IHVuZGVmaW5lZCkgcmV0dXJuIGJ1ZmZlci5zbGljZShpbml0aWFsT2Zmc2V0LCBidWZmZXJXcml0ZXIub2Zmc2V0KVxuICAvLyBhdm9pZCBzbGljaW5nIHVubGVzcyBuZWNlc3NhcnlcbiAgLy8gVE9ETyAoaHR0cHM6Ly9naXRodWIuY29tL0JpdEdvL2JpdGdvLXV0eG8tbGliL2lzc3Vlcy8xMSk6IHdlIHNob3VsZG4ndCBoYXZlIHRvIHNsaWNlIHRoZSBmaW5hbCBidWZmZXJcbiAgcmV0dXJuIGJ1ZmZlci5zbGljZSgwLCBidWZmZXJXcml0ZXIub2Zmc2V0KVxufVxuXG5UcmFuc2FjdGlvbi5wcm90b3R5cGUudG9IZXggPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpXG59XG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5zZXRJbnB1dFNjcmlwdCA9IGZ1bmN0aW9uIChpbmRleCwgc2NyaXB0U2lnKSB7XG4gIHR5cGVmb3JjZSh0eXBlcy50dXBsZSh0eXBlcy5OdW1iZXIsIHR5cGVzLkJ1ZmZlciksIGFyZ3VtZW50cylcblxuICB0aGlzLmluc1tpbmRleF0uc2NyaXB0ID0gc2NyaXB0U2lnXG59XG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5zZXRXaXRuZXNzID0gZnVuY3Rpb24gKGluZGV4LCB3aXRuZXNzKSB7XG4gIHR5cGVmb3JjZSh0eXBlcy50dXBsZSh0eXBlcy5OdW1iZXIsIFt0eXBlcy5CdWZmZXJdKSwgYXJndW1lbnRzKVxuXG4gIHRoaXMuaW5zW2luZGV4XS53aXRuZXNzID0gd2l0bmVzc1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zYWN0aW9uXG4iXX0=