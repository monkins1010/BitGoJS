import { CurrencyValueMap, 
  GetAddressUtxosResponse, 
  RESERVE_TRANSFER_BURN_CHANGE_PRICE, 
  RESERVE_TRANSFER_BURN_CHANGE_WEIGHT, 
  RESERVE_TRANSFER_CONVERT, 
  RESERVE_TRANSFER_CROSS_SYSTEM, 
  RESERVE_TRANSFER_MINT_CURRENCY, 
  RESERVE_TRANSFER_PRECONVERT, 
  RESERVE_TRANSFER_RESERVE_TO_RESERVE,
  ReserveTransfer, 
  TokenOutput, 
  TransferDestination, 
  toBase58Check, 
  RESERVE_TRANSFER_DESTINATION,
  Identity,
  Principal,
} from "verus-typescript-primitives";
import { BN } from "bn.js";
import { Network } from "./networkTypes";

const Transaction = require('./transaction.js');
const TransactionBuilder = require('./transaction_builder.js');
const TxDestination = require('./tx_destination.js');
const script = require('./script.js');
const evals = require('bitcoin-ops/evals.json');
const opcodes = require('bitcoin-ops');
const OptCCParams = require('./optccparams');
const templates = require('./templates');

// Hack to force BigNumber to get typeof class instead of BN namespace
const BNClass = new BN(0);
type BigNumber = typeof BNClass;

type Output = { value: number, script: Buffer }

type Input = {
  hash: Buffer,
  index: number,
  script: Buffer,
  sequence: BigNumber,
  witness: Array<any>
}

type SmartTxParams = {
  eval: number,
  version: number,
  m: number,
  n: number,
  data?: TokenOutput|ReserveTransfer,
  values: { [currency: string]: BigNumber },
  fees: { [currency: string]: BigNumber }
}

type OutputParams = {
  currency: string, // sending currency i-address
  satoshis: string, // Satoshi satoshis
  convertto?: string, // i-address of currency to convert to
  exportto?: string, // i-address of system to export to
  feecurrency?: string, // i-address of fee currency
  via?: string, // i-address of currency to convert via,
  feesatoshis?: string, // Satoshi satoshis of output fee
  address: TransferDestination,
  refundto?: TransferDestination,
  preconvert?: boolean,
  burn?: boolean,
  burnweight?: boolean,
  mintnew?: boolean
}

