"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySignature = exports.parseSignatureScript = exports.getDefaultSigHash = void 0;
/**
 * @prettier
 */
const opcodes = require('bitcoin-ops');
const script = require("../script");
const crypto = require("../crypto");
const ECPair = require("../ecpair");
const Transaction = require("../transaction");
const ECSignature = require("../ecsignature");
const networks = require("../networks");
const coins_1 = require("../coins");
const inputTypes = [
    'multisig',
    'nonstandard',
    'nulldata',
    'pubkey',
    'pubkeyhash',
    'scripthash',
    'witnesspubkeyhash',
    'witnessscripthash',
    'witnesscommitment',
];
function getDefaultSigHash(network) {
    switch (coins_1.getMainnet(network)) {
        case networks.bitcoincash:
        case networks.bitcoinsv:
        case networks.bitcoingold:
            return Transaction.SIGHASH_ALL | Transaction.SIGHASH_BITCOINCASHBIP143;
        default:
            return Transaction.SIGHASH_ALL;
    }
}
exports.getDefaultSigHash = getDefaultSigHash;
/**
 * Parse a transaction's signature script to obtain public keys, signatures, the sig script,
 * and other properties.
 *
 * Only supports script types used in BitGo transactions.
 *
 * @param input
 * @returns ParsedSignatureScript
 */
function parseSignatureScript(input) {
    const isSegwitInput = input.witness.length > 0;
    const isNativeSegwitInput = input.script.length === 0;
    let decompiledSigScript, inputClassification;
    if (isSegwitInput) {
        // The decompiledSigScript is the script containing the signatures, public keys, and the script that was committed
        // to (pubScript). If this is a segwit input the decompiledSigScript is in the witness, regardless of whether it
        // is native or not. The inputClassification is determined based on whether or not the input is native to give an
        // accurate classification. Note that p2shP2wsh inputs will be classified as p2sh and not p2wsh.
        decompiledSigScript = input.witness;
        if (isNativeSegwitInput) {
            inputClassification = script.classifyWitness(script.compile(decompiledSigScript), true);
        }
        else {
            inputClassification = script.classifyInput(input.script, true);
        }
    }
    else {
        inputClassification = script.classifyInput(input.script, true);
        decompiledSigScript = script.decompile(input.script);
    }
    if (inputClassification === script.types.P2PKH) {
        const [signature, publicKey] = decompiledSigScript;
        const publicKeys = [publicKey];
        const signatures = [signature];
        const pubScript = script.pubKeyHash.output.encode(crypto.hash160(publicKey));
        return { isSegwitInput, inputClassification, signatures, publicKeys, pubScript };
    }
    // Note the assumption here that if we have a p2sh or p2wsh input it will be multisig (appropriate because the
    // BitGo platform only supports multisig within these types of inputs). Signatures are all but the last entry in
    // the decompiledSigScript. The redeemScript/witnessScript (depending on which type of input this is) is the last
    // entry in the decompiledSigScript (denoted here as the pubScript). The public keys are the second through
    // antepenultimate entries in the decompiledPubScript. See below for a visual representation of the typical 2-of-3
    // multisig setup:
    //
    // decompiledSigScript = 0 <sig1> [<sig2>] <pubScript>
    // decompiledPubScript = 2 <pub1> <pub2> <pub3> 3 OP_CHECKMULTISIG
    const expectedScriptType = inputClassification === script.types.P2SH || inputClassification === script.types.P2WSH;
    const expectedScriptLength = decompiledSigScript.length === 4 || // single signature
        decompiledSigScript.length === 5; // double signature
    if (!expectedScriptType || !expectedScriptLength) {
        return { isSegwitInput, inputClassification };
    }
    const signatures = decompiledSigScript.slice(0, -1);
    const pubScript = decompiledSigScript[decompiledSigScript.length - 1];
    const decompiledPubScript = script.decompile(pubScript);
    if (decompiledPubScript.length !== 6) {
        throw new Error(`unexpected decompiledPubScript length`);
    }
    const publicKeys = decompiledPubScript.slice(1, -2);
    // Op codes 81 through 96 represent numbers 1 through 16 (see https://en.bitcoin.it/wiki/Script#Opcodes), which is
    // why we subtract by 80 to get the number of signatures (n) and the number of public keys (m) in an n-of-m setup.
    const len = decompiledPubScript.length;
    const nSignatures = decompiledPubScript[0] - 80;
    const nPubKeys = decompiledPubScript[len - 2] - 80;
    // Due to a bug in the implementation of multisignature in the bitcoin protocol, a 0 is added to the signature
    // script, so we add 1 when asserting the number of signatures matches the number of signatures expected by the
    // pub script. Also, note that we consider a signature script with the the same number of signatures as public
    // keys (+1 as noted above) valid because we use placeholder signatures when parsing a half-signed signature
    // script.
    if (signatures.length !== nSignatures + 1 && signatures.length !== nPubKeys + 1) {
        throw new Error(`expected ${nSignatures} or ${nPubKeys} signatures, got ${signatures.length - 1}`);
    }
    if (publicKeys.length !== nPubKeys) {
        throw new Error(`expected ${nPubKeys} public keys, got ${publicKeys.length}`);
    }
    const lastOpCode = decompiledPubScript[len - 1];
    if (lastOpCode !== opcodes.OP_CHECKMULTISIG) {
        throw new Error(`expected opcode #${opcodes.OP_CHECKMULTISIG}, got opcode #${lastOpCode}`);
    }
    return { isSegwitInput, inputClassification, signatures, publicKeys, pubScript };
}
exports.parseSignatureScript = parseSignatureScript;
/**
 * Verify the signature on a (half-signed) transaction
 * @param transaction bitcoinjs-lib tx object
 * @param inputIndex The input whererfore to check the signature
 * @param amount For segwit and BCH, the input amount needs to be known for signature verification
 * @param verificationSettings
 * @param verificationSettings.signatureIndex The index of the signature to verify (only iterates over non-empty signatures)
 * @param verificationSettings.publicKey The hex of the public key to verify (will verify all signatures)
 * @returns {boolean}
 */
