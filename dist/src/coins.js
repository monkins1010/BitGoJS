"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZEC = exports.VRSC = exports.LTC = exports.KMD = exports.DOGE = exports.DGB = exports.DEFAULT = exports.DASH = exports.BTG = exports.BTC = exports.BSV = exports.BCH = exports.isValidNetwork = exports.isDigibyte = exports.isDoge = exports.isKomodo = exports.isZcashCompatible = exports.isPBaaS = exports.isVerus = exports.isZcash = exports.isLitecoin = exports.isDash = exports.isBitcoinSV = exports.isBitcoinGold = exports.isBitcoinCash = exports.isBitcoin = exports.getTestnet = exports.isSameCoin = exports.isTestnet = exports.isMainnet = exports.getMainnet = exports.getNetworkName = exports.getNetworkList = void 0;
/**
 * @prettier
 */
const networks = require("./networks");
const networkTypes_1 = require("./networkTypes");
const typeforce = require('typeforce');
/**
 * @returns {Network[]} all known networks as array
 */
function getNetworkList() {
    return Object.keys(networks).map((n) => networks[n]);
}
exports.getNetworkList = getNetworkList;
/**
 * @param {Network} network
 * @returns {NetworkName} the name of the network. Returns undefined if network is not a value
 *                   of `networks`
 */
function getNetworkName(network) {
    const nameStringOrUndefined = Object.keys(networks).find((n) => networks[n] === network);
    if (typeof nameStringOrUndefined === 'string')
        return nameStringOrUndefined;
    else
        return undefined;
}
exports.getNetworkName = getNetworkName;
/**
 * @param {Network} network
 * @returns {Object} the mainnet corresponding to a testnet
 */
function getMainnet(network) {
    switch (network) {
        case networks.verus:
        case networks.verustest:
            return networks.verus;
        case networks.kmd:
            return networks.kmd;
        case networks.doge:
            return networks.doge;
        case networks.digibyte:
            return networks.digibyte;
        case networks.bitcoin:
        case networks.testnet:
            return networks.bitcoin;
        case networks.bitcoincash:
        case networks.bitcoincashTestnet:
            return networks.bitcoincash;
        case networks.bitcoingold:
        case networks.bitcoingoldTestnet:
            return networks.bitcoingold;
        case networks.bitcoinsv:
        case networks.bitcoinsvTestnet:
            return networks.bitcoinsv;
        case networks.dash:
        case networks.dashTest:
            return networks.dash;
        case networks.litecoin:
        case networks.litecoinTest:
            return networks.litecoin;
        case networks.zcash:
        case networks.zcashTest:
            return networks.zcash;
        case networks.default:
            return networks.default;
        default:
            return network;
    }
}
exports.getMainnet = getMainnet;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is a mainnet
 */
function isMainnet(network) {
    return getMainnet(network) === network;
}
exports.isMainnet = isMainnet;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is a testnet
 */
function isTestnet(network) {
    return getMainnet(network) !== network;
}
exports.isTestnet = isTestnet;
/**
 *
 * @param {Network} network
 * @param {Network} otherNetwork
 * @returns {boolean} true iff both networks are for the same coin
 */
function isSameCoin(network, otherNetwork) {
    return getMainnet(network) === getMainnet(otherNetwork);
}
exports.isSameCoin = isSameCoin;
const mainnets = getNetworkList().filter(isMainnet);
const testnets = getNetworkList().filter(isTestnet);
/**
 * Map where keys are mainnet networks and values are testnet networks
 * @type {Map<Network, Network[]>}
 */
const mainnetTestnetPairs = new Map(mainnets.map((m) => [m, testnets.filter((t) => getMainnet(t) === m)]));
/**
 * @param {Network} network
 * @returns {Network|undefined} - The testnet corresponding to a mainnet.
 *                               Returns undefined if a network has no testnet.
 */
