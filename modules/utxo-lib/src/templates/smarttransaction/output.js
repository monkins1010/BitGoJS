// m [pubKeys ...] n OP_CHECKMULTISIG

var bscript = require('../../script')
var types = require('../../types')
var typeforce = require('typeforce')
var OPS = require('bitcoin-ops')
const networks = require('../../networks')
var OP_INT_BASE = OPS.OP_RESERVED // OP_1 - 1

function varSliceSize(varSlice)
{
  var length = varSlice.length
  return varuint.encodingLength(length) + length
}

function getSmartOutputObject(evalCode, optParams)
{
  switch (evalCode)
  {
    case OPS.EVAL_NONE:
      {
        return null
      }

    case OPS.EVAL_STAKEGUARD:
    case OPS.EVAL_CURRENCY_DEFINITION:
    case OPS.EVAL_NOTARY_EVIDENCE:
    case OPS.EVAL_EARNEDNOTARIZATION:
    case OPS.EVAL_ACCEPTEDNOTARIZATION:
    case OPS.EVAL_FINALIZE_NOTARIZATION:
    case OPS.EVAL_CURRENCYSTATE:
    case OPS.EVAL_RESERVE_TRANSFER:
    case OPS.EVAL_RESERVE_OUTPUT:
    case OPS.EVAL_RESERVE_DEPOSIT:
    case OPS.EVAL_CROSSCHAIN_EXPORT:
    case OPS.EVAL_CROSSCHAIN_IMPORT:
    case OPS.EVAL_IDENTITY_PRIMARY:
    case OPS.EVAL_IDENTITY_COMMITMENT:
    case OPS.EVAL_IDENTITY_RESERVATION:
    case OPS.EVAL_FINALIZE_EXPORT:
    case OPS.EVAL_FEE_POOL:
    case OPS.EVAL_NOTARY_SIGNATURE:
      {
        return optParams.vData[0]
      }

    default:
      {
        return null
      }
  }
}

class SmartObject
{
  constructor(EvalCode, ObjectBuffer)
  {
    this.evalCode = EvalCode
    if (ObjectBuffer)
    {
      this.objectBuffer = ObjectBuffer
    }
  }
}

/*
* A Verus identity object
*/
class VerusIdentity
{
  get VaultVer()
  {
    return 6
  }

  get PBaaSVer()
  {
    return 7
  }

  get IDVer()
  {
    return 5
  }

  IdVersionFromSolution(SolVer)
  {
    if (SolVer < VaultVer())
    {
      return 1
    }
    else if (SolVer < PBaaSVer())
    {
      return 2;
    }
    else
    {
      return 3;
    }
  }

  constructor(Version = IdVersionFromSolution(IDVer()), Flags=0, Name="", Parent, SystemID, PrimaryAddresses, MinSignatures, RevocationID, RecoveryID, ZEndpoints, ContentMap, Timelock)
  {
    this.version = Version
    this.flags = Flags
    this.name = Name
    if (Parent !== undefined)
    {
      this.parent = Parent
    }
    if (SystemID !== undefined)
    {
      this.systemID = SystemID
    }
    if (PrimaryAddresses !== undefined)
    {
      this.primaryaddresses = PrimaryAddresses
    }
    if (MinSignatures !== undefined)
    {
      this.minimumsignatures = MinSignatures
    }
    if (RevocationID !== undefined)
    {
      this.revocationauthority = RevocationID
    }
    if (RecoveryID !== undefined)
    {
      this.recoveryauthority = RecoveryID
    }
    if (ZEndpoints !== undefined)
    {
      if (ZEndpoints.length > 1)
      {
        this.privateaddresses = ZEndpoints
      }
      this.privateaddress = ZEndpoints[0]
    }
    if (ContentMap !== undefined)
    {
      this.contentmap = ContentMap
    }
    if (Timelock !== undefined)
    {
      this.timelock = Timelock
    }
  }


}

class VerusCurrencyState
{
  constructor()
  {

  }
}

class VerusCurrencyDefinition
{
  constructor()
  {
    
  }
}

class VerusPBaaSNotarization
{
  constructor()
  {
    
  }
}

class VerusProofRoot
{
  constructor()
  {
    
  }
}

class VerusNativeOutput
{
  constructor()
  {
    
  }
}

class VerusTokenOutput
{
  constructor()
  {
    
  }
}