export const unpackOutput = (output: Output, systemId: string): { 
  destinations: Array<string>, 
  values: { [currency: string]: BigNumber },
  fees: { [currency: string]: BigNumber },
  type: string,
  master?: SmartTxParams,
  params?: Array<SmartTxParams>
} => {
  // Verify change output
  const outputScript = output.script
  const outputType = templates.classifyOutput(outputScript);
  const values: { [currency: string]: BigNumber } = { [systemId]: new BN(0) };
  const fees: { [currency: string]: BigNumber } = { [systemId]: new BN(0) };
  const destinations: Array<string> = [];
  let master: typeof OptCCParams;
  const params: Array<typeof OptCCParams> = [];

  if (outputType === templates.types.P2PKH) {
    const destAddr = toBase58Check(templates.pubKeyHash.output.decode(outputScript), 60)

    values[systemId] = values[systemId].add(new BN(output.value));
    destinations.push(destAddr)
  } else if (outputType === templates.types.SMART_TRANSACTION) {
    let masterOptCC;
    const paramsOptCC = [];
    const decompiledScript = script.decompile(outputScript) as Array<Buffer|number>;

    for (let i = 0; i < decompiledScript.length; i+=2) {
      if (i === 0) masterOptCC = OptCCParams.fromChunk(decompiledScript[i]);
      else paramsOptCC.push(OptCCParams.fromChunk(decompiledScript[i]));
    }

    if (paramsOptCC.length > 1) throw new Error(">1 OptCCParam objects not currently supported for smart transaction params.")

    const processDestination = (destination: { destType: number, destinationBytes: Buffer }) => {
      if (destination.destType !== 2 && destination.destType !== 4) {
        throw new Error("Unsupported change destination type")
      }

      const destAddr = toBase58Check(
        destination.destinationBytes, 
        destination.destType === 2 ? 60 : 102
      )

      if (!destinations.includes(destAddr)) {
        destinations.push(destAddr)
      }
    }

    const processOptCCParam = (ccparam): SmartTxParams => {
      let data: TokenOutput|ReserveTransfer;
      const ccvalues: { [currency: string]: BigNumber } = { [systemId]: new BN(0) };
      const ccfees: { [currency: string]: BigNumber } = { [systemId]: new BN(0) };

      switch (ccparam.evalCode) {
        case evals.EVAL_NONE:
          if (ccparam.vData.length !== 0) {
            throw new Error(`Unexpected length of vdata array for eval code ${ccparam.evalCode}`)
          }

          ccvalues[systemId] = ccvalues[systemId].add(new BN(output.value));
          break;
        case evals.EVAL_RESERVE_TRANSFER:
          if (ccparam.vData.length !== 1) {
            throw new Error(`Unexpected length of vdata array for eval code ${ccparam.evalCode}`)
          }

          const resTransfer = new ReserveTransfer()
          resTransfer.fromBuffer(ccparam.vData[0])

          ccvalues[systemId] = ccvalues[systemId].add(new BN(output.value));
          resTransfer.reserve_values.value_map.forEach((value, key) => {
            if (key !== systemId) {
              if (!ccvalues[key]) ccvalues[key] = value;
              else ccvalues[key] = ccvalues[key].add(value);
            }
          })
          data = resTransfer;

          const fee = resTransfer.fee_amount;
          const feecurrency = resTransfer.fee_currency_id;
          
          ccfees[feecurrency] = fee;

          break;
        case evals.EVAL_RESERVE_OUTPUT:
          if (ccparam.vData.length !== 1) {
            throw new Error(`Unexpected length of vdata array for eval code ${ccparam.evalCode}`)
          }

          const resOutput = new TokenOutput()
          resOutput.fromBuffer(ccparam.vData[0])

          ccvalues[systemId] = ccvalues[systemId].add(new BN(output.value));
          resOutput.reserve_values.value_map.forEach((value, key) => {
            if (key !== systemId) {
              if (!ccvalues[key]) ccvalues[key] = value;
              else ccvalues[key] = ccvalues[key].add(value);
            }
          })
          data = resOutput;
          break;
        default:
          throw new Error(`Unsupported eval code ${ccparam.evalCode}`)
      }

      return {
        version: ccparam.version,
        eval: ccparam.evalCode,
        m: ccparam.m,
        n: ccparam.n,
        data: data,
        values: ccvalues,
        fees: ccfees
      }
    }

    master = processOptCCParam(masterOptCC)
    for (const destination of masterOptCC.destinations) {
      processDestination(destination)
    }

    for (const paramsCc of paramsOptCC) {
      const processedParams = processOptCCParam(paramsCc)
      params.push(processedParams)

      for (const key in processedParams.values) {
        const value = processedParams.values[key]

        if (!values[key]) values[key] = value;
        else values[key] = values[key].add(value)
      }

      for (const key in processedParams.fees) {
        const fee = processedParams.fees[key]

        if (!fees[key]) fees[key] = fee;
        else fees[key] = fees[key].add(fee)
      }

      for (const destination of paramsCc.destinations) {
        processDestination(destination)
      }
    }
  } else {
    throw new Error("Unsupported output type " + outputType)
  }

  return {
    destinations, 
    values, 
    fees,
    type: outputType,
    master: master,
    params: params.length > 0 ? params : undefined
  }
}