function verifySignature(transaction, inputIndex, amount, verificationSettings = {}) {
    if (typeof verificationSettings.publicKey === 'string') {
        return verifySignature(transaction, inputIndex, amount, {
            signatureIndex: verificationSettings.signatureIndex,
            publicKey: Buffer.from(verificationSettings.publicKey, 'hex'),
        });
    }
    /* istanbul ignore next */
    if (!transaction.ins) {
        throw new Error(`invalid transaction`);
    }
    const input = transaction.ins[inputIndex];
    /* istanbul ignore next */
    if (!input) {
        throw new Error(`no input at index ${inputIndex}`);
    }
    const { signatures, publicKeys, isSegwitInput, inputClassification, pubScript } = parseSignatureScript(input);
    if (![script.types.P2WSH, script.types.P2SH, script.types.P2PKH].includes(inputClassification)) {
        return false;
    }
    if (!publicKeys || publicKeys.length === 0) {
        return false;
    }
    if (isSegwitInput && !amount) {
        return false;
    }
    if (!signatures) {
        return false;
    }
    // get the first non-empty signature and verify it against all public keys
    const nonEmptySignatures = signatures.filter((s) => s.length > 0);
    /*
    We either want to verify all signature/pubkey combinations, or do an explicit combination
  
    If a signature index is specified, only that signature is checked. It's verified against all public keys.
    If a single public key is found to be valid, the function returns true.
  
    If a public key is specified, we iterate over all signatures. If a single one matches the public key, the function
    returns true.
  
    If neither is specified, all signatures are checked against all public keys. Each signature must have its own distinct
    public key that it matches for the function to return true.
     */
    let signaturesToCheck = nonEmptySignatures;
    if (verificationSettings.signatureIndex !== undefined) {
        signaturesToCheck = [nonEmptySignatures[verificationSettings.signatureIndex]];
    }
    let areAllSignaturesValid = true;
    // go over all signatures
    for (const signatureBuffer of signaturesToCheck) {
        let isSignatureValid = false;
        const hasSignatureBuffer = Buffer.isBuffer(signatureBuffer) && signatureBuffer.length > 0;
        if (hasSignatureBuffer && Buffer.isBuffer(pubScript) && pubScript.length > 0) {
            // slice the last byte from the signature hash input because it's the hash type
            const signature = ECSignature.fromDER(signatureBuffer.slice(0, -1));
            const hashType = signatureBuffer[signatureBuffer.length - 1];
            if (!hashType) {
                // missing hashType byte - signature cannot be validated
                return false;
            }
            const signatureHash = transaction.hashForSignatureByNetwork(inputIndex, pubScript, amount, hashType, isSegwitInput);
            let matchedPublicKeyIndices = (new Array(publicKeys.length)).fill(false);
            for (let publicKeyIndex = 0; publicKeyIndex < publicKeys.length; publicKeyIndex++) {
                const publicKeyBuffer = publicKeys[publicKeyIndex];
                if (verificationSettings.publicKey !== undefined && !publicKeyBuffer.equals(verificationSettings.publicKey)) {
                    // we are only looking to verify one specific public key's signature (publicKeyHex)
                    // this particular public key is not the one whose signature we're trying to verify
                    continue;
                }
                if (matchedPublicKeyIndices[publicKeyIndex]) {
                    continue;
                }
                const publicKey = ECPair.fromPublicKeyBuffer(publicKeyBuffer);
                if (publicKey.verify(signatureHash, signature)) {
                    isSignatureValid = true;
                    matchedPublicKeyIndices[publicKeyIndex] = true;
                    break;
                }
            }
        }
        if (verificationSettings.publicKey !== undefined && isSignatureValid) {
            // We were trying to see if any of the signatures was valid for the given public key. Evidently yes.
            return true;
        }
        if (!isSignatureValid && verificationSettings.publicKey === undefined) {
            return false;
        }
        areAllSignaturesValid = isSignatureValid && areAllSignaturesValid;
    }
    return areAllSignaturesValid;
}
exports.verifySignature = verifySignature;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmF0dXJlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2JpdGdvL3NpZ25hdHVyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7R0FFRztBQUNILE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUV2QyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDcEMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ3BDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNwQyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUM5QyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUU5Qyx3Q0FBd0M7QUFDeEMsb0NBQXNDO0FBV3RDLE1BQU0sVUFBVSxHQUFHO0lBQ2pCLFVBQVU7SUFDVixhQUFhO0lBQ2IsVUFBVTtJQUNWLFFBQVE7SUFDUixZQUFZO0lBQ1osWUFBWTtJQUNaLG1CQUFtQjtJQUNuQixtQkFBbUI7SUFDbkIsbUJBQW1CO0NBQ1gsQ0FBQztBQVlYLFNBQWdCLGlCQUFpQixDQUFDLE9BQWdCO0lBQ2hELFFBQVEsa0JBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUMzQixLQUFLLFFBQVEsQ0FBQyxXQUFXLENBQUM7UUFDMUIsS0FBSyxRQUFRLENBQUMsU0FBUyxDQUFDO1FBQ3hCLEtBQUssUUFBUSxDQUFDLFdBQVc7WUFDdkIsT0FBTyxXQUFXLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQyx5QkFBeUIsQ0FBQztRQUN6RTtZQUNFLE9BQU8sV0FBVyxDQUFDLFdBQVcsQ0FBQztLQUNsQztBQUNILENBQUM7QUFURCw4Q0FTQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsU0FBZ0Isb0JBQW9CLENBQUMsS0FBWTtJQUMvQyxNQUFNLGFBQWEs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QUNuRTtJQUVELE9BQU8scUJBQXFCLENBQUM7QUFDL0IsQ0FBQztBQTVIRCwwQ0E0SEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwcmV0dGllclxuICovXG5jb25zdCBvcGNvZGVzID0gcmVxdWlyZSgnYml0Y29pbi1vcHMnKTtcblxuY29uc3Qgc2NyaXB0ID0gcmVxdWlyZShcIi4uL3NjcmlwdFwiKTtcbmNvbnN0IGNyeXB0byA9IHJlcXVpcmUoXCIuLi9jcnlwdG9cIik7XG5jb25zdCBFQ1BhaXIgPSByZXF1aXJlKFwiLi4vZWNwYWlyXCIpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSByZXF1aXJlKFwiLi4vdHJhbnNhY3Rpb25cIik7XG5jb25zdCBFQ1NpZ25hdHVyZSA9IHJlcXVpcmUoXCIuLi9lY3NpZ25hdHVyZVwiKTtcbmltcG9ydCB7IE5ldHdvcmsgfSBmcm9tICcuLi9uZXR3b3JrVHlwZXMnO1xuaW1wb3J0ICogYXMgbmV0d29ya3MgZnJvbSAnLi4vbmV0d29ya3MnO1xuaW1wb3J0IHsgZ2V0TWFpbm5ldCB9IGZyb20gJy4uL2NvaW5zJztcblxuZXhwb3J0IGludGVyZmFjZSBJbnB1dCB7XG4gIGhhc2g6IEJ1ZmZlcjtcbiAgaW5kZXg6IG51bWJlcjtcbiAgc2VxdWVuY2U6IG51bWJlcjtcbiAgd2l0bmVzczogQnVmZmVyO1xuICBzY3JpcHQ6IEJ1ZmZlcjtcbiAgc2lnblNjcmlwdDogQnVmZmVyO1xufVxuXG5jb25zdCBpbnB1dFR5cGVzID0gW1xuICAnbXVsdGlzaWcnLFxuICAnbm9uc3RhbmRhcmQnLFxuICAnbnVsbGRhdGEnLFxuICAncHVia2V5JyxcbiAgJ3B1YmtleWhhc2gnLFxuICAnc2NyaXB0aGFzaCcsXG4gICd3aXRuZXNzcHVia2V5aGFzaCcsXG4gICd3aXRuZXNzc2NyaXB0aGFzaCcsXG4gICd3aXRuZXNzY29tbWl0bWVudCcsXG5dIGFzIGNvbnN0O1xuXG50eXBlIElucHV0VHlwZSA9IHR5cGVvZiBpbnB1dFR5cGVzW251bWJlcl07XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VkU2lnbmF0dXJlU2NyaXB0IHtcbiAgaXNTZWd3aXRJbnB1dDogYm9vbGVhbjtcbiAgaW5wdXRDbGFzc2lmaWNhdGlvbjogSW5wdXRUeXBlO1xuICBzaWduYXR1cmVzPzogQnVmZmVyW107XG4gIHB1YmxpY0tleXM/OiBCdWZmZXJbXTtcbiAgcHViU2NyaXB0PzogQnVmZmVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVmYXVsdFNpZ0hhc2gobmV0d29yazogTmV0d29yayk6IG51bWJlciB7XG4gIHN3aXRjaCAoZ2V0TWFpbm5ldChuZXR3b3JrKSkge1xuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmNhc2g6XG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luc3Y6XG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcbiAgICAgIHJldHVybiBUcmFuc2FjdGlvbi5TSUdIQVNIX0FMTCB8IFRyYW5zYWN0aW9uLlNJR0hBU0hfQklUQ09JTkNBU0hCSVAxNDM7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBUcmFuc2FjdGlvbi5TSUdIQVNIX0FMTDtcbiAgfVxufVxuXG4vKipcbiAqIFBhcnNlIGEgdHJhbnNhY3Rpb24ncyBzaWduYXR1cmUgc2NyaXB0IHRvIG9idGFpbiBwdWJsaWMga2V5cywgc2lnbmF0dXJlcywgdGhlIHNpZyBzY3JpcHQsXG4gKiBhbmQgb3RoZXIgcHJvcGVydGllcy5cbiAqXG4gKiBPbmx5IHN1cHBvcnRzIHNjcmlwdCB0eXBlcyB1c2VkIGluIEJpdEdvIHRyYW5zYWN0aW9ucy5cbiAqXG4gKiBAcGFyYW0gaW5wdXRcbiAqIEByZXR1cm5zIFBhcnNlZFNpZ25hdHVyZVNjcmlwdFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTaWduYXR1cmVTY3JpcHQoaW5wdXQ6IElucHV0KTogUGFyc2VkU2lnbmF0dXJlU2NyaXB0IHtcbiAgY29uc3QgaXNTZWd3aXRJbnB1dCA9IGlucHV0LndpdG5lc3MubGVuZ3RoID4gMDtcbiAgY29uc3QgaXNOYXRpdmVTZWd3aXRJbnB1dCA9IGlucHV0LnNjcmlwdC5sZW5ndGggPT09IDA7XG4gIGxldCBkZWNvbXBpbGVkU2lnU2NyaXB0LCBpbnB1dENsYXNzaWZpY2F0aW9uO1xuICBpZiAoaXNTZWd3aXRJbnB1dCkge1xuICAgIC8vIFRoZSBkZWNvbXBpbGVkU2lnU2NyaXB0IGlzIHRoZSBzY3JpcHQgY29udGFpbmluZyB0aGUgc2lnbmF0dXJlcywgcHVibGljIGtleXMsIGFuZCB0aGUgc2NyaXB0IHRoYXQgd2FzIGNvbW1pdHRlZFxuICAgIC8vIHRvIChwdWJTY3JpcHQpLiBJZiB0aGlzIGlzIGEgc2Vnd2l0IGlucHV0IHRoZSBkZWNvbXBpbGVkU2lnU2NyaXB0IGlzIGluIHRoZSB3aXRuZXNzLCByZWdhcmRsZXNzIG9mIHdoZXRoZXIgaXRcbiAgICAvLyBpcyBuYXRpdmUgb3Igbm90LiBUaGUgaW5wdXRDbGFzc2lmaWNhdGlvbiBpcyBkZXRlcm1pbmVkIGJhc2VkIG9uIHdoZXRoZXIgb3Igbm90IHRoZSBpbnB1dCBpcyBuYXRpdmUgdG8gZ2l2ZSBhblxuICAgIC8vIGFjY3VyYXRlIGNsYXNzaWZpY2F0aW9uLiBOb3RlIHRoYXQgcDJzaFAyd3NoIGlucHV0cyB3aWxsIGJlIGNsYXNzaWZpZWQgYXMgcDJzaCBhbmQgbm90IHAyd3NoLlxuICAgIGRlY29tcGlsZWRTaWdTY3JpcHQgPSBpbnB1dC53aXRuZXNzO1xuICAgIGlmIChpc05hdGl2ZVNlZ3dpdElucHV0KSB7XG4gICAgICBpbnB1dENsYXNzaWZpY2F0aW9uID0gc2NyaXB0LmNsYXNzaWZ5V2l0bmVzcyhzY3JpcHQuY29tcGlsZShkZWNvbXBpbGVkU2lnU2NyaXB0KSwgdHJ1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlucHV0Q2xhc3NpZmljYXRpb24gPSBzY3JpcHQuY2xhc3NpZnlJbnB1dChpbnB1dC5zY3JpcHQsIHRydWUpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpbnB1dENsYXNzaWZpY2F0aW9uID0gc2NyaXB0LmNsYXNzaWZ5SW5wdXQoaW5wdXQuc2NyaXB0LCB0cnVlKTtcbiAgICBkZWNvbXBpbGVkU2lnU2NyaXB0ID0gc2NyaXB0LmRlY29tcGlsZShpbnB1dC5zY3JpcHQpO1xuICB9XG5cbiAgaWYgKGlucHV0Q2xhc3NpZmljYXRpb24gPT09IHNjcmlwdC50eXBlcy5QMlBLSCkge1xuICAgIGNvbnN0IFtzaWduYXR1cmUsIHB1YmxpY0tleV0gPSBkZWNvbXBpbGVkU2lnU2NyaXB0O1xuICAgIGNvbnN0IHB1YmxpY0tleXMgPSBbcHVibGljS2V5XTtcbiAgICBjb25zdCBzaWduYXR1cmVzID0gW3NpZ25hdHVyZV07XG4gICAgY29uc3QgcHViU2NyaXB0ID0gc2NyaXB0LnB1YktleUhhc2gub3V0cHV0LmVuY29kZShjcnlwdG8uaGFzaDE2MChwdWJsaWNLZXkpKTtcblxuICAgIHJldHVybiB7IGlzU2Vnd2l0SW5wdXQsIGlucHV0Q2xhc3NpZmljYXRpb24sIHNpZ25hdHVyZXMsIHB1YmxpY0tleXMsIHB1YlNjcmlwdCB9O1xuICB9XG5cbiAgLy8gTm90ZSB0aGUgYXNzdW1wdGlvbiBoZXJlIHRoYXQgaWYgd2UgaGF2ZSBhIHAyc2ggb3IgcDJ3c2ggaW5wdXQgaXQgd2lsbCBiZSBtdWx0aXNpZyAoYXBwcm9wcmlhdGUgYmVjYXVzZSB0aGVcbiAgLy8gQml0R28gcGxhdGZvcm0gb25seSBzdXBwb3J0cyBtdWx0aXNpZyB3aXRoaW4gdGhlc2UgdHlwZXMgb2YgaW5wdXRzKS4gU2lnbmF0dXJlcyBhcmUgYWxsIGJ1dCB0aGUgbGFzdCBlbnRyeSBpblxuICAvLyB0aGUgZGVjb21waWxlZFNpZ1NjcmlwdC4gVGhlIHJlZGVlbVNjcmlwdC93aXRuZXNzU2NyaXB0IChkZXBlbmRpbmcgb24gd2hpY2ggdHlwZSBvZiBpbnB1dCB0aGlzIGlzKSBpcyB0aGUgbGFzdFxuICAvLyBlbnRyeSBpbiB0aGUgZGVjb21waWxlZFNpZ1NjcmlwdCAoZGVub3RlZCBoZXJlIGFzIHRoZSBwdWJTY3JpcHQpLiBUaGUgcHVibGljIGtleXMgYXJlIHRoZSBzZWNvbmQgdGhyb3VnaFxuICAvLyBhbnRlcGVudWx0aW1hdGUgZW50cmllcyBpbiB0aGUgZGVjb21waWxlZFB1YlNjcmlwdC4gU2VlIGJlbG93IGZvciBhIHZpc3VhbCByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHlwaWNhbCAyLW9mLTNcbiAgLy8gbXVsdGlzaWcgc2V0dXA6XG4gIC8vXG4gIC8vIGRlY29tcGlsZWRTaWdTY3JpcHQgPSAwIDxzaWcxPiBbPHNpZzI+XSA8cHViU2NyaXB0PlxuICAvLyBkZWNvbXBpbGVkUHViU2NyaXB0ID0gMiA8cHViMT4gPHB1YjI+IDxwdWIzPiAzIE9QX0NIRUNLTVVMVElTSUdcbiAgY29uc3QgZXhwZWN0ZWRTY3JpcHRUeXBlID0gaW5wdXRDbGFzc2lmaWNhdGlvbiA9PT0gc2NyaXB0LnR5cGVzLlAyU0ggfHwgaW5wdXRDbGFzc2lmaWNhdGlvbiA9PT0gc2NyaXB0LnR5cGVzLlAyV1NIO1xuICBjb25zdCBleHBlY3RlZFNjcmlwdExlbmd0aCA9XG4gICAgZGVjb21waWxlZFNpZ1NjcmlwdC5sZW5ndGggPT09IDQgfHwgLy8gc2luZ2xlIHNpZ25hdHVyZVxuICAgIGRlY29tcGlsZWRTaWdTY3JpcHQubGVuZ3RoID09PSA1OyAvLyBkb3VibGUgc2lnbmF0dXJlXG5cbiAgaWYgKCFleHBlY3RlZFNjcmlwdFR5cGUgfHwgIWV4cGVjdGVkU2NyaXB0TGVuZ3RoKSB7XG4gICAgcmV0dXJuIHsgaXNTZWd3aXRJbnB1dCwgaW5wdXRDbGFzc2lmaWNhdGlvbiB9O1xuICB9XG5cbiAgY29uc3Qgc2lnbmF0dXJlcyA9IGRlY29tcGlsZWRTaWdTY3JpcHQuc2xpY2UoMCwgLTEpO1xuICBjb25zdCBwdWJTY3JpcHQgPSBkZWNvbXBpbGVkU2lnU2NyaXB0W2RlY29tcGlsZWRTaWdTY3JpcHQubGVuZ3RoIC0gMV07XG4gIGNvbnN0IGRlY29tcGlsZWRQdWJTY3JpcHQgPSBzY3JpcHQuZGVjb21waWxlKHB1YlNjcmlwdCk7XG4gIGlmIChkZWNvbXBpbGVkUHViU2NyaXB0Lmxlbmd0aCAhPT0gNikge1xuICAgIHRocm93IG5ldyBFcnJvcihgdW5leHBlY3RlZCBkZWNvbXBpbGVkUHViU2NyaXB0IGxlbmd0aGApO1xuICB9XG4gIGNvbnN0IHB1YmxpY0tleXMgPSBkZWNvbXBpbGVkUHViU2NyaXB0LnNsaWNlKDEsIC0yKTtcblxuICAvLyBPcCBjb2RlcyA4MSB0aHJvdWdoIDk2IHJlcHJlc2VudCBudW1iZXJzIDEgdGhyb3VnaCAxNiAoc2VlIGh0dHBzOi8vZW4uYml0Y29pbi5pdC93aWtpL1NjcmlwdCNPcGNvZGVzKSwgd2hpY2ggaXNcbiAgLy8gd2h5IHdlIHN1YnRyYWN0IGJ5IDgwIHRvIGdldCB0aGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgKG4pIGFuZCB0aGUgbnVtYmVyIG9mIHB1YmxpYyBrZXlzIChtKSBpbiBhbiBuLW9mLW0gc2V0dXAuXG4gIGNvbnN0IGxlbiA9IGRlY29tcGlsZWRQdWJTY3JpcHQubGVuZ3RoO1xuICBjb25zdCBuU2lnbmF0dXJlcyA9IGRlY29tcGlsZWRQdWJTY3JpcHRbMF0gLSA4MDtcbiAgY29uc3QgblB1YktleXMgPSBkZWNvbXBpbGVkUHViU2NyaXB0W2xlbiAtIDJdIC0gODA7XG5cbiAgLy8gRHVlIHRvIGEgYnVnIGluIHRoZSBpbXBsZW1lbnRhdGlvbiBvZiBtdWx0aXNpZ25hdHVyZSBpbiB0aGUgYml0Y29pbiBwcm90b2NvbCwgYSAwIGlzIGFkZGVkIHRvIHRoZSBzaWduYXR1cmVcbiAgLy8gc2NyaXB0LCBzbyB3ZSBhZGQgMSB3aGVuIGFzc2VydGluZyB0aGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgbWF0Y2hlcyB0aGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgZXhwZWN0ZWQgYnkgdGhlXG4gIC8vIHB1YiBzY3JpcHQuIEFsc28sIG5vdGUgdGhhdCB3ZSBjb25zaWRlciBhIHNpZ25hdHVyZSBzY3JpcHQgd2l0aCB0aGUgdGhlIHNhbWUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgYXMgcHVibGljXG4gIC8vIGtleXMgKCsxIGFzIG5vdGVkIGFib3ZlKSB2YWxpZCBiZWNhdXNlIHdlIHVzZSBwbGFjZWhvbGRlciBzaWduYXR1cmVzIHdoZW4gcGFyc2luZyBhIGhhbGYtc2lnbmVkIHNpZ25hdHVyZVxuICAvLyBzY3JpcHQuXG4gIGlmIChzaWduYXR1cmVzLmxlbmd0aCAhPT0gblNpZ25hdHVyZXMgKyAxICYmIHNpZ25hdHVyZXMubGVuZ3RoICE9PSBuUHViS2V5cyArIDEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGV4cGVjdGVkICR7blNpZ25hdHVyZXN9IG9yICR7blB1YktleXN9IHNpZ25hdHVyZXMsIGdvdCAke3NpZ25hdHVyZXMubGVuZ3RoIC0gMX1gKTtcbiAgfVxuXG4gIGlmIChwdWJsaWNLZXlzLmxlbmd0aCAhPT0gblB1YktleXMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGV4cGVjdGVkICR7blB1YktleXN9IHB1YmxpYyBrZXlzLCBnb3QgJHtwdWJsaWNLZXlzLmxlbmd0aH1gKTtcbiAgfVxuXG4gIGNvbnN0IGxhc3RPcENvZGUgPSBkZWNvbXBpbGVkUHViU2NyaXB0W2xlbiAtIDFdO1xuICBpZiAobGFzdE9wQ29kZSAhPT0gb3Bjb2Rlcy5PUF9DSEVDS01VTFRJU0lHKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBleHBlY3RlZCBvcGNvZGUgIyR7b3Bjb2Rlcy5PUF9DSEVDS01VTFRJU0lHfSwgZ290IG9wY29kZSAjJHtsYXN0T3BDb2RlfWApO1xuICB9XG5cbiAgcmV0dXJuIHsgaXNTZWd3aXRJbnB1dCwgaW5wdXRDbGFzc2lmaWNhdGlvbiwgc2lnbmF0dXJlcywgcHVibGljS2V5cywgcHViU2NyaXB0IH07XG59XG5cbi8qKlxuICogVmVyaWZ5IHRoZSBzaWduYXR1cmUgb24gYSAoaGFsZi1zaWduZWQpIHRyYW5zYWN0aW9uXG4gKiBAcGFyYW0gdHJhbnNhY3Rpb24gYml0Y29pbmpzLWxpYiB0eCBvYmplY3RcbiAqIEBwYXJhbSBpbnB1dEluZGV4IFRoZSBpbnB1dCB3aGVyZXJmb3JlIHRvIGNoZWNrIHRoZSBzaWduYXR1cmVcbiAqIEBwYXJhbSBhbW91bnQgRm9yIHNlZ3dpdCBhbmQgQkNILCB0aGUgaW5wdXQgYW1vdW50IG5lZWRzIHRvIGJlIGtub3duIGZvciBzaWduYXR1cmUgdmVyaWZpY2F0aW9uXG4gKiBAcGFyYW0gdmVyaWZpY2F0aW9uU2V0dGluZ3NcbiAqIEBwYXJhbSB2ZXJpZmljYXRpb25TZXR0aW5ncy5zaWduYXR1cmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHNpZ25hdHVyZSB0byB2ZXJpZnkgKG9ubHkgaXRlcmF0ZXMgb3ZlciBub24tZW1wdHkgc2lnbmF0dXJlcylcbiAqIEBwYXJhbSB2ZXJpZmljYXRpb25TZXR0aW5ncy5wdWJsaWNLZXkgVGhlIGhleCBvZiB0aGUgcHVibGljIGtleSB0byB2ZXJpZnkgKHdpbGwgdmVyaWZ5IGFsbCBzaWduYXR1cmVzKVxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2ZXJpZnlTaWduYXR1cmUoXG4gIHRyYW5zYWN0aW9uOiB0eXBlb2YgVHJhbnNhY3Rpb24sXG4gIGlucHV0SW5kZXg6IG51bWJlcixcbiAgYW1vdW50OiBudW1iZXIsXG4gIHZlcmlmaWNhdGlvblNldHRpbmdzOiB7XG4gICAgc2lnbmF0dXJlSW5kZXg/OiBudW1iZXI7XG4gICAgcHVibGljS2V5PzogQnVmZmVyIHwgc3RyaW5nO1xuICB9ID0ge31cbik6IGJvb2xlYW4ge1xuICBpZiAodHlwZW9mIHZlcmlmaWNhdGlvblNldHRpbmdzLnB1YmxpY0tleSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdmVyaWZ5U2lnbmF0dXJlKHRyYW5zYWN0aW9uLCBpbnB1dEluZGV4LCBhbW91bnQsIHtcbiAgICAgIHNpZ25hdHVyZUluZGV4OiB2ZXJpZmljYXRpb25TZXR0aW5ncy5zaWduYXR1cmVJbmRleCxcbiAgICAgIHB1YmxpY0tleTogQnVmZmVyLmZyb20odmVyaWZpY2F0aW9uU2V0dGluZ3MucHVibGljS2V5LCAnaGV4JyksXG4gICAgfSk7XG4gIH1cblxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBpZiAoIXRyYW5zYWN0aW9uLmlucykge1xuICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB0cmFuc2FjdGlvbmApO1xuICB9XG5cbiAgY29uc3QgaW5wdXQgPSB0cmFuc2FjdGlvbi5pbnNbaW5wdXRJbmRleF07XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIGlmICghaW5wdXQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYG5vIGlucHV0IGF0IGluZGV4ICR7aW5wdXRJbmRleH1gKTtcbiAgfVxuXG4gIGNvbnN0IHsgc2lnbmF0dXJlcywgcHVibGljS2V5cywgaXNTZWd3aXRJbnB1dCwgaW5wdXRDbGFzc2lmaWNhdGlvbiwgcHViU2NyaXB0IH0gPSBwYXJzZVNpZ25hdHVyZVNjcmlwdChpbnB1dCk7XG5cbiAgaWYgKCFbc2NyaXB0LnR5cGVzLlAyV1NILCBzY3JpcHQudHlwZXMuUDJTSCwgc2NyaXB0LnR5cGVzLlAyUEtIXS5pbmNsdWRlcyhpbnB1dENsYXNzaWZpY2F0aW9uKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmICghcHVibGljS2V5cyB8fCBwdWJsaWNLZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChpc1NlZ3dpdElucHV0ICYmICFhbW91bnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoIXNpZ25hdHVyZXMpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBnZXQgdGhlIGZpcnN0IG5vbi1lbXB0eSBzaWduYXR1cmUgYW5kIHZlcmlmeSBpdCBhZ2FpbnN0IGFsbCBwdWJsaWMga2V5c1xuICBjb25zdCBub25FbXB0eVNpZ25hdHVyZXMgPSBzaWduYXR1cmVzLmZpbHRlcigocykgPT4gcy5sZW5ndGggPiAwKTtcblxuICAvKlxuICBXZSBlaXRoZXIgd2FudCB0byB2ZXJpZnkgYWxsIHNpZ25hdHVyZS9wdWJrZXkgY29tYmluYXRpb25zLCBvciBkbyBhbiBleHBsaWNpdCBjb21iaW5hdGlvblxuXG4gIElmIGEgc2lnbmF0dXJlIGluZGV4IGlzIHNwZWNpZmllZCwgb25seSB0aGF0IHNpZ25hdHVyZSBpcyBjaGVja2VkLiBJdCdzIHZlcmlmaWVkIGFnYWluc3QgYWxsIHB1YmxpYyBrZXlzLlxuICBJZiBhIHNpbmdsZSBwdWJsaWMga2V5IGlzIGZvdW5kIHRvIGJlIHZhbGlkLCB0aGUgZnVuY3Rpb24gcmV0dXJucyB0cnVlLlxuXG4gIElmIGEgcHVibGljIGtleSBpcyBzcGVjaWZpZWQsIHdlIGl0ZXJhdGUgb3ZlciBhbGwgc2lnbmF0dXJlcy4gSWYgYSBzaW5nbGUgb25lIG1hdGNoZXMgdGhlIHB1YmxpYyBrZXksIHRoZSBmdW5jdGlvblxuICByZXR1cm5zIHRydWUuXG5cbiAgSWYgbmVpdGhlciBpcyBzcGVjaWZpZWQsIGFsbCBzaWduYXR1cmVzIGFyZSBjaGVja2VkIGFnYWluc3QgYWxsIHB1YmxpYyBrZXlzLiBFYWNoIHNpZ25hdHVyZSBtdXN0IGhhdmUgaXRzIG93biBkaXN0aW5jdFxuICBwdWJsaWMga2V5IHRoYXQgaXQgbWF0Y2hlcyBmb3IgdGhlIGZ1bmN0aW9uIHRvIHJldHVybiB0cnVlLlxuICAgKi9cbiAgbGV0IHNpZ25hdHVyZXNUb0NoZWNrID0gbm9uRW1wdHlTaWduYXR1cmVzO1xuICBpZiAodmVyaWZpY2F0aW9uU2V0dGluZ3Muc2lnbmF0dXJlSW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgIHNpZ25hdHVyZXNUb0NoZWNrID0gW25vbkVtcHR5U2lnbmF0dXJlc1t2ZXJpZmljYXRpb25TZXR0aW5ncy5zaWduYXR1cmVJbmRleF1dO1xuICB9XG5cbiAgbGV0IGFyZUFsbFNpZ25hdHVyZXNWYWxpZCA9IHRydWU7XG5cbiAgLy8gZ28gb3ZlciBhbGwgc2lnbmF0dXJlc1xuICBmb3IgKGNvbnN0IHNpZ25hdHVyZUJ1ZmZlciBvZiBzaWduYXR1cmVzVG9DaGVjaykge1xuICAgIGxldCBpc1NpZ25hdHVyZVZhbGlkID0gZmFsc2U7XG5cbiAgICBjb25zdCBoYXNTaWduYXR1cmVCdWZmZXIgPSBCdWZmZXIuaXNCdWZmZXIoc2lnbmF0dXJlQnVmZmVyKSAmJiBzaWduYXR1cmVCdWZmZXIubGVuZ3RoID4gMDtcbiAgICBpZiAoaGFzU2lnbmF0dXJlQnVmZmVyICYmIEJ1ZmZlci5pc0J1ZmZlcihwdWJTY3JpcHQpICYmIHB1YlNjcmlwdC5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBzbGljZSB0aGUgbGFzdCBieXRlIGZyb20gdGhlIHNpZ25hdHVyZSBoYXNoIGlucHV0IGJlY2F1c2UgaXQncyB0aGUgaGFzaCB0eXBlXG4gICAgICBjb25zdCBzaWduYXR1cmUgPSBFQ1NpZ25hdHVyZS5mcm9tREVSKHNpZ25hdHVyZUJ1ZmZlci5zbGljZSgwLCAtMSkpO1xuICAgICAgY29uc3QgaGFzaFR5cGUgPSBzaWduYXR1cmVCdWZmZXJbc2lnbmF0dXJlQnVmZmVyLmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKCFoYXNoVHlwZSkge1xuICAgICAgICAvLyBtaXNzaW5nIGhhc2hUeXBlIGJ5dGUgLSBzaWduYXR1cmUgY2Fubm90IGJlIHZhbGlkYXRlZFxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBjb25zdCBzaWduYXR1cmVIYXNoID0gdHJhbnNhY3Rpb24uaGFzaEZvclNpZ25hdHVyZUJ5TmV0d29yayhcbiAgICAgICAgaW5wdXRJbmRleCxcbiAgICAgICAgcHViU2NyaXB0LFxuICAgICAgICBhbW91bnQsXG4gICAgICAgIGhhc2hUeXBlLFxuICAgICAgICBpc1NlZ3dpdElucHV0XG4gICAgICApO1xuXG4gICAgICBsZXQgbWF0Y2hlZFB1YmxpY0tleUluZGljZXMgPSAobmV3IEFycmF5PGJvb2xlYW4+KHB1YmxpY0tleXMubGVuZ3RoKSkuZmlsbChmYWxzZSk7XG4gICAgICBcbiAgICAgIGZvciAobGV0IHB1YmxpY0tleUluZGV4ID0gMDsgcHVibGljS2V5SW5kZXggPCBwdWJsaWNLZXlzLmxlbmd0aDsgcHVibGljS2V5SW5kZXgrKykge1xuICAgICAgICBjb25zdCBwdWJsaWNLZXlCdWZmZXIgPSBwdWJsaWNLZXlzW3B1YmxpY0tleUluZGV4XTtcbiAgICAgICAgaWYgKHZlcmlmaWNhdGlvblNldHRpbmdzLnB1YmxpY0tleSAhPT0gdW5kZWZpbmVkICYmICFwdWJsaWNLZXlCdWZmZXIuZXF1YWxzKHZlcmlmaWNhdGlvblNldHRpbmdzLnB1YmxpY0tleSkpIHtcbiAgICAgICAgICAvLyB3ZSBhcmUgb25seSBsb29raW5nIHRvIHZlcmlmeSBvbmUgc3BlY2lmaWMgcHVibGljIGtleSdzIHNpZ25hdHVyZSAocHVibGljS2V5SGV4KVxuICAgICAgICAgIC8vIHRoaXMgcGFydGljdWxhciBwdWJsaWMga2V5IGlzIG5vdCB0aGUgb25lIHdob3NlIHNpZ25hdHVyZSB3ZSdyZSB0cnlpbmcgdG8gdmVyaWZ5XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWF0Y2hlZFB1YmxpY0tleUluZGljZXNbcHVibGljS2V5SW5kZXhdKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwdWJsaWNLZXkgPSBFQ1BhaXIuZnJvbVB1YmxpY0tleUJ1ZmZlcihwdWJsaWNLZXlCdWZmZXIpO1xuICAgICAgICBpZiAocHVibGljS2V5LnZlcmlmeShzaWduYXR1cmVIYXNoLCBzaWduYXR1cmUpKSB7XG4gICAgICAgICAgaXNTaWduYXR1cmVWYWxpZCA9IHRydWU7XG4gICAgICAgICAgbWF0Y2hlZFB1YmxpY0tleUluZGljZXNbcHVibGljS2V5SW5kZXhdID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh2ZXJpZmljYXRpb25TZXR0aW5ncy5wdWJsaWNLZXkgIT09IHVuZGVmaW5lZCAmJiBpc1NpZ25hdHVyZVZhbGlkKSB7XG4gICAgICAvLyBXZSB3ZXJlIHRyeWluZyB0byBzZWUgaWYgYW55IG9mIHRoZSBzaWduYXR1cmVzIHdhcyB2YWxpZCBmb3IgdGhlIGdpdmVuIHB1YmxpYyBrZXkuIEV2aWRlbnRseSB5ZXMuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoIWlzU2lnbmF0dXJlVmFsaWQgJiYgdmVyaWZpY2F0aW9uU2V0dGluZ3MucHVibGljS2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBhcmVBbGxTaWduYXR1cmVzVmFsaWQgPSBpc1NpZ25hdHVyZVZhbGlkICYmIGFyZUFsbFNpZ25hdHVyZXNWYWxpZDtcbiAgfVxuXG4gIHJldHVybiBhcmVBbGxTaWduYXR1cmVzVmFsaWQ7XG59XG4iXX0=