class VerusReserveTransfer
{
  constructor()
  {
    
  }
}

class VerusExport
{
  constructor()
  {
    
  }
}

class VerusImport
{
  constructor()
  {
    
  }
}

class VerusObjectFinalization
{
  constructor()
  {
    
  }
}

class VerusNotaryEvidence
{
  constructor()
  {
    
  }
}

class TxDestination
{
  get typeInvalid()
  {
    return 0
  }
  get typePK()
  {
    return 1
  }
  get isPK()
  {
    return this.destType === this.typePK
  }
  get typePKH()
  {
    return 2
  }
  get isPKH()
  {
    return this.destType === this.typePKH
  }
  get typeSH()
  {
    return 3
  }
  get isSH()
  {
    return this.destType === this.typeSH
  }
  get typeID()
  {
    return 4
  }
  get isID()
  {
    return this.destType === this.typeID
  }
  get typeIndex()
  {
    return 5
  }
  get isIndex()
  {
    return this.destType === this.typeIndex
  }
  get typeQuantum()
  {
    return 6
  }
  get isQuantum()
  {
    return this.destType === this.typeQuantum
  }
  get typeLast()
  {
    return 6
  }
  constructor(destType=this.typePKH, destinationBytes=[])
  {
    this.destType = destType
    this.destinationBytes = destinationBytes
  }

  isValid()
  {
    return this.destType > this.typeInvalid && this.destType <= this.typeLast && this.destinationBytes && this.destinationBytes.length
  }

  fromBuffer(buffer, initialOffset)
  {
    var offset = initialOffset || 0
    function readSlice (n) {
      offset += n
      return buffer.slice(offset - n, offset)
    }
  
    function readVarInt () {
      var vi = varuint.decode(buffer, offset)
      offset += varuint.decode.bytes
      return vi
    }
  
    function readVarSlice () {
      return readSlice(readVarInt())
    }
  
    destByteVector = readVarSlice()
    if (destByteVector.length == 20)
    {
      this.destType = this.typePKH
      this.destinationBytes = destByteVector
    }
    else if (destByteVector.length == 33)
    {
      this.destType = this.typePK
      this.destinationBytes = destByteVector
    }
    else
    {
      this.destType = destByteVector.slice(0, 1)
      this.destinationBytes = destByteVector.slice(1)
    }
    return offset
  }

  __byteLength()
  {
    if (this.destType == this.typePKH)
    {
      return 20;
    }
    else if (this.destType == this.typePK)
    {
      return 33
    }
    else
    {
      return varuint.encodingLength(this.destinationBytes.length + 1) + this.destinationBytes.length + 1
    }
  }

  toBuffer(buffer, initialOffset)
  {
    if (!buffer) buffer = Buffer.allocUnsafe(this.__byteLength())
    var offset = initialOffset || 0
    function writeSlice (slice) { offset += slice.copy(buffer, offset) }
    function writeVarInt (i) {
      varuint.encode(i, buffer, offset)
      offset += varuint.encode.bytes
    }
    function writeVarSlice (slice) { writeVarInt(slice.length); writeSlice(slice) }

    if (this.destType == this.typePKH)
    {
      if (this.destinationBytes.length != 20)
      {
        throw new TypeError('invalid length for typePKH destination bytes')
      }
      writeVarSlice(this.destinationBytes)
    }
    else if (this.destType == this.typePK)
    {
      if (this.destinationBytes.length != 33)
      {
        throw new TypeError('invalid length for typePK destination bytes')
      }
      writeVarSlice(this.destinationBytes)
    }
    else
    {
      combinedVector = [this.destType]
      this.destinationBytes.forEach(x => { combinedVector.push(x) })
      writeVarSlice(combinedVector)
    }

    // avoid slicing unless necessary
    if (initialOffset !== undefined) return buffer.slice(initialOffset, offset)
    // TODO (https://github.com/BitGo/bitgo-utxo-lib/issues/11): we shouldn't have to slice the final buffer
    return buffer.slice(0, offset)    
  }
}

class OptCCParams
{
  constructor(version=3, evalCode=0, m=1, n=1, destinations=[], serializedObjects=[])
  {
    this.version = version
    this.evalCode = evalCode
    this.m = m
    this.n = n
    this.destinations = destinations
    this.vData = serializedObjects
  }

