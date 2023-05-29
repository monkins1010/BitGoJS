/**
 * @prettier
 */
/* global describe, it */
import * as assert from 'assert';
import { validateFundedTransaction } from '../src/transaction_validation';
import networks = require('../src/networks');

describe('txvalidation', function () {
  it('validates successful token output to p2pkh', function () {
    const unfundedtx = "0400008085202f89000100e1f505000000001976a91487bcb238974658d8bda6a19f9d3f2dd04339b8f788ac00000000f2aa00000000000000000000000000"
    const fundedtx = "0400008085202f89016b0611ccc9f1f3e4572c02f984de1999726625b1c482ace67581def10253e9050100000000feffffff02d066e20b00000000781a040300010114402f01e78edb0f5c8251658dde07f0d52b12e972cc4c59040309010114402f01e78edb0f5c8251658dde07f0d52b12e9723e86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c0090603008db080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d05000000007500e1f505000000001976a91487bcb238974658d8bda6a19f9d3f2dd04339b8f788ac00000000f2aa00000000000000000000000000"
    const changeaddr = "RF8ZdvjvGMNdtu3jNwcmaTDeU8hFJ28ajN"
    const system = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"
    const utxos = [
      {
        "address": "RF8ZdvjvGMNdtu3jNwcmaTDeU8hFJ28ajN",
        "txid": "05e95302f1de8175e6ac82c4b12566729919de84f9022c57e4f3f1c9cc11066b",
        "outputIndex": 1,
        "isspendable": 1,
        "script": "1a040300010114402f01e78edb0f5c8251658dde07f0d52b12e972cc4c59040309010114402f01e78edb0f5c8251658dde07f0d52b12e9723e86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c0090603008db080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d050000000075",
        "currencyvalues": {
          "iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM": 97368.28248208,
          "iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm": 0.90000000,
          "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq": 2.99396832
        },
        "currencynames": {},
        "satoshis": 299396832,
        "height": 39405,
        "blocktime": 1684580377
      }
    ]

    const validation = validateFundedTransaction(
      system, 
      fundedtx, 
      unfundedtx, 
      changeaddr, 
      networks.verustest, 
      utxos
    )

    assert.deepStrictEqual(validation, {
      valid: true,
      in: {
        iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: '299396832',
        iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM: '9736828248208',
        iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm: '90000000'
      },
      out: {
        iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: '299386832',
        iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM: '9736828248208',
        iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm: '90000000'
      },
      change: {
        iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: '199386832',
        iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM: '9736828248208',
        iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm: '90000000'
      },
      fees: {
        iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: '10000',
        iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM: '0',
        iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm: '0'
      },
      sent: {
        iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: '100000000',
        iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM: '0',
        iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm: '0'
      }
    })
  });

  it('fails on tx with no inputs', function () {
    const unfundedtx = "0400008085202f89000100e1f505000000001976a91487bcb238974658d8bda6a19f9d3f2dd04339b8f788ac00000000f2aa00000000000000000000000000"
    const fundedtx = '0400008085202f890002d066e20b00000000781a040300010114f9ff43bb7debfcb57a19eeb6b67e68733edbba55cc4c59040309010114f9ff43bb7debfcb57a19eeb6b67e68733edbba553e86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c0090603008db080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d05000000007500e1f505000000001976a91487bcb238974658d8bda6a19f9d3f2dd04339b8f788ac00000000f2aa00000000000000000000000000'
    const changeaddr = "RY548NkKzkWFPQpteeoaZ4FEnex8Rt8eoH"
    const system = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"
    const utxos = [
      {
        "address": "RF8ZdvjvGMNdtu3jNwcmaTDeU8hFJ28ajN",
        "txid": "05e95302f1de8175e6ac82c4b12566729919de84f9022c57e4f3f1c9cc11066b",
        "outputIndex": 1,
        "isspendable": 1,
        "script": "1a040300010114402f01e78edb0f5c8251658dde07f0d52b12e972cc4c59040309010114402f01e78edb0f5c8251658dde07f0d52b12e9723e86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c0090603008db080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d050000000075",
        "currencyvalues": {
          "iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM": 97368.28248208,
          "iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm": 0.90000000,
          "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq": 2.99396832
        },
        "currencynames": {},
        "satoshis": 299396832,
        "height": 39405,
        "blocktime": 1684580377
      }
    ]

    const validation = validateFundedTransaction(
      system, 
      fundedtx, 
      unfundedtx, 
      changeaddr, 
      networks.verustest, 
      utxos
    )

    assert.deepStrictEqual(validation, { valid: false, message: 'Transaction has 0 inputs.' })
  })

  it('fails on tx with too many outputs', function () {
    const unfundedtx = "0400008085202f89000100e1f505000000001976a91487bcb238974658d8bda6a19f9d3f2dd04339b8f788ac00000000f2aa00000000000000000000000000"
    const fundedtx = '0400008085202f89016b0611ccc9f1f3e4572c02f984de1999726625b1c482ace67581def10253e9050100000000feffffff04d066e20b00000000781a040300010114f9ff43bb7debfcb57a19eeb6b67e68733edbba55cc4c59040309010114f9ff43bb7debfcb57a19eeb6b67e68733edbba553e86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c0090603008db080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d05000000007500e1f505000000001976a91487bcb238974658d8bda6a19f9d3f2dd04339b8f788acd066e20b00000000781a040300010114f9ff43bb7debfcb57a19eeb6b67e68733edbba55cc4c59040309010114f9ff43bb7debfcb57a19eeb6b67e68733edbba553e86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c0090603008db080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d05000000007500e1f505000000001976a91487bcb238974658d8bda6a19f9d3f2dd04339b8f788ac00000000f2aa00000000000000000000000000'
    const changeaddr = "RY548NkKzkWFPQpteeoaZ4FEnex8Rt8eoH"
    const system = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"
    const utxos = [
      {
        "address": "RF8ZdvjvGMNdtu3jNwcmaTDeU8hFJ28ajN",
        "txid": "05e95302f1de8175e6ac82c4b12566729919de84f9022c57e4f3f1c9cc11066b",
        "outputIndex": 1,
        "isspendable": 1,
        "script": "1a040300010114402f01e78edb0f5c8251658dde07f0d52b12e972cc4c59040309010114402f01e78edb0f5c8251658dde07f0d52b12e9723e86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c0090603008db080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d050000000075",
        "currencyvalues": {
          "iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM": 97368.28248208,
          "iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm": 0.90000000,
          "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq": 2.99396832
        },
        "currencynames": {},
        "satoshis": 299396832,
        "height": 39405,
        "blocktime": 1684580377
      }
    ]

    const validation = validateFundedTransaction(
      system, 
      fundedtx, 
      unfundedtx, 
      changeaddr, 
      networks.verustest, 
      utxos
    )

    assert.deepStrictEqual(validation, { valid: false, message: "Some change destinations are not RY548NkKzkWFPQpteeoaZ4FEnex8Rt8eoH." })
  })

  it('fails on tx with different locktime than unfunded tx', function () {
    const unfundedtx = "0400008085202f89000100e1f505000000001976a91487bcb238974658d8bda6a19f9d3f2dd04339b8f788ac00000000f2aa00000000000000000000000000"
    const fundedtx = '0400008085202f89016b0611ccc9f1f3e4572c02f984de1999726625b1c482ace67581def10253e9050100000000feffffff02d066e20b00000000781a040300010114f9ff43bb7debfcb57a19eeb6b67e68733edbba55cc4c59040309010114f9ff43bb7debfcb57a19eeb6b67e68733edbba553e86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c0090603008db080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d05000000007500e1f505000000001976a91487bcb238974658d8bda6a19f9d3f2dd04339b8f788ac39300000f2aa00000000000000000000000000'
    const changeaddr = "RY548NkKzkWFPQpteeoaZ4FEnex8Rt8eoH"
    const system = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"
    const utxos = [
      {
        "address": "RF8ZdvjvGMNdtu3jNwcmaTDeU8hFJ28ajN",
        "txid": "05e95302f1de8175e6ac82c4b12566729919de84f9022c57e4f3f1c9cc11066b",
        "outputIndex": 1,
        "isspendable": 1,
        "script": "1a040300010114402f01e78edb0f5c8251658dde07f0d52b12e972cc4c59040309010114402f01e78edb0f5c8251658dde07f0d52b12e9723e86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c0090603008db080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d050000000075",
        "currencyvalues": {
          "iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM": 97368.28248208,
          "iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm": 0.90000000,
          "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq": 2.99396832
        },
        "currencynames": {},
        "satoshis": 299396832,
        "height": 39405,
        "blocktime": 1684580377
      }
    ]

    const validation = validateFundedTransaction(
      system, 
      fundedtx, 
      unfundedtx, 
      changeaddr, 
      networks.verustest, 
      utxos
    )

    assert.deepStrictEqual(validation, { valid: false, message: "Transaction hex does not match unfunded component." })
  })

  it('fails on tx with input not in input list', function () {
    const unfundedtx = "0400008085202f89000100e1f505000000001976a91487bcb238974658d8bda6a19f9d3f2dd04339b8f788ac00000000f2aa00000000000000000000000000"
    const fundedtx = '0400008085202f89026b0611ccc9f1f3e4572c02f984de1999726625b1c482ace67581def10253e9050100000000feffffff03060104010103040704020104060101020605010402040605010601020301050100000000feffffff02d066e20b00000000781a040300010114f9ff43bb7debfcb57a19eeb6b67e68733edbba55cc4c59040309010114f9ff43bb7debfcb57a19eeb6b67e68733edbba553e86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c0090603008db080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d05000000007500e1f505000000001976a91487bcb238974658d8bda6a19f9d3f2dd04339b8f788ac00000000f2aa00000000000000000000000000'
    const changeaddr = "RY548NkKzkWFPQpteeoaZ4FEnex8Rt8eoH"
    const system = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"
    const utxos = [
      {
        "address": "RF8ZdvjvGMNdtu3jNwcmaTDeU8hFJ28ajN",
        "txid": "05e95302f1de8175e6ac82c4b12566729919de84f9022c57e4f3f1c9cc11066b",
        "outputIndex": 1,
        "isspendable": 1,
        "script": "1a040300010114402f01e78edb0f5c8251658dde07f0d52b12e972cc4c59040309010114402f01e78edb0f5c8251658dde07f0d52b12e9723e86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c0090603008db080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d050000000075",
        "currencyvalues": {
          "iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM": 97368.28248208,
          "iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm": 0.90000000,
          "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq": 2.99396832
        },
        "currencynames": {},
        "satoshis": 299396832,
        "height": 39405,
        "blocktime": 1684580377
      }
    ]

    const validation = validateFundedTransaction(
      system, 
      fundedtx, 
      unfundedtx, 
      changeaddr, 
      networks.verustest, 
      utxos
    )

    assert.deepStrictEqual(validation, { valid: false, message: "Cannot find corresponding input for 0501030201060105060402040105060201010604010204070403010104010603 index 1." })
  })

  it('fails on tx with unsupported master eval code', function () {
    const unfundedtx = "0400008085202f89000100e1f505000000001976a91487bcb238974658d8bda6a19f9d3f2dd04339b8f788ac00000000f2aa00000000000000000000000000"
    const fundedtx = '0400008085202f89016b0611ccc9f1f3e4572c02f984de1999726625b1c482ace67581def10253e9050100000000feffffff02d066e20b00000000781a040300010114402f01e78edb0f5c8251658dde07f0d52b12e972cc4c59040309010114402f01e78edb0f5c8251658dde07f0d52b12e9723e86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c0090603008db080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d05000000007500e1f505000000001976a91487bcb238974658d8bda6a19f9d3f2dd04339b8f788ac00000000f2aa00000000000000000000000000'
    const changeaddr = "RF8ZdvjvGMNdtu3jNwcmaTDeU8hFJ28ajN"
    const system = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"
    const utxos = [
      {
        address: 'RF8ZdvjvGMNdtu3jNwcmaTDeU8hFJ28ajN',
        txid: '05e95302f1de8175e6ac82c4b12566729919de84f9022c57e4f3f1c9cc11066b',
        outputIndex: 1,
        isspendable: 1,
        script: '4c59040304010114402f01e78edb0f5c8251658dde07f0d52b12e9723e86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c0090603008db080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d0500000000cc4c59040309010114402f01e78edb0f5c8251658dde07f0d52b12e9723e86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c0090603008db080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d050000000075',
        currencyvalues: {
          iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM: 97368.28248208,
          iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm: 0.9,
          iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: 2.99396832
        },
        currencynames: {},
        satoshis: 299396832,
        height: 39405,
        blocktime: 1684580377
      }
    ]

    const validation = validateFundedTransaction(
      system, 
      fundedtx, 
      unfundedtx, 
      changeaddr, 
      networks.verustest, 
      utxos
    )

    assert.deepStrictEqual(validation, { valid: false, message: "Unsupported eval code 4" })
  })

  it('fails on tx with multisig master on change', function () {
    const unfundedtx = "0400008085202f89000100e1f505000000001976a91487bcb238974658d8bda6a19f9d3f2dd04339b8f788ac00000000f2aa00000000000000000000000000"
    const fundedtx = '0400008085202f89016b0611ccc9f1f3e4572c02f984de1999726625b1c482ace67581def10253e9050100000000feffffff02d066e20b00000000781a040300010214f9ff43bb7debfcb57a19eeb6b67e68733edbba55cc4c59040309010114f9ff43bb7debfcb57a19eeb6b67e68733edbba553e86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c0090603008db080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d05000000007500e1f505000000001976a91487bcb238974658d8bda6a19f9d3f2dd04339b8f788ac00000000f2aa00000000000000000000000000'
    const changeaddr = "RY548NkKzkWFPQpteeoaZ4FEnex8Rt8eoH"
    const system = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"
    const utxos = [
      {
        address: 'RF8ZdvjvGMNdtu3jNwcmaTDeU8hFJ28ajN',
        txid: '05e95302f1de8175e6ac82c4b12566729919de84f9022c57e4f3f1c9cc11066b',
        outputIndex: 1,
        isspendable: 1,
        script: '1a040300010214402f01e78edb0f5c8251658dde07f0d52b12e972cc4c59040309010114402f01e78edb0f5c8251658dde07f0d52b12e9723e86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c0090603008db080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d050000000075',
        currencyvalues: {
          iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM: 97368.28248208,
          iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm: 0.9,
          iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: 2.99396832
        },
        currencynames: {},
        satoshis: 299396832,
        height: 39405,
        blocktime: 1684580377
      }
    ]

    const validation = validateFundedTransaction(
      system, 
      fundedtx, 
      unfundedtx, 
      changeaddr, 
      networks.verustest, 
      utxos
    )

    assert.deepStrictEqual(validation, { valid: false, message: "Multisig change unsupported" })
  })

  it('fails on tx with multisig params on change', function () {
    const unfundedtx = "0400008085202f89000100e1f505000000001976a91487bcb238974658d8bda6a19f9d3f2dd04339b8f788ac00000000f2aa00000000000000000000000000"
    const fundedtx = '0400008085202f89016b0611ccc9f1f3e4572c02f984de1999726625b1c482ace67581def10253e9050100000000feffffff02d066e20b000000008d1a040300010114f9ff43bb7debfcb57a19eeb6b67e68733edbba55cc4c6e040309010214f9ff43bb7debfcb57a19eeb6b67e68733edbba5514f9ff43bb7debfcb57a19eeb6b67e68733edbba553e86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c0090603008db080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d05000000007500e1f505000000001976a91487bcb238974658d8bda6a19f9d3f2dd04339b8f788ac00000000f2aa00000000000000000000000000'
    const changeaddr = "RY548NkKzkWFPQpteeoaZ4FEnex8Rt8eoH"
    const system = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"
    const utxos = [
      {
        address: 'RF8ZdvjvGMNdtu3jNwcmaTDeU8hFJ28ajN',
        txid: '05e95302f1de8175e6ac82c4b12566729919de84f9022c57e4f3f1c9cc11066b',
        outputIndex: 1,
        isspendable: 1,
        script: '1a040300010214402f01e78edb0f5c8251658dde07f0d52b12e972cc4c59040309010114402f01e78edb0f5c8251658dde07f0d52b12e9723e86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c0090603008db080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d050000000075',
        currencyvalues: {
          iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM: 97368.28248208,
          iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm: 0.9,
          iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: 2.99396832
        },
        currencynames: {},
        satoshis: 299396832,
        height: 39405,
        blocktime: 1684580377
      }
    ]

    const validation = validateFundedTransaction(
      system, 
      fundedtx, 
      unfundedtx, 
      changeaddr, 
      networks.verustest, 
      utxos
    )

    assert.deepStrictEqual(validation, { valid: false, message: "Multisig change unsupported" })
  })
});
