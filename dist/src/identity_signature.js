var Buffer = require('safe-buffer').Buffer;
var varuint = require('varuint-bitcoin');
var bufferutils = require('./bufferutils');
var fromBase58Check = require('./address').fromBase58Check;
var sha256 = require('./crypto').sha256;
var createHash = require('create-hash');
var ECSignature = require('./ecsignature');
var VERUS_DATA_SIGNATURE_PREFIX_STRING = "Verus signed data:\n";
var bufferWriter = new bufferutils.BufferWriter(Buffer.allocUnsafe(VERUS_DATA_SIGNATURE_PREFIX_STRING.length + 1));
bufferWriter.writeVarSlice(Buffer.from("Verus signed data:\n", "utf-8"));
var VERUS_DATA_SIGNATURE_PREFIX = bufferWriter.buffer;
var IdentitySignature = /** @class */ (function () {
    function IdentitySignature(version, hashType, blockHeight, signatures, chainId, iAddress) {
        if (version === void 0) { version = 1; }
        if (hashType === void 0) { hashType = 1; }
        if (blockHeight === void 0) { blockHeight = 0; }
        this.version = version;
        this.hashType = hashType;
        this.blockHeight = blockHeight;
        this.chainId = chainId == null ? null : fromBase58Check(chainId).hash;
        this.identity = iAddress == null ? null : fromBase58Check(iAddress).hash;
        if (signatures != null) {
            this.signatures = signatures;
        }
        else {
            this.signatures = null;
        }
    }
    IdentitySignature.prototype.hashMessage = function (msg) {
        var rawMsgBuffer = Buffer.from(msg.toLowerCase(), "utf8");
        var msgBufferWriter = new bufferutils.BufferWriter(Buffer.allocUnsafe(varuint.encodingLength(msg.length) + msg.length));
        msgBufferWriter.writeVarSlice(rawMsgBuffer);
        var _msgHash = sha256(msgBufferWriter.buffer);
        var heightBufferWriter = new bufferutils.BufferWriter(Buffer.allocUnsafe(4));
        heightBufferWriter.writeUInt32(this.blockHeight);
        return createHash("sha256")
            .update(VERUS_DATA_SIGNATURE_PREFIX)
            .update(this.chainId)
            .update(heightBufferWriter.buffer)
            .update(this.identity)
            .update(_msgHash)
            .digest();
    };
    IdentitySignature.prototype.signMessageOffline = function (msg, keyPair) {
        if (this.version !== 1)
            throw new Error("Versions above 1 not supported");
        var signature = keyPair.sign(this.hashMessage(msg));
        if (Buffer.isBuffer(signature))
            signature = ECSignature.fromRSBuffer(signature);
        var compactSig = signature.toCompact(0, true);
        this.signatures = compactSig;
        return compactSig;
    };
    // In this case keyPair refers to the ECPair containing at minimum 
    // a pubkey
    IdentitySignature.prototype.verifyMessageOffline = function (msg, keyPair) {
        if (this.version !== 1)
            throw new Error("Versions above 1 not supported");
        if (this.signatures == null)
            throw new Error("No signatures to verify");
        return keyPair.verify(this.hashMessage(msg), ECSignature.parseCompact(this.signatures).signature);
    };
    IdentitySignature.prototype.fromBuffer = function (buffer, initialOffset, chainId, iAddress) {
        var bufferReader = new bufferutils.BufferReader(buffer, initialOffset || 0);
        this.version = bufferReader.readUInt8();
        this.blockHeight = bufferReader.readUInt32();
        var numSigs = bufferReader.readUInt8();
        if (numSigs !== 1)
            throw new Error("Multiple signatures is not currently supported");
        this.chainId = chainId == null ? null : fromBase58Check(chainId).hash;
        this.identity = iAddress == null ? null : fromBase58Check(iAddress).hash;
        this.signatures = bufferReader.readVarSlice();
        return bufferReader.offset;
    };
    IdentitySignature.prototype.__byteLength = function () {
        return 6 + varuint.encodingLength(this.signatures.length) + this.signatures.length;
    };
    IdentitySignature.prototype.toBuffer = function (buffer, initialOffset) {
        var noBuffer = !buffer;
        if (noBuffer)
            buffer = Buffer.allocUnsafe(this.__byteLength());
        var bufferWriter = new bufferutils.BufferWriter(buffer, initialOffset || 0);
        //bufferWriter.writeUInt8(this.version);
        bufferWriter.writeUInt8(this.version);
        bufferWriter.writeUInt32(this.blockHeight);
        bufferWriter.writeUInt8(1); // num signatures
        bufferWriter.writeVarSlice(this.signatures);
        // avoid slicing unless necessary
        if (initialOffset !== undefined)
            return noBuffer
                ? bufferWriter.buffer.slice(initialOffset, bufferWriter.offset)
                : bufferWriter.offset;
        // TODO (https://github.com/BitGo/bitgo-utxo-lib/issues/11): we shouldn't have to slice the final buffer
        return noBuffer ? bufferWriter.buffer.slice(0, bufferWriter.offset) : bufferWriter.offset;
    };
    return IdentitySignature;
}());
module.exports = IdentitySignature;
