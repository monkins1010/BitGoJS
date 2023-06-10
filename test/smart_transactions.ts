/**
 * @prettier
 */
/* global describe, it */
import * as assert from 'assert';
import { validateFundedCurrencyTransfer, createUnfundedCurrencyTransfer, getFundedTxBuilder } from '../src/smart_transactions';
import networks = require('../src/networks');
import { DEST_PKH, FLAG_DEST_AUX, TransferDestination, fromBase58Check } from 'verus-typescript-primitives';

const Transaction = require("../src/transaction");
const TransactionBuilder = require("../src/transaction_builder");
const ECPair = require('../src/ecpair');

describe.only('smarttxs', function () {
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

    const validation = validateFundedCurrencyTransfer(
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

    const validation = validateFundedCurrencyTransfer(
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

    const validation = validateFundedCurrencyTransfer(
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

    const validation = validateFundedCurrencyTransfer(
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

    const validation = validateFundedCurrencyTransfer(
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

    const validation = validateFundedCurrencyTransfer(
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

    const validation = validateFundedCurrencyTransfer(
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

    const validation = validateFundedCurrencyTransfer(
      system, 
      fundedtx, 
      unfundedtx, 
      changeaddr, 
      networks.verustest, 
      utxos
    )

    assert.deepStrictEqual(validation, { valid: false, message: "Multisig change unsupported" })
  })

  it('creates an unfunded off-chain conversion', function () {
    const system = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"
    const destbytes = fromBase58Check("RF8ZdvjvGMNdtu3jNwcmaTDeU8hFJ28ajN").hash

    const unfundedTransfer = createUnfundedCurrencyTransfer(
      system,
      [{
        currency: system,
        satoshis: "100000000",
        convertto: "iNC9NG5Jqk2tqVtqfjfiSpaqxrXaFU6RDu",
        exportto: "iNC9NG5Jqk2tqVtqfjfiSpaqxrXaFU6RDu",
        feecurrency: system,
        via: "iCmr2i7wECJzuGisQeUFQJJCASW66Jp7QG",
        address: new TransferDestination({
          type: DEST_PKH.xor(FLAG_DEST_AUX),
          destination_bytes: destbytes,
          aux_dests: [
            new TransferDestination({
              type: DEST_PKH,
              destination_bytes: destbytes
            })
          ]
        }),
        preconvert: false,
        burn: false,
        burnweight: false,
        mintnew: false
      }],
      networks.verustest,
      67000,
      4,
      0x892f2085
    )

    assert.equal(unfundedTransfer, "0400008085202f890001e074fa0500000000d71a040300010114cb8a0f7f651b484a81e2312c3438deb601e27368cc4cb8040308010114cb8a0f7f651b484a81e2312c3438deb601e273684c9c01a6ef9ea235635e328124ff3429db9f9e91b64e2daed6c1008743a6ef9ea235635e328124ff3429db9f9e91b64e2d91a6604214402f01e78edb0f5c8251658dde07f0d52b12e97201160214402f01e78edb0f5c8251658dde07f0d52b12e97265ffba3d69510d6f31845e60b9ee0c275389f84fcd51509db53e822df7eed11cac11e7b729e22400cd51509db53e822df7eed11cac11e7b729e224007500000000b80501000000000000000000000000")
  })

  it('creates unfunded same chain conversion', function () {
    const system = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"
    const destbytes = fromBase58Check("RF8ZdvjvGMNdtu3jNwcmaTDeU8hFJ28ajN").hash

    const unfundedTransfer = createUnfundedCurrencyTransfer(
      system,
      [{
        currency: system,
        satoshis: "100000000",
        convertto: "iBBRjDbPf3wdFpghLotJQ3ESjtPBxn6NS3",
        feecurrency: system,
        via: "i84mndBk2Znydpgm9T9pTjVvBnHkhErzLt",
        address: new TransferDestination({
          type: DEST_PKH.xor(FLAG_DEST_AUX),
          destination_bytes: destbytes,
          aux_dests: [
            new TransferDestination({
              type: DEST_PKH,
              destination_bytes: destbytes
            })
          ]
        }),
        preconvert: false,
        burn: false,
        burnweight: false,
        mintnew: false
      }],
      networks.verustest,
      67000,
      4,
      0x892f2085
    )

    assert.equal(unfundedTransfer, "0400008085202f890001e074fa0500000000c31a040300010114cb8a0f7f651b484a81e2312c3438deb601e27368cc4ca4040308010114cb8a0f7f651b484a81e2312c3438deb601e273684c8801a6ef9ea235635e328124ff3429db9f9e91b64e2daed6c1008703a6ef9ea235635e328124ff3429db9f9e91b64e2d91a6604214402f01e78edb0f5c8251658dde07f0d52b12e97201160214402f01e78edb0f5c8251658dde07f0d52b12e972325aa0d080ddfdef2d50028cfeb07a834d42bf5554852c4e9fb1d4c4291fc093e41ce2c7befa40767500000000b80501000000000000000000000000")
  })

  it('fails on tx with multisig params on change', function () {
    const system = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"
    const destbytes = fromBase58Check("RF8ZdvjvGMNdtu3jNwcmaTDeU8hFJ28ajN").hash

    const unfundedTransfer = createUnfundedCurrencyTransfer(
      system,
      [{
        currency: "i5GQFGvDunSHk417JhRZRYxrJRKoS9SH1p",
        satoshis: "100000000",
        address: new TransferDestination({
          type: DEST_PKH,
          destination_bytes: destbytes
        })
      }],
      networks.verustest,
      67500,
      4,
      0x892f2085
    )

    assert.equal(unfundedTransfer, "0400008085202f8900010000000000000000521a040300010114402f01e78edb0f5c8251658dde07f0d52b12e972cc34040309010114402f01e78edb0f5c8251658dde07f0d52b12e972190113a542e2075696772ee9861c9b2a4d55c86cf353aed6c1007500000000ac0701000000000000000000000000")
  })
});