function getTestnet(network) {
    if (isTestnet(network)) {
        return network;
    }
    const testnets = mainnetTestnetPairs.get(network);
    if (testnets === undefined) {
        throw new Error(`invalid argument`);
    }
    if (testnets.length === 0) {
        return;
    }
    if (testnets.length === 1) {
        return testnets[0];
    }
    throw new Error(`more than one testnet for ${getNetworkName(network)}`);
}
exports.getTestnet = getTestnet;
/**
 * @param {Network} network
 * @returns {boolean} true iff network bitcoin or testnet
 */
function isBitcoin(network) {
    return getMainnet(network) === networks.bitcoin;
}
exports.isBitcoin = isBitcoin;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is bitcoincash or bitcoincashTestnet
 */
function isBitcoinCash(network) {
    return getMainnet(network) === networks.bitcoincash;
}
exports.isBitcoinCash = isBitcoinCash;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is bitcoingold
 */
function isBitcoinGold(network) {
    return getMainnet(network) === networks.bitcoingold;
}
exports.isBitcoinGold = isBitcoinGold;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is bitcoinsv or bitcoinsvTestnet
 */
function isBitcoinSV(network) {
    return getMainnet(network) === networks.bitcoinsv;
}
exports.isBitcoinSV = isBitcoinSV;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is dash or dashTest
 */
function isDash(network) {
    return getMainnet(network) === networks.dash;
}
exports.isDash = isDash;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is litecoin or litecoinTest
 */
function isLitecoin(network) {
    return getMainnet(network) === networks.litecoin;
}
exports.isLitecoin = isLitecoin;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is zcash or zcashTest
 */
function isZcash(network) {
    return getMainnet(network) === networks.zcash;
}
exports.isZcash = isZcash;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is Verus or VerusTest
 */
function isVerus(network) {
    return getMainnet(network) === networks.verus;
}
exports.isVerus = isVerus;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is PBaaS compatible
 */
function isPBaaS(network) {
    return network && !!network.isPBaaS;
}
exports.isPBaaS = isPBaaS;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is zcash compatible
 */
function isZcashCompatible(network) {
    return isZcash(network) || isPBaaS(network) || isKomodo(network);
}
exports.isZcashCompatible = isZcashCompatible;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is Komodo
 */
function isKomodo(network) {
    return getMainnet(network) === networks.kmd;
}
exports.isKomodo = isKomodo;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is Doge
 */
function isDoge(network) {
    return getMainnet(network) === networks.doge;
}
exports.isDoge = isDoge;
/**
 * @param {Network} network
 * @returns {boolean} true iff network is Digibyte
 */
function isDigibyte(network) {
    return getMainnet(network) === networks.digibyte;
}
exports.isDigibyte = isDigibyte;
/**
 * @param {Network} network
 * @returns {boolean} returns true iff network is any of the network stated in the argument
 */
