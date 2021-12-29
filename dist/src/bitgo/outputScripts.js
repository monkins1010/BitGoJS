"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOutputScript2of3 = exports.isScriptType2Of3 = exports.scriptTypes2Of3 = void 0;
/**
 * @prettier
 */
const script = require("../script");
const crypto = require("../crypto");
exports.scriptTypes2Of3 = ['p2sh', 'p2shP2wsh', 'p2wsh'];
function isScriptType2Of3(t) {
    return exports.scriptTypes2Of3.includes(t);
}
exports.isScriptType2Of3 = isScriptType2Of3;
/**
 * Return scripts for 2-of-3 multisig output
 * @param pubkeys - the key array for multisig
 * @param scriptType
 * @returns {{redeemScript, witnessScript, address}}
 */
function createOutputScript2of3(pubkeys, scriptType) {
    if (pubkeys.length !== 3) {
        throw new Error(`must provide 3 pubkeys`);
    }
    pubkeys.forEach((key) => {
        if (key.length !== 33) {
            throw new Error(`Unexpected key length ${key.length}. Must use compressed keys.`);
        }
    });
    const script2of3 = script.multisig.output.encode(2, pubkeys);
    const p2wshOutputScript = script.witnessScriptHash.output.encode(crypto.sha256(script2of3));
    let redeemScript;
    let witnessScript;
    switch (scriptType) {
        case 'p2sh':
            redeemScript = script2of3;
            break;
        case 'p2shP2wsh':
            witnessScript = script2of3;
            redeemScript = p2wshOutputScript;
            break;
        case 'p2wsh':
            witnessScript = script2of3;
            break;
        default:
            throw new Error(`unknown multisig script type ${scriptType}`);
    }
    let scriptPubKey;
    if (scriptType === 'p2wsh') {
        scriptPubKey = p2wshOutputScript;
    }
    else {
        const redeemScriptHash = crypto.hash160(redeemScript);
        scriptPubKey = script.scriptHash.output.encode(redeemScriptHash);
    }
    return { redeemScript, witnessScript, scriptPubKey };
}
exports.createOutputScript2of3 = createOutputScript2of3;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0U2NyaXB0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9iaXRnby9vdXRwdXRTY3JpcHRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBOztHQUVHO0FBQ0gsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ3BDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUV2QixRQUFBLGVBQWUsR0FBRyxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFVLENBQUM7QUFHdkUsU0FBZ0IsZ0JBQWdCLENBQUMsQ0FBUztJQUN4QyxPQUFPLHVCQUFlLENBQUMsUUFBUSxDQUFDLENBQW1CLENBQUMsQ0FBQztBQUN2RCxDQUFDO0FBRkQsNENBRUM7QUFRRDs7Ozs7R0FLRztBQUNILFNBQWdCLHNCQUFzQixDQUFDLE9BQWlCLEVBQUUsVUFBMEI7SUFDbEYsSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUN4QixNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUM7S0FDM0M7SUFDRCxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7UUFDdEIsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLEVBQUUsRUFBRTtZQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixHQUFHLENBQUMsTUFBTSw2QkFBNkIsQ0FBQyxDQUFDO1NBQ25GO0lBQ0gsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzdELE1BQU0saUJBQWlCLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQzVGLElBQUksWUFBWSxDQUFDO0lBQ2pCLElBQUksYUFBYSxDQUFDO0lBQ2xCLFFBQVEsVUFBVSxFQUFFO1FBQ2xCLEtBQUssTUFBTTtZQUNULFlBQVksR0FBRyxVQUFVLENBQUM7WUFDMUIsTUFBTTtRQUNSLEtBQUssV0FBVztZQUNkLGFBQWEsR0FBRyxVQUFVLENBQUM7WUFDM0IsWUFBWSxHQUFHLGlCQUFpQixDQUFDO1lBQ2pDLE1BQU07UUFDUixLQUFLLE9BQU87WUFDVixhQUFhLEdBQUcsVUFBVSxDQUFDO1lBQzNCLE1BQU07UUFDUjtZQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0NBQWdDLFVBQVUsRUFBRSxDQUFDLENBQUM7S0FDakU7SUFFRCxJQUFJLFlBQVksQ0FBQztJQUNqQixJQUFJLFVBQVUsS0FBSyxPQUFPLEVBQUU7UUFDMUIsWUFBWSxHQUFHLGlCQUFpQixDQUFDO0tBQ2xDO1NBQU07UUFDTCxNQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdEQsWUFBWSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0tBQ2xFO0lBRUQsT0FBTyxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLENBQUM7QUFDdkQsQ0FBQztBQXRDRCx3REFzQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwcmV0dGllclxuICovXG5jb25zdCBzY3JpcHQgPSByZXF1aXJlKFwiLi4vc2NyaXB0XCIpO1xuY29uc3QgY3J5cHRvID0gcmVxdWlyZShcIi4uL2NyeXB0b1wiKTtcblxuZXhwb3J0IGNvbnN0IHNjcmlwdFR5cGVzMk9mMyA9IFsncDJzaCcsICdwMnNoUDJ3c2gnLCAncDJ3c2gnXSBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIFNjcmlwdFR5cGUyT2YzID0gdHlwZW9mIHNjcmlwdFR5cGVzMk9mM1tudW1iZXJdO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNTY3JpcHRUeXBlMk9mMyh0OiBzdHJpbmcpOiB0IGlzIFNjcmlwdFR5cGUyT2YzIHtcbiAgcmV0dXJuIHNjcmlwdFR5cGVzMk9mMy5pbmNsdWRlcyh0IGFzIFNjcmlwdFR5cGUyT2YzKTtcbn1cblxuZXhwb3J0IHR5cGUgU3BlbmRhYmxlU2NyaXB0ID0ge1xuICBzY3JpcHRQdWJLZXk6IEJ1ZmZlcjtcbiAgcmVkZWVtU2NyaXB0PzogQnVmZmVyO1xuICB3aXRuZXNzU2NyaXB0PzogQnVmZmVyO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gc2NyaXB0cyBmb3IgMi1vZi0zIG11bHRpc2lnIG91dHB1dFxuICogQHBhcmFtIHB1YmtleXMgLSB0aGUga2V5IGFycmF5IGZvciBtdWx0aXNpZ1xuICogQHBhcmFtIHNjcmlwdFR5cGVcbiAqIEByZXR1cm5zIHt7cmVkZWVtU2NyaXB0LCB3aXRuZXNzU2NyaXB0LCBhZGRyZXNzfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU91dHB1dFNjcmlwdDJvZjMocHVia2V5czogQnVmZmVyW10sIHNjcmlwdFR5cGU6IFNjcmlwdFR5cGUyT2YzKTogU3BlbmRhYmxlU2NyaXB0IHtcbiAgaWYgKHB1YmtleXMubGVuZ3RoICE9PSAzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBtdXN0IHByb3ZpZGUgMyBwdWJrZXlzYCk7XG4gIH1cbiAgcHVia2V5cy5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBpZiAoa2V5Lmxlbmd0aCAhPT0gMzMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCBrZXkgbGVuZ3RoICR7a2V5Lmxlbmd0aH0uIE11c3QgdXNlIGNvbXByZXNzZWQga2V5cy5gKTtcbiAgICB9XG4gIH0pO1xuXG4gIGNvbnN0IHNjcmlwdDJvZjMgPSBzY3JpcHQubXVsdGlzaWcub3V0cHV0LmVuY29kZSgyLCBwdWJrZXlzKTtcbiAgY29uc3QgcDJ3c2hPdXRwdXRTY3JpcHQgPSBzY3JpcHQud2l0bmVzc1NjcmlwdEhhc2gub3V0cHV0LmVuY29kZShjcnlwdG8uc2hhMjU2KHNjcmlwdDJvZjMpKTtcbiAgbGV0IHJlZGVlbVNjcmlwdDtcbiAgbGV0IHdpdG5lc3NTY3JpcHQ7XG4gIHN3aXRjaCAoc2NyaXB0VHlwZSkge1xuICAgIGNhc2UgJ3Ayc2gnOlxuICAgICAgcmVkZWVtU2NyaXB0ID0gc2NyaXB0Mm9mMztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3Ayc2hQMndzaCc6XG4gICAgICB3aXRuZXNzU2NyaXB0ID0gc2NyaXB0Mm9mMztcbiAgICAgIHJlZGVlbVNjcmlwdCA9IHAyd3NoT3V0cHV0U2NyaXB0O1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAncDJ3c2gnOlxuICAgICAgd2l0bmVzc1NjcmlwdCA9IHNjcmlwdDJvZjM7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bmtub3duIG11bHRpc2lnIHNjcmlwdCB0eXBlICR7c2NyaXB0VHlwZX1gKTtcbiAgfVxuXG4gIGxldCBzY3JpcHRQdWJLZXk7XG4gIGlmIChzY3JpcHRUeXBlID09PSAncDJ3c2gnKSB7XG4gICAgc2NyaXB0UHViS2V5ID0gcDJ3c2hPdXRwdXRTY3JpcHQ7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcmVkZWVtU2NyaXB0SGFzaCA9IGNyeXB0by5oYXNoMTYwKHJlZGVlbVNjcmlwdCk7XG4gICAgc2NyaXB0UHViS2V5ID0gc2NyaXB0LnNjcmlwdEhhc2gub3V0cHV0LmVuY29kZShyZWRlZW1TY3JpcHRIYXNoKTtcbiAgfVxuXG4gIHJldHVybiB7IHJlZGVlbVNjcmlwdCwgd2l0bmVzc1NjcmlwdCwgc2NyaXB0UHViS2V5IH07XG59XG4iXX0=