export const validateFundedCurrencyTransfer = (
  systemId: string,
  fundedTxHex: string, 
  unfundedTxHex: string,
  changeAddr: string,
  network: Network,
  utxoList: GetAddressUtxosResponse['result']): { 
    valid: boolean, 
    message?: string, 
    in?: { [currency: string]: string }, 
    out?: { [currency: string]: string }, 
    change?: { [currency: string]: string },
    fees?: { [currency: string]: string },
    sent?: { [currency: string]: string }
  } => {

  const amountsIn: { [currency: string]: BigNumber } = { [systemId]: new BN(0) };
  const amountsOut: { [currency: string]: BigNumber } = { [systemId]: new BN(0) };
  const amountChange: { [currency: string]: BigNumber } = { [systemId]: new BN(0) };
  const amountsFee: { [currency: string]: BigNumber } = { [systemId]: new BN(0) };

  const fundedTx = Transaction.fromHex(fundedTxHex, network);
  const unfundedTx = Transaction.fromHex(unfundedTxHex, network);

  const fundedTxComparison = Transaction.fromHex(fundedTxHex, network);

  if (!fundedTxComparison.ins.length) {
    return { 
      valid: false, 
      message: `Transaction has ${fundedTxComparison.ins.length} inputs.`
    }
  }

  fundedTxComparison.ins = []

  fundedTx.outs = fundedTx.outs as Array<Output>;
  unfundedTx.outs = unfundedTx.outs as Array<Output>;
  fundedTxComparison.outs = fundedTxComparison.outs as Array<Output>;

  fundedTx.ins = fundedTx.ins as Array<Input>;
  unfundedTx.ins = unfundedTx.ins as Array<Input>;
  fundedTxComparison.ins = fundedTxComparison.ins as Array<Input>;

  const changeOutputs: Array<Output> = [];
  const changeIndices: Array<number> = [];

  if (!fundedTxComparison.outs.length) {
    return { 
      valid: false, 
      message: `Transaction has ${fundedTxComparison.outs.length} outputs.`
    }
  }

  // Find all change outputs
  for (let i = 0, j = 0; i < fundedTxComparison.outs.length; i++, j++) {
    const out = fundedTxComparison.outs[i];

    const outScript = out.script.toString('hex')

    if (unfundedTx.outs[j] != null && 
        outScript === unfundedTx.outs[j].script.toString('hex') && 
        out.value === unfundedTx.outs[j].value) {
      continue;
    } else {
      changeOutputs.push(out)
      changeIndices.push(i)
      j--;
    }
  }

  // Filter change outputs from tx comparison
  fundedTxComparison.outs = (fundedTxComparison.outs as Array<Output>).filter((x: Output, i: number) => {
    return !changeIndices.includes(i)
  })

  // Verify funded tx and unfunded tx are the same where 
  // they should be the same
  if (fundedTxComparison.toHex() !== unfundedTx.toHex()) {
    return { 
      valid: false, 
      message: `Transaction hex does not match unfunded component.`
    }
  }
  
  // Verify all inputs are correct and count their amounts
  for (const input of (fundedTx.ins as Array<Input>)) {
    const inputHash = Buffer.from(input.hash).reverse().toString('hex')

    const inputUtxoIndex = utxoList.findIndex(x => (
      (x.txid === inputHash) && x.outputIndex === input.index)
    )

    if (inputUtxoIndex < 0) {
      return { 
        valid: false, 
        message: `Cannot find corresponding input for ${inputHash} index ${input.index}.`
      }
    }

    const inputUtxo = utxoList[inputUtxoIndex];
    const _script = Buffer.from(inputUtxo.script, 'hex')
    const _value = inputUtxo.satoshis

    try {
      const inputInfo = unpackOutput({ value: _value, script: _script }, systemId)

      for (const key in inputInfo.values) {
        if (amountsIn[key] == null) {
          amountsIn[key] = new BN(
            inputInfo.values[key] != null ? inputInfo.values[key] : 0
          )
        } else amountsIn[key] = amountsIn[key].add(inputInfo.values[key])
      }
    } catch(e) {
      return {
        valid: false,
        message: e.message
      }
    }
  }

  // Count output amounts (trusted more than input because we verify that they match
  // the outputs submitted in the unfunded transaction)
  for (let i = 0; i < unfundedTx.outs.length; i++) {
    const output = unfundedTx.outs[i];

    try {
      const outputInfo = unpackOutput(output, systemId);

      for (const key in outputInfo.values) {
        if (amountsOut[key] == null) {
          amountsOut[key] = new BN(outputInfo.values[key] != null ? outputInfo.values[key] : 0)
        } else amountsOut[key] = amountsOut[key].add(outputInfo.values[key])
      }

      for (const key in outputInfo.fees) {
        if (amountsFee[key] == null) {
          amountsFee[key] = new BN(outputInfo.fees[key] != null ? outputInfo.fees[key] : 0)
        } else amountsFee[key] = amountsFee[key].add(outputInfo.fees[key])
      }
    } catch(e) {
      return {
        valid: false,
        message: e.message
      }
    }
  }

  // Ensure change amounts go to correct destination
  for (let i = 0; i < changeOutputs.length; i++) {
    const output = changeOutputs[i];

    try {
      const outputInfo = unpackOutput(output, systemId);

      if (outputInfo.type !== templates.types.P2PKH && outputInfo.type !== templates.types.SMART_TRANSACTION) {
        throw new Error("Cannot use non p2pkh/smarttx utxo type as change.")
      }

      if (outputInfo.destinations.filter(x => x !== changeAddr).length !== 0) {
        throw new Error(`Some change destinations are not ${changeAddr}.`)
      }

      if (outputInfo.type === templates.types.SMART_TRANSACTION) {
        if (outputInfo.params.length !== 1) throw new Error("Invalid param length for change smarttx");

        const master = outputInfo.master!;
        const param = outputInfo.params[0]!;

        if (master.eval !== evals.EVAL_NONE) {
          throw new Error("Change smartx master must be EVAL_NONE")
        }

        if (!((master.m === 0 && master.n === 0 || master.m === 1 && master.n === 1) && 
              param.m === 1 && param.n === 1)) {
          throw new Error("Multisig change unsupported")
        }

        switch (param.eval) {
          case evals.EVAL_NONE:
          case evals.EVAL_RESERVE_OUTPUT:
            break;
          default:
            throw new Error("Change only supports EVAL_NONE and EVAL_RESERVE_OUTPUT smarttxs")
        }
      }
  
      for (const key in outputInfo.values) {
        if (amountsOut[key] == null) amountsOut[key] = new BN(outputInfo.values[key] != null ? outputInfo.values[key] : 0)
        else amountsOut[key] = amountsOut[key].add(outputInfo.values[key])

        if (amountChange[key] == null) amountChange[key] = new BN(outputInfo.values[key] != null ? outputInfo.values[key] : 0)
        else amountChange[key] = amountChange[key].add(outputInfo.values[key])
      }
    } catch(e) {
      return {
        valid: false,
        message: e.message
      }
    }
  }

  const _in = {};
  const _out = {};
  const _change = {};
  const _fees = {};
  const _sent = {};

  for (const key in amountsIn) {
    _in[key] = amountsIn[key].toString()
  }

  for (const key in amountsOut) {
    _out[key] = amountsOut[key].toString()
  }

  for (const key in amountsFee) {
    _fees[key] = amountsFee[key].toString()
  }

  for (const key in amountChange) {
    _change[key] = amountChange[key].toString()
  }

  for (const key in amountsIn) {
    const outVal = amountsOut[key] != null ? amountsOut[key] : new BN(0);
    const feeVal = _fees[key] ? new BN(_fees[key]) : new BN(0);

    _fees[key] = (feeVal.add((amountsIn[key].sub(outVal)))).toString()
  }

  for (const key in amountsIn) {
    const changeVal = amountChange[key] != null ? amountChange[key] : new BN(0);
    const feeVal = _fees[key] ? new BN(_fees[key]) : new BN(0)

    _sent[key] = (amountsIn[key].sub(changeVal).sub(feeVal)).toString()
  }

  return { valid: true, in: _in, out: _out, change: _change, fees: _fees, sent: _sent };
}