exports.isValidNetwork = typeforce.oneOf(isBitcoin, isBitcoinCash, isBitcoinGold, isBitcoinSV, isDash, isLitecoin, isZcash, isZcashCompatible, isVerus, isPBaaS, isKomodo, isDoge, isDigibyte);
/** @deprecated */
exports.BCH = networkTypes_1.coins.BCH;
/** @deprecated */
exports.BSV = networkTypes_1.coins.BSV;
/** @deprecated */
exports.BTC = networkTypes_1.coins.BTC;
/** @deprecated */
exports.BTG = networkTypes_1.coins.BTG;
/** @deprecated */
exports.DASH = networkTypes_1.coins.DASH;
/** @deprecated */
exports.DEFAULT = networkTypes_1.coins.DEFAULT;
/** @deprecated */
exports.DGB = networkTypes_1.coins.DGB;
/** @deprecated */
exports.DOGE = networkTypes_1.coins.DOGE;
/** @deprecated */
exports.KMD = networkTypes_1.coins.KMD;
/** @deprecated */
exports.LTC = networkTypes_1.coins.LTC;
/** @deprecated */
exports.VRSC = networkTypes_1.coins.VRSC;
/** @deprecated */
exports.ZEC = networkTypes_1.coins.ZEC;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29pbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29pbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7O0dBRUc7QUFDSCx1Q0FBdUM7QUFDdkMsaURBQTJFO0FBRTNFLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUV2Qzs7R0FFRztBQUNILFNBQWdCLGNBQWM7SUFDNUIsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEUsQ0FBQztBQUZELHdDQUVDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQWdCLGNBQWMsQ0FBQyxPQUFnQjtJQUM3QyxNQUFNLHFCQUFxQixHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQWMsQ0FBQyxDQUFDLEtBQUssT0FBTyxDQUFDLENBQUM7SUFFdEcsSUFBSSxPQUFPLHFCQUFxQixLQUFLLFFBQVE7UUFBRSxPQUFvQixxQkFBcUIsQ0FBQTs7UUFDbkYsT0FBTyxTQUFTLENBQUE7QUFDdkIsQ0FBQztBQUxELHdDQUtDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsVUFBVSxDQUFDLE9BQWdCO0lBQ3pDLFFBQVEsT0FBTyxFQUFFO1FBQ2YsS0FBSyxRQUFRLENBQUMsS0FBSyxDQUFDO1FBQ3BCLEtBQUssUUFBUSxDQUFDLFNBQVM7WUFDckIsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFBO1FBRXZCLEtBQUssUUFBUSxDQUFDLEdBQUc7WUFDZixPQUFPLFFBQVEsQ0FBQyxHQUFHLENBQUE7UUFFckIsS0FBSyxRQUFRLENBQUMsSUFBSTtZQUNoQixPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUE7UUFFdEIsS0FBSyxRQUFRLENB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RUFDakIsT0FBTyxFQUNQLE9BQU8sRUFDUCxRQUFRLEVBQ1IsTUFBTSxFQUNOLFVBQVUsQ0FDWCxDQUFBO0FBR0Qsa0JBQWtCO0FBQ0wsUUFBQSxHQUFHLEdBQUcsb0JBQUssQ0FBQyxHQUFHLENBQUM7QUFDN0Isa0JBQWtCO0FBQ0wsUUFBQSxHQUFHLEdBQUcsb0JBQUssQ0FBQyxHQUFHLENBQUM7QUFDN0Isa0JBQWtCO0FBQ0wsUUFBQSxHQUFHLEdBQUcsb0JBQUssQ0FBQyxHQUFHLENBQUM7QUFDN0Isa0JBQWtCO0FBQ0wsUUFBQSxHQUFHLEdBQUcsb0JBQUssQ0FBQyxHQUFHLENBQUM7QUFDN0Isa0JBQWtCO0FBQ0wsUUFBQSxJQUFJLEdBQUcsb0JBQUssQ0FBQyxJQUFJLENBQUM7QUFDL0Isa0JBQWtCO0FBQ0wsUUFBQSxPQUFPLEdBQUcsb0JBQUssQ0FBQyxPQUFPLENBQUM7QUFDckMsa0JBQWtCO0FBQ0wsUUFBQSxHQUFHLEdBQUcsb0JBQUssQ0FBQyxHQUFHLENBQUM7QUFDN0Isa0JBQWtCO0FBQ0wsUUFBQSxJQUFJLEdBQUcsb0JBQUssQ0FBQyxJQUFJLENBQUM7QUFDL0Isa0JBQWtCO0FBQ0wsUUFBQSxHQUFHLEdBQUcsb0JBQUssQ0FBQyxHQUFHLENBQUM7QUFDN0Isa0JBQWtCO0FBQ0wsUUFBQSxHQUFHLEdBQUcsb0JBQUssQ0FBQyxHQUFHLENBQUM7QUFDN0Isa0JBQWtCO0FBQ0wsUUFBQSxJQUFJLEdBQUcsb0JBQUssQ0FBQyxJQUFJLENBQUM7QUFDL0Isa0JBQWtCO0FBQ0wsUUFBQSxHQUFHLEdBQUcsb0JBQUssQ0FBQyxHQUFHLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwcmV0dGllclxuICovXG5pbXBvcnQgKiBhcyBuZXR3b3JrcyBmcm9tICcuL25ldHdvcmtzJztcbmltcG9ydCB7IGNvaW5zLCBOZXR3b3JrLCBOZXR3b3JrTmFtZSwgUEJhYVNOZXR3b3JrIH0gZnJvbSAnLi9uZXR3b3JrVHlwZXMnO1xuXG5jb25zdCB0eXBlZm9yY2UgPSByZXF1aXJlKCd0eXBlZm9yY2UnKTtcblxuLyoqXG4gKiBAcmV0dXJucyB7TmV0d29ya1tdfSBhbGwga25vd24gbmV0d29ya3MgYXMgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE5ldHdvcmtMaXN0KCk6IE5ldHdvcmtbXSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhuZXR3b3JrcykubWFwKChuKSA9PiBuZXR3b3Jrc1s8TmV0d29ya05hbWU+bl0pO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xuICogQHJldHVybnMge05ldHdvcmtOYW1lfSB0aGUgbmFtZSBvZiB0aGUgbmV0d29yay4gUmV0dXJucyB1bmRlZmluZWQgaWYgbmV0d29yayBpcyBub3QgYSB2YWx1ZVxuICogICAgICAgICAgICAgICAgICAgb2YgYG5ldHdvcmtzYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmV0d29ya05hbWUobmV0d29yazogTmV0d29yayk6IE5ldHdvcmtOYW1lIHwgdW5kZWZpbmVkIHtcbiAgY29uc3QgbmFtZVN0cmluZ09yVW5kZWZpbmVkID0gT2JqZWN0LmtleXMobmV0d29ya3MpLmZpbmQoKG4pID0+IG5ldHdvcmtzWzxOZXR3b3JrTmFtZT5uXSA9PT0gbmV0d29yayk7XG5cbiAgaWYgKHR5cGVvZiBuYW1lU3RyaW5nT3JVbmRlZmluZWQgPT09ICdzdHJpbmcnKSByZXR1cm4gPE5ldHdvcmtOYW1lPm5hbWVTdHJpbmdPclVuZGVmaW5lZFxuICBlbHNlIHJldHVybiB1bmRlZmluZWRcbn1cblxuLyoqXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcbiAqIEByZXR1cm5zIHtPYmplY3R9IHRoZSBtYWlubmV0IGNvcnJlc3BvbmRpbmcgdG8gYSB0ZXN0bmV0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRNYWlubmV0KG5ldHdvcms6IE5ldHdvcmspOiBOZXR3b3JrIHtcbiAgc3dpdGNoIChuZXR3b3JrKSB7XG4gICAgY2FzZSBuZXR3b3Jrcy52ZXJ1czpcbiAgICBjYXNlIG5ldHdvcmtzLnZlcnVzdGVzdDpcbiAgICAgIHJldHVybiBuZXR3b3Jrcy52ZXJ1c1xuXG4gICAgY2FzZSBuZXR3b3Jrcy5rbWQ6XG4gICAgICByZXR1cm4gbmV0d29ya3Mua21kXG5cbiAgICBjYXNlIG5ldHdvcmtzLmRvZ2U6XG4gICAgICByZXR1cm4gbmV0d29ya3MuZG9nZVxuXG4gICAgY2FzZSBuZXR3b3Jrcy5kaWdpYnl0ZTpcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5kaWdpYnl0ZVxuXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luOlxuICAgIGNhc2UgbmV0d29ya3MudGVzdG5ldDpcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5iaXRjb2luO1xuXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoVGVzdG5ldDpcbiAgICAgIHJldHVybiBuZXR3b3Jrcy5iaXRjb2luY2FzaDtcblxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGQ6XG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZFRlc3RuZXQ6XG4gICAgICByZXR1cm4gbmV0d29ya3MuYml0Y29pbmdvbGQ7XG5cbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdjpcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdlRlc3RuZXQ6XG4gICAgICByZXR1cm4gbmV0d29ya3MuYml0Y29pbnN2O1xuXG4gICAgY2FzZSBuZXR3b3Jrcy5kYXNoOlxuICAgIGNhc2UgbmV0d29ya3MuZGFzaFRlc3Q6XG4gICAgICByZXR1cm4gbmV0d29ya3MuZGFzaDtcblxuICAgIGNhc2UgbmV0d29ya3MubGl0ZWNvaW46XG4gICAgY2FzZSBuZXR3b3Jrcy5saXRlY29pblRlc3Q6XG4gICAgICByZXR1cm4gbmV0d29ya3MubGl0ZWNvaW47XG5cbiAgICBjYXNlIG5ldHdvcmtzLnpjYXNoOlxuICAgIGNhc2UgbmV0d29ya3MuemNhc2hUZXN0OlxuICAgICAgcmV0dXJuIG5ldHdvcmtzLnpjYXNoXG5cbiAgICBjYXNlIG5ldHdvcmtzLmRlZmF1bHQ6XG4gICAgICByZXR1cm4gbmV0d29ya3MuZGVmYXVsdFxuXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBuZXR3b3JrXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiBuZXR3b3JrIGlzIGEgbWFpbm5ldFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNNYWlubmV0KG5ldHdvcms6IE5ldHdvcmspOiBib29sZWFuIHtcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcms7XG59XG5cbi8qKlxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBpcyBhIHRlc3RuZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzVGVzdG5ldChuZXR3b3JrOiBOZXR3b3JrKTogYm9vbGVhbiB7XG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspICE9PSBuZXR3b3JrO1xufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0ge05ldHdvcmt9IG5ldHdvcmtcbiAqIEBwYXJhbSB7TmV0d29ya30gb3RoZXJOZXR3b3JrXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgYm90aCBuZXR3b3JrcyBhcmUgZm9yIHRoZSBzYW1lIGNvaW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU2FtZUNvaW4obmV0d29yazogTmV0d29yaywgb3RoZXJOZXR3b3JrOiBOZXR3b3JrKSB7XG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspID09PSBnZXRNYWlubmV0KG90aGVyTmV0d29yayk7XG59XG5cbmNvbnN0IG1haW5uZXRzID0gZ2V0TmV0d29ya0xpc3QoKS5maWx0ZXIoaXNNYWlubmV0KTtcbmNvbnN0IHRlc3RuZXRzID0gZ2V0TmV0d29ya0xpc3QoKS5maWx0ZXIoaXNUZXN0bmV0KTtcblxuLyoqXG4gKiBNYXAgd2hlcmUga2V5cyBhcmUgbWFpbm5ldCBuZXR3b3JrcyBhbmQgdmFsdWVzIGFyZSB0ZXN0bmV0IG5ldHdvcmtzXG4gKiBAdHlwZSB7TWFwPE5ldHdvcmssIE5ldHdvcmtbXT59XG4gKi9cbmNvbnN0IG1haW5uZXRUZXN0bmV0UGFpcnMgPSBuZXcgTWFwKG1haW5uZXRzLm1hcCgobSkgPT4gW20sIHRlc3RuZXRzLmZpbHRlcigodCkgPT4gZ2V0TWFpbm5ldCh0KSA9PT0gbSldKSk7XG5cbi8qKlxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXG4gKiBAcmV0dXJucyB7TmV0d29ya3x1bmRlZmluZWR9IC0gVGhlIHRlc3RuZXQgY29ycmVzcG9uZGluZyB0byBhIG1haW5uZXQuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZXR1cm5zIHVuZGVmaW5lZCBpZiBhIG5ldHdvcmsgaGFzIG5vIHRlc3RuZXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUZXN0bmV0KG5ldHdvcms6IE5ldHdvcmspOiBOZXR3b3JrIHwgdW5kZWZpbmVkIHtcbiAgaWYgKGlzVGVzdG5ldChuZXR3b3JrKSkge1xuICAgIHJldHVybiBuZXR3b3JrO1xuICB9XG4gIGNvbnN0IHRlc3RuZXRzID0gbWFpbm5ldFRlc3RuZXRQYWlycy5nZXQobmV0d29yayk7XG4gIGlmICh0ZXN0bmV0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIGFyZ3VtZW50YCk7XG4gIH1cbiAgaWYgKHRlc3RuZXRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVyblxuICB9XG4gIGlmICh0ZXN0bmV0cy5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4gdGVzdG5ldHNbMF07XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBtb3JlIHRoYW4gb25lIHRlc3RuZXQgZm9yICR7Z2V0TmV0d29ya05hbWUobmV0d29yayl9YCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBiaXRjb2luIG9yIHRlc3RuZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzQml0Y29pbihuZXR3b3JrOiBOZXR3b3JrKSB7XG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspID09PSBuZXR3b3Jrcy5iaXRjb2luO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgYml0Y29pbmNhc2ggb3IgYml0Y29pbmNhc2hUZXN0bmV0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0JpdGNvaW5DYXNoKG5ldHdvcms6IE5ldHdvcmspIHtcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmJpdGNvaW5jYXNoO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgYml0Y29pbmdvbGRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzQml0Y29pbkdvbGQobmV0d29yazogTmV0d29yaykge1xuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MuYml0Y29pbmdvbGQ7XG59XG5cbi8qKlxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBpcyBiaXRjb2luc3Ygb3IgYml0Y29pbnN2VGVzdG5ldFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNCaXRjb2luU1YobmV0d29yazogTmV0d29yaykge1xuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MuYml0Y29pbnN2O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgZGFzaCBvciBkYXNoVGVzdFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNEYXNoKG5ldHdvcms6IE5ldHdvcmspIHtcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmRhc2g7XG59XG5cbi8qKlxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBpcyBsaXRlY29pbiBvciBsaXRlY29pblRlc3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTGl0ZWNvaW4obmV0d29yazogTmV0d29yaykge1xuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MubGl0ZWNvaW47XG59XG5cbi8qKlxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBpcyB6Y2FzaCBvciB6Y2FzaFRlc3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzWmNhc2gobmV0d29yazogTmV0d29yaykge1xuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MuemNhc2g7XG59XG5cbi8qKlxuICogQHBhcmFtIHtOZXR3b3JrfSBuZXR3b3JrXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgbmV0d29yayBpcyBWZXJ1cyBvciBWZXJ1c1Rlc3RcbiAqL1xuZXhwb3J0ICBmdW5jdGlvbiBpc1ZlcnVzIChuZXR3b3JrOiBOZXR3b3JrKSB7XG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspID09PSBuZXR3b3Jrcy52ZXJ1c1xufVxuXG4vKipcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgUEJhYVMgY29tcGF0aWJsZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNQQmFhUyAobmV0d29yazogTmV0d29yaykge1xuICByZXR1cm4gbmV0d29yayAmJiAhIShuZXR3b3JrIGFzIFBCYWFTTmV0d29yaykuaXNQQmFhU1xufVxuXG4vKipcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgemNhc2ggY29tcGF0aWJsZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNaY2FzaENvbXBhdGlibGUgKG5ldHdvcms6IE5ldHdvcmspIHtcbiAgcmV0dXJuIGlzWmNhc2gobmV0d29yaykgfHwgaXNQQmFhUyhuZXR3b3JrKSB8fCBpc0tvbW9kbyhuZXR3b3JrKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgS29tb2RvXG4gKi9cbmV4cG9ydCAgZnVuY3Rpb24gaXNLb21vZG8gKG5ldHdvcms6IE5ldHdvcmspIHtcbiAgcmV0dXJuIGdldE1haW5uZXQobmV0d29yaykgPT09IG5ldHdvcmtzLmttZFxufVxuXG4vKipcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgRG9nZVxuICovXG5leHBvcnQgIGZ1bmN0aW9uIGlzRG9nZSAobmV0d29yazogTmV0d29yaykge1xuICByZXR1cm4gZ2V0TWFpbm5ldChuZXR3b3JrKSA9PT0gbmV0d29ya3MuZG9nZVxufVxuXG4vKipcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xuICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWZmIG5ldHdvcmsgaXMgRGlnaWJ5dGVcbiAqL1xuZXhwb3J0ICBmdW5jdGlvbiBpc0RpZ2lieXRlIChuZXR3b3JrOiBOZXR3b3JrKSB7XG4gIHJldHVybiBnZXRNYWlubmV0KG5ldHdvcmspID09PSBuZXR3b3Jrcy5kaWdpYnl0ZVxufVxuXG4vKipcbiAqIEBwYXJhbSB7TmV0d29ya30gbmV0d29ya1xuICogQHJldHVybnMge2Jvb2xlYW59IHJldHVybnMgdHJ1ZSBpZmYgbmV0d29yayBpcyBhbnkgb2YgdGhlIG5ldHdvcmsgc3RhdGVkIGluIHRoZSBhcmd1bWVudFxuICovXG5leHBvcnQgY29uc3QgaXNWYWxpZE5ldHdvcmsgPSB0eXBlZm9yY2Uub25lT2YoXG4gIGlzQml0Y29pbixcbiAgaXNCaXRjb2luQ2FzaCxcbiAgaXNCaXRjb2luR29sZCxcbiAgaXNCaXRjb2luU1YsXG4gIGlzRGFzaCxcbiAgaXNMaXRlY29pbixcbiAgaXNaY2FzaCxcbiAgaXNaY2FzaENvbXBhdGlibGUsXG4gIGlzVmVydXMsXG4gIGlzUEJhYVMsXG4gIGlzS29tb2RvLFxuICBpc0RvZ2UsXG4gIGlzRGlnaWJ5dGVcbilcblxuXG4vKiogQGRlcHJlY2F0ZWQgKi9cbmV4cG9ydCBjb25zdCBCQ0ggPSBjb2lucy5CQ0g7XG4vKiogQGRlcHJlY2F0ZWQgKi9cbmV4cG9ydCBjb25zdCBCU1YgPSBjb2lucy5CU1Y7XG4vKiogQGRlcHJlY2F0ZWQgKi9cbmV4cG9ydCBjb25zdCBCVEMgPSBjb2lucy5CVEM7XG4vKiogQGRlcHJlY2F0ZWQgKi9cbmV4cG9ydCBjb25zdCBCVEcgPSBjb2lucy5CVEc7XG4vKiogQGRlcHJlY2F0ZWQgKi9cbmV4cG9ydCBjb25zdCBEQVNIID0gY29pbnMuREFTSDtcbi8qKiBAZGVwcmVjYXRlZCAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFQgPSBjb2lucy5ERUZBVUxUO1xuLyoqIEBkZXByZWNhdGVkICovXG5leHBvcnQgY29uc3QgREdCID0gY29pbnMuREdCO1xuLyoqIEBkZXByZWNhdGVkICovXG5leHBvcnQgY29uc3QgRE9HRSA9IGNvaW5zLkRPR0U7XG4vKiogQGRlcHJlY2F0ZWQgKi9cbmV4cG9ydCBjb25zdCBLTUQgPSBjb2lucy5LTUQ7XG4vKiogQGRlcHJlY2F0ZWQgKi9cbmV4cG9ydCBjb25zdCBMVEMgPSBjb2lucy5MVEM7XG4vKiogQGRlcHJlY2F0ZWQgKi9cbmV4cG9ydCBjb25zdCBWUlNDID0gY29pbnMuVlJTQztcbi8qKiBAZGVwcmVjYXRlZCAqL1xuZXhwb3J0IGNvbnN0IFpFQyA9IGNvaW5zLlpFQztcbiJdfQ==