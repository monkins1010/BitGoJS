// OP_0 [signatures ...]

var Buffer = require('safe-buffer').Buffer
var bscript = require('../../script')
var p2sto = require('./output')
var typeforce = require('typeforce')
var varuint = require('varuint-bitcoin')
var OPS = require('bitcoin-ops')

function partialSignature (value) {
  return value === OPS.OP_0 || bscript.isCanonicalSignature(value)
}

class SmartTransactionSignature {
  constructor(version = 1, sigType = 1, pubKeyData, oneSignature)
  {
    this.sigType = sigType
    this.pubKeyData = pubKeyData
    this.oneSignature = oneSignature
  }

  fromBuffer(buffer, initialOffset)
  {
    var offset = initialOffset || 0
    function readSlice (n) {
      offset += n
      return buffer.slice(offset - n, offset)
    }
  
    function readUInt8 () {
      var i = buffer.readUInt8(offset)
      offset += 1
      return i
    }
  
    function readVarInt () {
      var vi = varuint.decode(buffer, offset)
      offset += varuint.decode.bytes
      return vi
    }
  
    function readVarSlice () {
      return readSlice(readVarInt())
    }

    this.sigType = readUInt8()
    this.pubKeyData = readVarSlice()
    this.oneSignature = readVarSlice()
    return offset
  }

  __byteLength()
  {
    return 1 + 
           varuint.encodingLength(this.pubKeyData.length) + this.pubKeyData.length + 
           varuint.encodingLength(this.oneSignature.length) + this.oneSignature.length
  }

  toBuffer(buffer, initialOffset)
  {
    var noBuffer = !buffer;
    if (noBuffer) buffer = Buffer.allocUnsafe(this.__byteLength())
    var offset = initialOffset || 0
    function writeSlice (slice) { offset += slice.copy(buffer, offset) }
    function writeUInt8 (i) { offset = buffer.writeUInt8(i, offset) }
    function writeVarInt (i) {
      varuint.encode(i, buffer, offset)
      offset += varuint.encode.bytes
    }
    function writeVarSlice (slice) { writeVarInt(slice.length); writeSlice(slice) }

    writeUInt8(this.sigType)
    writeVarSlice(this.pubKeyData)
    writeVarSlice(this.oneSignature)

    // avoid slicing unless necessary
    if (initialOffset !== undefined) return noBuffer ? buffer.slice(initialOffset, offset) : offset
    // TODO (https://github.com/BitGo/bitgo-utxo-lib/issues/11): we shouldn't have to slice the final buffer
    return noBuffer ? buffer.slice(0, offset) : offset
  }
}

class SmartTransactionSignatures {
  constructor(version = 1, sigHashType = 1, signatures) {
    this.version = version
    this.sigHashType = sigHashType
    this.signatures = signatures ? signatures : []
  }

  isValid()
  {
    return this.version > 0 && this.version < 2 && isDefinedHashType(this.sigHashType) && this.signatures.length > 0
  }

  __byteLength()
  {
    return this.signatures.reduce(function (a, x) { return a + x.__byteLength() }, 2 + varuint.encodingLength(this.signatures.length))
  }

  toBuffer(buffer, initialOffset)
  {
    var noBuffer = !buffer;
    if (noBuffer) buffer = Buffer.allocUnsafe(this.__byteLength())
    var offset = initialOffset || 0
    function writeSlice (slice) { offset += slice.copy(buffer, offset) }
    function writeUInt8 (i) { offset = buffer.writeUInt8(i, offset) }
    function writeVarInt (i) {
      varuint.encode(i, buffer, offset)
      offset += varuint.encode.bytes
    }
    function writeVarSlice (slice) { writeVarInt(slice.length); writeSlice(slice) }
    function writeVector(vector) {
      this.writeVarInt(vector.length);
      vector.forEach((buf) => this.writeVarSlice(buf));
    }

    writeUInt8(this.version)
    writeUInt8(this.sigHashType)
    writeVarInt(this.signatures ? this.signatures.length : 0)
    this.signatures.array.forEach(x => 
      { 
        offset = x.toBuffer(buffer, offset)
      })

    // avoid slicing unless necessary
    if (initialOffset !== undefined) return noBuffer ? buffer.slice(initialOffset, offset) : offset
    // TODO (https://github.com/BitGo/bitgo-utxo-lib/issues/11): we shouldn't have to slice the final buffer
    return noBuffer ? buffer.slice(0, offset) : offset
  }
  
  fromBuffer(buffer, initialOffset)
  {
    var offset = initialOffset || 0

    function readUInt8 () {
      var i = buffer.readUInt8(offset)
      offset += 1
      return i
    }
  
    function readVarInt () {
      var vi = varuint.decode(buffer, offset)
      offset += varuint.decode.bytes
      return vi
    }
  
    function readOneSig()
    {
      var oneSig = new SmartTransactionSignature()
      offset = oneSig.fromBuffer(buffer, offset)
      return oneSig
    }
  
    try {
      this.version = readUInt8()
      this.sigHashType = readUInt8()
      this.signatures = this.signatures ?? []
      for (let numSignatures = readVarInt(); numSignatures > 0; numSignatures--)
      {
        this.signatures[this.signatures.length] = readOneSig()
      }
    } catch (error) {
      console.log(error)
      this.version = 0
      return initialOffset || 0
    }
    return offset
  }
}

function check (chunks) {
  if (chunks.length != 1) return false

  checkSigs = new SmartTransactionSignatures();
  checkSigs.fromBuffer(chunks[0])
  return checkSigs.isValid();
}
check.toJSON = function () { return 'smart transaction input' }

var EMPTY_BUFFER = Buffer.allocUnsafe(0)

function encodeStack (signatures, scriptPubKey) {
  typeforce([partialSignature], signatures)

  if (scriptPubKey) {
    var scriptData = p2sto.decode(scriptPubKey)

    if (signatures.length < scriptData.m) {
      throw new TypeError('Not enough signatures provided')
    }

    if (signatures.length > scriptData.pubKeys.length) {
      throw new TypeError('Too many signatures provided')
    }
  }

  return [].concat(EMPTY_BUFFER, signatures.map(function (sig) {
    if (sig === OPS.OP_0) {
      return EMPTY_BUFFER
    }
    return sig
  }))
}

function encode (signatures, scriptPubKey) {
  return bscript.compile(encodeStack(signatures, scriptPubKey))
}

function decodeStack (stack, allowIncomplete) {
  typeforce(check, stack, allowIncomplete)
  return stack.slice(1)
}

function decode (buffer, allowIncomplete) {
  var stack = bscript.decompile(buffer)
  return decodeStack(stack, allowIncomplete)
}

module.exports = {
  check: check,
  decode: decode,
  decodeStack: decodeStack,
  encode: encode,
  encodeStack: encodeStack
}