export const createUnfundedCurrencyTransfer = (
  systemId: string,
  outputs: Array<OutputParams>,
  network: Network,
  expiryHeight: number = 0,
  version: number = 4,
  versionGroupId: number = 0x892f2085
): string => {
  const txb = new TransactionBuilder(network);

  txb.setVersion(version);
  txb.setExpiryHeight(expiryHeight);
  txb.setVersionGroupId(versionGroupId);

  for (const output of outputs) {
    if (!output.currency) throw new Error("Must specify currency i-address for all outputs");
    if (output.satoshis == null) throw new Error("Must specify satoshis for all outputs");
    if (output.address == null) throw new Error("Must specify address for all outputs");
    
    const params: OutputParams = {
      currency: output.currency,
      satoshis: output.satoshis,
      convertto: output.convertto ? output.convertto : output.currency,
      exportto: output.exportto,
      feecurrency: output.feecurrency ? output.feecurrency : systemId,
      feesatoshis: output.feesatoshis ? output.feesatoshis : "300000",
      via: output.via,
      address: output.address,
      refundto: output.refundto,
      preconvert: !!(output.preconvert),
      burnweight: !!(output.burnweight),
      burn: !!(output.burn),
      mintnew: !!(output.mintnew)
    }

    // fee_currency_id?: string;
    // fee_amount?: BigNumber;
    // transfer_destination?: TransferDestination;
    // dest_currency_id?: string;
    // second_reserve_id?: string;
    // dest_system_id?: string;

    const isReserveTransfer = output.feecurrency != null || 
                              output.feesatoshis != null || 
                              output.convertto != null || 
                              output.exportto != null ||
                              output.via != null;
    
    const satoshis = new BN(params.satoshis, 10)
    const values = new CurrencyValueMap({
      value_map: new Map([[params.currency, satoshis]]),
      multivalue: false
    })
    const nativeFeeValue = params.feecurrency === systemId && isReserveTransfer ? new BN(params.feesatoshis) : new BN(0);
    const nativeValue = params.currency === systemId ? satoshis.add(nativeFeeValue) : nativeFeeValue;

    let outMaster;
    let outParams;
    
    if (isReserveTransfer) {
      const destination = new TxDestination(RESERVE_TRANSFER_DESTINATION.type.toNumber(), RESERVE_TRANSFER_DESTINATION.destination_bytes)
      outMaster = new OptCCParams(3, evals.EVAL_NONE, 1, 1, [destination]);
      let flags = new BN(1);
      const version = new BN(1, 10);

      if (params.via != null) flags = flags.xor(RESERVE_TRANSFER_RESERVE_TO_RESERVE);
      if (params.exportto != null) flags = flags.xor(RESERVE_TRANSFER_CROSS_SYSTEM);
      if (params.convertto != null) flags = flags.xor(RESERVE_TRANSFER_CONVERT);
      if (params.preconvert) flags = flags.xor(RESERVE_TRANSFER_PRECONVERT);
      if (params.mintnew) flags = flags.xor(RESERVE_TRANSFER_MINT_CURRENCY);
      if (params.burn) flags = flags.xor(RESERVE_TRANSFER_BURN_CHANGE_PRICE);
      if (params.burnweight) flags = flags.xor(RESERVE_TRANSFER_BURN_CHANGE_WEIGHT);

      const resTransfer = new ReserveTransfer({
        values,
        version,
        flags,
        fee_currency_id: params.feecurrency,
        fee_amount: new BN(params.feesatoshis, 10),
        transfer_destination: params.address,
        dest_currency_id: output.via ? output.via : params.convertto,
        second_reserve_id: params.convertto,
        dest_system_id: params.exportto
      })

      outParams = new OptCCParams(3, evals.EVAL_RESERVE_TRANSFER, 1, 1, [destination], [resTransfer.toBuffer()]);
    } else {
      const destination = new TxDestination(params.address.type.toNumber(), params.address.destination_bytes)

      // Assume token output
      outMaster = new OptCCParams(3, evals.EVAL_NONE, 1, 1, [destination]);
      const version = new BN(1, 10);

      const tokenOutput = new TokenOutput({
        values,
        version
      })

      outParams = new OptCCParams(3, evals.EVAL_RESERVE_OUTPUT, 1, 1, [destination], [tokenOutput.toBuffer()]);
    }

    const outputScript = script.compile([
      outMaster.toChunk(),
      opcodes.OP_CHECKCRYPTOCONDITION,
      outParams.toChunk(),
      opcodes.OP_DROP,
    ]);

    txb.addOutput(outputScript, nativeValue.toNumber());
  }

  return txb.buildIncomplete().toHex();
}

