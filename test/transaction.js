/* global describe, it, beforeEach */

var assert = require('assert')
var bscript = require('../src/script')
var fixtures = require('./fixtures/transaction')
var Transaction = require('../src/transaction')

describe('Transaction', function () {
  function fromRaw (raw, noWitness) {
    var tx = new Transaction()
    tx.version = raw.version
    tx.locktime = raw.locktime

    raw.ins.forEach(function (txIn, i) {
      var txHash = Buffer.from(txIn.hash, 'hex')
      var scriptSig

      if (txIn.data) {
        scriptSig = Buffer.from(txIn.data, 'hex')
      } else if (txIn.script) {
        scriptSig = bscript.fromASM(txIn.script)
      }

      tx.addInput(txHash, txIn.index, txIn.sequence, scriptSig)

      if (!noWitness && txIn.witness) {
        var witness = txIn.witness.map(function (x) {
          return Buffer.from(x, 'hex')
        })

        tx.setWitness(i, witness)
      }
    })

    raw.outs.forEach(function (txOut) {
      var script

      if (txOut.data) {
        script = Buffer.from(txOut.data, 'hex')
      } else if (txOut.script) {
        script = bscript.fromASM(txOut.script)
      }

      tx.addOutput(script, txOut.value)
    })

    return tx
  }

  describe('fromhex/updateidentityrawtransaction', function () { 
    var NETWORKS = require('../src/networks')
    const data = "0400008085202f8902f2cb3b314d696d42727e5e41afb580fdf1ae832c6c644ef2c3d3c09ccfc32e0800000000694c670101010121024869121136c45512174fa34d9368621a4cd9545691603e154425a29d01bebbb74070651093aa5f016b13edced71e19acff62ae303bfe6f332fe013611f4b897bb72ef04711f38a9e02688599d9f970b108f74f061094cf25086868087e40adcbbdffffffff1f5c4ea6ee3e632e063cf04ec82ace392d6c2aef73f23f0c981690462fe25697000000006a47304402202b361c0f78b61677d0eaad1b982ff635d02c6f640635d552641cd192ea4f3fa202205488a48b0ebadb6d2beb5de8490eb5a8e497577bb8a5b186a6dd2d51bb248fa50121023a7921bddaa0faf0a308e764a234db05af51ccfc6a6fed5645a85fc65084e054ffffffff020000000000000000fd200147040300010315042c0d13af98a412ad79e77cfdee70bac119b054fa15042c0d13af98a412ad79e77cfdee70bac119b054fa15042c0d13af98a412ad79e77cfdee70bac119b054facc4cd404030e010115042c0d13af98a412ad79e77cfdee70bac119b054fa4c7f0300000000000000011472aa70e6a4c0d0ff07541c5fbe4f08cacd89d35b01000000a6ef9ea235635e328124ff3429db9f9e91b64e2d05636861643700002c0d13af98a412ad79e77cfdee70bac119b054fa2c0d13af98a412ad79e77cfdee70bac119b054fa00a6ef9ea235635e328124ff3429db9f9e91b64e2d000000001b04030f010115042c0d13af98a412ad79e77cfdee70bac119b054fa1b040310010115042c0d13af98a412ad79e77cfdee70bac119b054fa75bfba1000000000001976a91457039002dd39cc6cf5469d7b99a2b8ca6194a9a088ac00000000e8e101000000000000000000000000"

    var actual = Transaction.fromHex(data, NETWORKS.verustest);
    var script = actual.outs[0].script;
    console.log(actual)
  })

  describe('fromBuffer/fromHex', function () {
    function importExport (f) {
      var id = f.id || f.hash
      var txHex = f.hex || f.txHex

      it('imports ' + f.description + ' (' + id + ')', function () {
        var actual = Transaction.fromHex(txHex)

        assert.strictEqual(actual.toHex(), txHex)
      })

      if (f.whex) {
        it('imports ' + f.description + ' (' + id + ') as witness', function () {
          var actual = Transaction.fromHex(f.whex)

          assert.strictEqual(actual.toHex(), f.whex)
        })
      }
    }

    fixtures.valid.forEach(importExport)
    fixtures.hashForSignature.forEach(importExport)
    fixtures.hashForWitnessV0.forEach(importExport)

    fixtures.invalid.fromBuffer.forEach(function (f) {
      it('throws on ' + f.exception, function () {
        assert.throws(function () {
          Transaction.fromHex(f.hex)
        }, new RegExp(f.exception))
      })
    })

    it('.version should be interpreted as an int32le', function () {
      var txHex = 'ffffffff0000ffffffff'
      var tx = Transaction.fromHex(txHex)
      assert.equal(-1, tx.version)
      assert.equal(0xffffffff, tx.locktime)
    })
  })

  describe('toBuffer/toHex', function () {
    fixtures.valid.forEach(function (f) {
      it('exports ' + f.description + ' (' + f.id + ')', function () {
        var actual = fromRaw(f.raw, true)
        assert.strictEqual(actual.toHex(), f.hex)
      })

      if (f.whex) {
        it('exports ' + f.description + ' (' + f.id + ') as witness', function () {
          var wactual = fromRaw(f.raw)
          assert.strictEqual(wactual.toHex(), f.whex)
        })
      }
    })

    it('accepts target Buffer and offset parameters', function () {
      var f = fixtures.valid[0]
      var actual = fromRaw(f.raw)
      var byteLength = actual.byteLength()

      var target = Buffer.alloc(byteLength * 2)
      var a = actual.toBuffer(target, 0)
      var b = actual.toBuffer(target, byteLength)

      assert.strictEqual(a.length, byteLength)
      assert.strictEqual(b.length, byteLength)
      assert.strictEqual(a.toString('hex'), f.hex)
      assert.strictEqual(b.toString('hex'), f.hex)
      assert.deepEqual(a, b)
      assert.deepEqual(a, target.slice(0, byteLength))
      assert.deepEqual(b, target.slice(byteLength))
    })
  })

  describe('hasWitnesses', function () {
    fixtures.valid.forEach(function (f) {
      it('detects if the transaction has witnesses: ' + (f.whex ? 'true' : 'false'), function () {
        assert.strictEqual(Transaction.fromHex(f.whex ? f.whex : f.hex).hasWitnesses(), !!f.whex)
      })
    })
  })

  describe('weight/virtualSize', function () {
    it('computes virtual size', function () {
      fixtures.valid.forEach(function (f) {
        var transaction = Transaction.fromHex(f.whex ? f.whex : f.hex)

        assert.strictEqual(transaction.virtualSize(), f.virtualSize)
      })
    })

    it('computes weight', function () {
      fixtures.valid.forEach(function (f) {
        var transaction = Transaction.fromHex(f.whex ? f.whex : f.hex)

        assert.strictEqual(transaction.weight(), f.weight)
      })
    })
  })

  describe('addInput', function () {
    var prevTxHash
    beforeEach(function () {
      prevTxHash = Buffer.from('ffffffff00ffff000000000000000000000000000000000000000000101010ff', 'hex')
    })

    it('returns an index', function () {
      var tx = new Transaction()
      assert.strictEqual(tx.addInput(prevTxHash, 0), 0)
      assert.strictEqual(tx.addInput(prevTxHash, 0), 1)
    })

    it('defaults to empty script, witness and 0xffffffff SEQUENCE number', function () {
      var tx = new Transaction()
      tx.addInput(prevTxHash, 0)

      assert.strictEqual(tx.ins[0].script.length, 0)
      assert.strictEqual(tx.ins[0].witness.length, 0)
      assert.strictEqual(tx.ins[0].sequence, 0xffffffff)
    })

    fixtures.invalid.addInput.forEach(function (f) {
      it('throws on ' + f.exception, function () {
        var tx = new Transaction()
        var hash = Buffer.from(f.hash, 'hex')

        assert.throws(function () {
          tx.addInput(hash, f.index)
        }, new RegExp(f.exception))
      })
    })
  })

  describe('addOutput', function () {
    it('returns an index', function () {
      var tx = new Transaction()
      assert.strictEqual(tx.addOutput(Buffer.alloc(0), 0), 0)
      assert.strictEqual(tx.addOutput(Buffer.alloc(0), 0), 1)
    })
  })

  describe('clone', function () {
    fixtures.valid.forEach(function (f) {
      var actual, expected

      beforeEach(function () {
        expected = Transaction.fromHex(f.hex)
        actual = expected.clone()
      })

      it('should have value equality', function () {
        assert.deepEqual(actual, expected)
      })

      it('should not have reference equality', function () {
        assert.notEqual(actual, expected)
      })
    })
  })

  describe('getHash/getId', function () {
    function verify (f) {
      it('should return the id for ' + f.id + '(' + f.description + ')', function () {
        var tx = Transaction.fromHex(f.whex || f.hex)

        assert.strictEqual(tx.getHash().toString('hex'), f.hash)
        assert.strictEqual(tx.getId(), f.id)
      })
    }

    fixtures.valid.forEach(verify)
  })

  describe('isCoinbase', function () {
    function verify (f) {
      it('should return ' + f.coinbase + ' for ' + f.id + '(' + f.description + ')', function () {
        var tx = Transaction.fromHex(f.hex)

        assert.strictEqual(tx.isCoinbase(), f.coinbase)
      })
    }

    fixtures.valid.forEach(verify)
  })

  describe('hashForSignature', function () {
    it('does not use Witness serialization', function () {
      var randScript = Buffer.from('6a', 'hex')

      var tx = new Transaction()
      tx.addInput(Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'), 0)
      tx.addOutput(randScript, 5000000000)

      var original = tx.__toBuffer
      tx.__toBuffer = function (a, b, c) {
        if (c !== false) throw new Error('hashForSignature MUST pass false')

        return original.call(this, a, b, c)
      }

      assert.throws(function () {
        tx.__toBuffer(undefined, undefined, true)
      }, /hashForSignature MUST pass false/)

      // assert hashForSignature does not pass false
      assert.doesNotThrow(function () {
        tx.hashForSignature(0, randScript, 1)
      })
    })

    fixtures.hashForSignature.forEach(function (f) {
      it('should return ' + f.hash + ' for ' + (f.description ? ('case "' + f.description + '"') : f.script), function () {
        var tx = Transaction.fromHex(f.txHex)
        var script = bscript.fromASM(f.script)

        assert.strictEqual(tx.hashForSignature(f.inIndex, script, f.type).toString('hex'), f.hash)
      })
    })
  })

  describe('hashForWitnessV0', function () {
    fixtures.hashForWitnessV0.forEach(function (f) {
      it('should return ' + f.hash + ' for ' + (f.description ? ('case "' + f.description + '"') : ''), function () {
        var tx = Transaction.fromHex(f.txHex)
        var script = bscript.fromASM(f.script)

        assert.strictEqual(tx.hashForWitnessV0(f.inIndex, script, f.value, f.type).toString('hex'), f.hash)
      })
    })
  })

  describe('setWitness', function () {
    it('only accepts a a witness stack (Array of Buffers)', function () {
      assert.throws(function () {
        (new Transaction()).setWitness(0, 'foobar')
      }, /Expected property "1" of type \[Buffer], got String "foobar"/)
    })
  })
})
