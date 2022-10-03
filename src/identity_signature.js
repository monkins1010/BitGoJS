var Buffer = require('safe-buffer').Buffer
var varuint = require('varuint-bitcoin')
var bufferutils = require('./bufferutils');
var { fromBase58Check } = require('./address');
var { sha256 } = require('./crypto');
var createHash = require('create-hash')
var ECSignature = require('./ecsignature')
var ECPair = require('./ecpair')
var BigInteger = require('bigi')

const VERUS_DATA_SIGNATURE_PREFIX_STRING = "Verus signed data:\n"

var bufferWriter = new bufferutils.BufferWriter(
  Buffer.allocUnsafe(VERUS_DATA_SIGNATURE_PREFIX_STRING.length + 1)
);

bufferWriter.writeVarSlice(Buffer.from("Verus signed data:\n", "utf-8"));

const VERUS_DATA_SIGNATURE_PREFIX = bufferWriter.buffer;

class IdentitySignature {
  constructor(network, version = 1, hashType = 1, blockHeight = 0, signatures, chainId, iAddress) {
    this.version = version;
    this.hashType = hashType;
    this.blockHeight = blockHeight;
    this.chainId = chainId == null ? null : fromBase58Check(chainId).hash;
    this.identity = iAddress == null ? null : fromBase58Check(iAddress).hash;
    this.network = network;

    if (signatures != null) {
      this.signatures = signatures;
    } else {
      this.signatures = [];
    }
  }

  hashMessage(msg) {
    const rawMsgBuffer = Buffer.from(msg.toLowerCase(), "utf8");
    var msgBufferWriter = new bufferutils.BufferWriter(
      Buffer.allocUnsafe(varuint.encodingLength(msg.length) + msg.length)
    );

    msgBufferWriter.writeVarSlice(rawMsgBuffer);

    const _msgHash = sha256(msgBufferWriter.buffer);

    var heightBufferWriter = new bufferutils.BufferWriter(Buffer.allocUnsafe(4));
    heightBufferWriter.writeUInt32(this.blockHeight);

    return createHash("sha256")
      .update(VERUS_DATA_SIGNATURE_PREFIX)
      .update(this.chainId)
      .update(heightBufferWriter.buffer)
      .update(this.identity)
      .update(_msgHash)
      .digest();
  }

  signMessageOffline(msg, keyPair) {
    return this.signHashOffline(this.hashMessage(msg), keyPair)
  }

  verifyMessageOffline(msg, signingAddress) {
    return this.verifyHashOffline(this.hashMessage(msg), signingAddress)
  }

  signHashOffline(buffer, keyPair) {
    if (this.version !== 1) throw new Error("Versions above 1 not supported");

    var signature = keyPair.sign(buffer);
    if (Buffer.isBuffer(signature)) signature = ECSignature.fromRSBuffer(signature);

    const recid = keyPair.Q.affineY.and(BigInteger.fromHex("01")).toBuffer()[0]
    const compactSig = signature.toCompact(recid, true);

    this.signatures.push(compactSig)

    return compactSig;
  }

  // In this case keyPair refers to the ECPair containing at minimum
  // a pubkey. This function returns an array of booleans indicating which
  // signatures passed and failed
  verifyHashOffline(hash, signingAddress) {
    if (this.version !== 1) throw new Error("Versions above 1 not supported");
    if (this.signatures.length == 0) throw new Error("No signatures to verify");
    const results = [];

    for (let i = 0; i < this.signatures.length; i++) {
      try {
        const sig = ECSignature.parseCompact(this.signatures[i]);

        const pubKeyPair = ECPair.recoverFromSignature(hash, sig.signature.toCompact(sig.i, true), this.network);

        if (pubKeyPair.getAddress() === signingAddress) {
          const verification = pubKeyPair.verify(hash, sig.signature);
          results.push(verification);
        } else {
          results.push(false);
        }
      } catch (e) {
        console.log(e)
        results.push(false);
      }
    }

    return results;
  }
  
  fromBuffer(buffer, initialOffset, chainId, iAddress) {
    var bufferReader = new bufferutils.BufferReader(buffer, initialOffset || 0);

    this.version = bufferReader.readUInt8();
    this.blockHeight = bufferReader.readUInt32();
    const numSigs = bufferReader.readUInt8();

    this.chainId = chainId == null ? null : fromBase58Check(chainId).hash;
    this.identity = iAddress == null ? null : fromBase58Check(iAddress).hash;

    for (let i = 0; i < numSigs; i++) {
      this.signatures.push(bufferReader.readVarSlice())
    }

    return bufferReader.offset;
  }

  __byteLength() {
    let totalSigLength = 0

    this.signatures.forEach((sig) => {
      totalSigLength += sig.length;
    });

    return 6 + varuint.encodingLength(this.signatures.length) + totalSigLength;
  }

  toBuffer(buffer, initialOffset) {
    var noBuffer = !buffer;
    if (noBuffer) buffer = Buffer.allocUnsafe(this.__byteLength());
    var bufferWriter = new bufferutils.BufferWriter(buffer, initialOffset || 0);

    //bufferWriter.writeUInt8(this.version);
    bufferWriter.writeUInt8(this.version);
    bufferWriter.writeUInt32(this.blockHeight);
    bufferWriter.writeUInt8(this.signatures.length); // num signatures

    for (const sig of this.signatures) {
      bufferWriter.writeVarSlice(sig);
    }

    // avoid slicing unless necessary
    if (initialOffset !== undefined)
      return noBuffer
        ? bufferWriter.buffer.slice(initialOffset, bufferWriter.offset)
        : bufferWriter.offset;
    // TODO (https://github.com/BitGo/bitgo-utxo-lib/issues/11): we shouldn't have to slice the final buffer
    return noBuffer ? bufferWriter.buffer.slice(0, bufferWriter.offset) : bufferWriter.offset;
  }
}

module.exports = IdentitySignature