  getParamObject()
  {
    switch (this.evalCode)
    {
      case OPS.EVAL_NONE:
        {
          return null
        }
  
      case OPS.EVAL_STAKEGUARD:
      case OPS.EVAL_CURRENCY_DEFINITION:
      case OPS.EVAL_NOTARY_EVIDENCE:
      case OPS.EVAL_EARNEDNOTARIZATION:
      case OPS.EVAL_ACCEPTEDNOTARIZATION:
      case OPS.EVAL_FINALIZE_NOTARIZATION:
      case OPS.EVAL_CURRENCYSTATE:
      case OPS.EVAL_RESERVE_TRANSFER:
      case OPS.EVAL_RESERVE_OUTPUT:
      case OPS.EVAL_RESERVE_DEPOSIT:
      case OPS.EVAL_CROSSCHAIN_EXPORT:
      case OPS.EVAL_CROSSCHAIN_IMPORT:
      case OPS.EVAL_IDENTITY_PRIMARY:
      case OPS.EVAL_IDENTITY_COMMITMENT:
      case OPS.EVAL_IDENTITY_RESERVATION:
      case OPS.EVAL_FINALIZE_EXPORT:
      case OPS.EVAL_FEE_POOL:
      case OPS.EVAL_NOTARY_SIGNATURE:
        {
          if (this.vData.length)
          {
            return this.vData[0]
          }
          else
          {
            return null
          }
        }
  
      default:
        {
          return null
        }
    }
  }
  
  isValid()
  {
    var validEval = false;
    switch (evalCode)
    {
      case OPS.EVAL_NONE:
        {
          validEval = true
          break
        }

      case OPS.EVAL_STAKEGUARD:
      case OPS.EVAL_CURRENCY_DEFINITION:
      case OPS.EVAL_NOTARY_EVIDENCE:
      case OPS.EVAL_EARNEDNOTARIZATION:
      case OPS.EVAL_ACCEPTEDNOTARIZATION:
      case OPS.EVAL_FINALIZE_NOTARIZATION:
      case OPS.EVAL_CURRENCYSTATE:
      case OPS.EVAL_RESERVE_TRANSFER:
      case OPS.EVAL_RESERVE_OUTPUT:
      case OPS.EVAL_RESERVE_DEPOSIT:
      case OPS.EVAL_CROSSCHAIN_EXPORT:
      case OPS.EVAL_CROSSCHAIN_IMPORT:
      case OPS.EVAL_IDENTITY_PRIMARY:
      case OPS.EVAL_IDENTITY_COMMITMENT:
      case OPS.EVAL_IDENTITY_RESERVATION:
      case OPS.EVAL_FINALIZE_EXPORT:
      case OPS.EVAL_FEE_POOL:
      case OPS.EVAL_NOTARY_SIGNATURE:
        {
          validEval = this.vData && this.vData.length > 0
        }
    }
    return validEval &&
           this.version > 0 && this.version < 4 && ((this.version < 3 && this.evalCode < 2) || 
                                                    (this.evalCode <= 0x1a && this.m <= this.n && this.destinations.length > 0))
  }

  fromBuffer(buffer, initialOffset)
  {
    // the first element in this buffer will be a script to decompile and get pushed data from
    var offset = initialOffset || 0
    function readSlice (n) {
      offset += n
      return buffer.slice(offset - n, offset)
    }
  
    function readVarInt () {
      var vi = varuint.decode(buffer, offset)
      offset += varuint.decode.bytes
      return vi
    }
  
    function readVarSlice () {
      return readSlice(readVarInt())
    }
  
    scriptInVector = readVarSlice()
    chunks = bscript.decompile(scriptInVector)

    if (chunks[0].length != 4)
    {
      console.log("invalid optional parameters header")
      this.version = 0
      return offset
    }

    this.version = chunks[0].readUInt8(0)
    this.evalCode = chunks[0].readUInt8(1)
    this.m = chunks[0].readUInt8(2)
    this.n = chunks[0].readUInt8(3)

    // now, we should have n keys followed by data objects for later versions, otherwise all keys and one data object
    if (this.version <= 0 || 
        this.version > 3 || 
        this.evalCode < 0 || 
        this.evalCode > 0x1a || // this is the last valid eval code as of version 3
        (version < 3 && n < 1) ||
        n > 4 ||
        (version < 3 && n >= chunks.length) ||
        n > chunks.length)
    {
      console.log("invalid header values", this)
      this.version = 0
    }

    // now, we have chunks left that are either destinations or data vectors
    limit = this.n == chunks.length ? this.n : this.n + 1;
    this.destinations = []
    for (loop = 1; this.version && loop < limit; loop++)
    {
      oneDest = new TxDestination()
      oneDest.fromBuffer(chunks[loop])
      if (oneDest.isValid())
      {
        this.destinations.push(oneDest)
      }
      else
      {
        this.version = 0
      }
    }

    for ( ; this.version && loop < chunks.length; loop++)
    {
      this.vData.push(chunks[loop]) // is this an issue to just store as is for the data?
    }

    return offset
  }