export const getFundedTxBuilder = (
  fundedTxHex: string,
  network: Network,
  prevOutScripts: Array<Buffer>
) => {
  const tx = Transaction.fromHex(fundedTxHex, network);
  const inputs = tx.ins;
  var txb = TransactionBuilder.fromTransaction(tx, network);
  txb.inputs = [];
  txb.tx.ins = [];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const prevoutscript = prevOutScripts[i];
    delete txb.prevTxMap[input.hash.toString('hex') + ':' + input.index];

    txb.addInput(input.hash, input.index, input.sequence, prevoutscript);
  }

  return txb;
}

//create unfunded identity update transaction
export const createUnfundedIdentityUpdate = (
    systemId: string,
    identity: Identity,
    outputs: Array<OutputParams>,
    network: Network,
    expiryHeight: number = 0,
    version: number = 4,
    versionGroupId: number = 0x892f2085
  ): string => {
    const txb = new TransactionBuilder(network);
  
    txb.setVersion(version);
    txb.setExpiryHeight(expiryHeight);
    txb.setVersionGroupId(versionGroupId);

    //TODO: iterate through outputs and add output scripts to tx. not sure if identity needs to be part of outputs param or a separate param.
    //TODO: add identity to output scripts
    //TODO: change eval codes
    for (const output of outputs) {
        if (!output.currency) throw new Error("Must specify currency i-address for all outputs");
        if (output.satoshis == null) throw new Error("Must specify satoshis for all outputs");
        if (output.address == null) throw new Error("Must specify address for all outputs");
        
        const params: OutputParams = {
          currency: output.currency,
          satoshis: output.satoshis,
          convertto: output.convertto ? output.convertto : output.currency,
          exportto: output.exportto,
          feecurrency: output.feecurrency ? output.feecurrency : systemId,
          feesatoshis: output.feesatoshis ? output.feesatoshis : "300000",
          via: output.via,
          address: output.address,
          refundto: output.refundto,
          preconvert: !!(output.preconvert),
          burnweight: !!(output.burnweight),
          burn: !!(output.burn),
          mintnew: !!(output.mintnew)
        }

        const satoshis = new BN(params.satoshis, 10)

        let outMaster;
        let outParams;

        const destination = new TxDestination(params.address.type.toNumber(), params.address.destination_bytes)
        outMaster = new OptCCParams(3, evals.EVAL_NONE, 1, 1, [destination]);
        outParams = new OptCCParams(3, evals.EVAL_RESERVE_OUTPUT, 1, 1, [destination]); //change eval code

        const outputScript = script.compile([
        outMaster.toChunk(),
        opcodes.OP_CHECKCRYPTOCONDITION,
        outParams.toChunk(),
        opcodes.OP_DROP,
        ]);

        txb.addOutput(outputScript, satoshis.toNumber());
    }
  
    return txb.buildIncomplete().toHex();
  }
  