  __byteLength()
  {
    chunks = [Buffer.allocUnsafe(4)]
    chunks[0][0] = this.version
    chunks[0][1] = this.evalCode
    chunks[0][2] = this.m
    chunks[0][3] = this.n
    this.destinations.forEach(x => {
      chunks.push(Buffer.allocUnsafe(x.__byteLength()))
      x.toBuffer(chunks[chunks.length - 1])
    });
    this.vData.forEach(x => {
      chunks.push(x)
    });
    return varSliceSize(bscript.compile(chunks))
  }

  toBuffer(buffer, initialOffset)
  {
    var offset = initialOffset || 0
    function writeSlice (slice) { offset += slice.copy(buffer, offset) }
    function writeVarInt (i) {
      varuint.encode(i, buffer, offset)
      offset += varuint.encode.bytes
    }
    function writeVarSlice (slice) { writeVarInt(slice.length); writeSlice(slice) }

    chunks = [Buffer.allocUnsafe(4)]
    chunks[0][0] = this.version
    chunks[0][1] = this.evalCode
    chunks[0][2] = this.m
    chunks[0][3] = this.n
    this.destinations.forEach(x => {
      chunks.push(Buffer.allocUnsafe(x.__byteLength()))
      x.toBuffer(chunks[chunks.length - 1])
    });
    this.vData.forEach(x => {
      chunks.push(x)
    });

    scriptStore = bscript.compile(chunks)
    if (!buffer) buffer = Buffer.allocUnsafe(varSliceSize(scriptStore))
    writeVarSlice(scriptStore)

    // avoid slicing unless necessary
    if (initialOffset !== undefined) return buffer.slice(initialOffset, offset)
    // TODO (https://github.com/BitGo/bitgo-utxo-lib/issues/11): we shouldn't have to slice the final buffer
    return buffer.slice(0, offset)    
  }
}

function check (chunks, allowIncomplete)
{
  // chunks for a smart transaction should include a push of either a CC or empty/master COptCCParams, then an OP_CHECKCRYPTOCONDITION,
  // then a potentially nested COptCCParams
  // we always start by decoding the second COptCCParams first to determine if the first one should be an opaque CC, as it was
  // in earlier versions. if not, it is added to the end of the data objects of the first params
  if (chunks.length <= 2 ||
      (chunks[chunks.length - 1] !== OPS.OP_CHECKCRYPTOCONDITION && chunks[chunks.length - 1] !== OPS.OP_CHECKCRYPTOCONDITIONVERIFY))
  {
    return false
  }
  optCCParams = new OptCCParams();
  optCCParams.fromBuffer(chunks[2])
  if (!optCCParams.isValid())
  {
    return false
  }

  // now validate eval codes, object presence, currencies, types, etc.

  return true
}
check.toJSON = function () { return 'smart transaction output' }

function encode (m, pubKeys) {
  typeforce({
    m: types.Number,
    pubKeys: [bscript.isCanonicalPubKey]
  }, {
    m: m,
    pubKeys: pubKeys
  })

  var n = pubKeys.length
  if (n < m) throw new TypeError('Not enough pubKeys provided')

  return bscript.compile([].concat(
    OP_INT_BASE + m,
    pubKeys,
    OP_INT_BASE + n,
    OPS.OP_CHECKMULTISIG
  ))
}

function decode (buffer, allowIncomplete) {
  var chunks = bscript.decompile(buffer)
  typeforce(check, chunks, allowIncomplete)

  return {
    m: chunks[0] - OP_INT_BASE,
    pubKeys: chunks.slice(1, -2)
  }
}

module.exports = {
  check: check,
  decode: decode,
  encode: encode
}
