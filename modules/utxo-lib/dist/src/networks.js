"use strict";
/**
 * @prettier
 */
/*

The values for the various fork coins can be found in these files:

property       filename                  varname                           notes
------------------------------------------------------------------------------------------------------------------------
messagePrefix  src/validation.cpp        strMessageMagic                   Format `${CoinName} Signed Message`
bech32_hrp     src/chainparams.cpp       bech32_hrp                        Only for some networks
bip32.public   src/chainparams.cpp       base58Prefixes[EXT_PUBLIC_KEY]    Mainnets have same value, testnets have same value
bip32.private  src/chainparams.cpp       base58Prefixes[EXT_SECRET_KEY]    Mainnets have same value, testnets have same value
pubKeyHash     src/chainparams.cpp       base58Prefixes[PUBKEY_ADDRESS]
scriptHash     src/chainparams.cpp       base58Prefixes[SCRIPT_ADDRESS]
wif            src/chainparams.cpp       base58Prefixes[SECRET_KEY]        Testnets have same value
forkId         src/script/interpreter.h  FORKID_*

*/
const networkTypes_1 = require("./networkTypes");
function getDefaultBip32Mainnet() {
    return {
        // base58 'xpub'
        public: 0x0488b21e,
        // base58 'xprv'
        private: 0x0488ade4,
    };
}
function getDogeBip32Mainnet() {
    return {
        public: 0x02facafd,
        private: 0x02fac398
    };
}
function getDefaultBip32Testnet() {
    return {
        // base58 'tpub'
        public: 0x043587cf,
        // base58 'tprv'
        private: 0x04358394,
    };
}
const networks = {
    // https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp
    // https://github.com/bitcoin/bitcoin/blob/master/src/chainparams.cpp
    bitcoin: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bech32: 'bc',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x00,
        scriptHash: 0x05,
        wif: 0x80,
        coin: networkTypes_1.coins.BTC,
    },
    testnet: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bech32: 'tb',
        bip32: getDefaultBip32Testnet(),
        pubKeyHash: 0x6f,
        scriptHash: 0xc4,
        wif: 0xef,
        coin: networkTypes_1.coins.BTC,
    },
    // https://github.com/Bitcoin-ABC/bitcoin-abc/blob/master/src/validation.cpp
    // https://github.com/Bitcoin-ABC/bitcoin-abc/blob/master/src/chainparams.cpp
    // https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md
    bitcoincash: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x00,
        scriptHash: 0x05,
        wif: 0x80,
        coin: networkTypes_1.coins.BCH,
        forkId: 0x00,
        cashAddr: {
            prefix: 'bitcoincash',
            pubKeyHash: 0x00,
            scriptHash: 0x08,
        },
    },
    bitcoincashTestnet: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bip32: getDefaultBip32Testnet(),
        pubKeyHash: 0x6f,
        scriptHash: 0xc4,
        wif: 0xef,
        coin: networkTypes_1.coins.BCH,
        cashAddr: {
            prefix: 'bchtest',
            pubKeyHash: 0x00,
            scriptHash: 0x08,
        },
    },
    // https://github.com/BTCGPU/BTCGPU/blob/master/src/validation.cpp
    // https://github.com/BTCGPU/BTCGPU/blob/master/src/chainparams.cpp
    // https://github.com/BTCGPU/BTCGPU/blob/master/src/script/interpreter.h
    bitcoingold: {
        messagePrefix: '\x18Bitcoin Gold Signed Message:\n',
        bech32: 'btg',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x26,
        scriptHash: 0x17,
        wif: 0x80,
        forkId: 79,
        coin: networkTypes_1.coins.BTG,
    },
    bitcoingoldTestnet: {
        messagePrefix: '\x18Bitcoin Gold Signed Message:\n',
        bech32: 'tbtg',
        bip32: getDefaultBip32Testnet(),
        pubKeyHash: 111,
        scriptHash: 196,
        wif: 0xef,
        forkId: 79,
        coin: networkTypes_1.coins.BTG,
    },
    // https://github.com/bitcoin-sv/bitcoin-sv/blob/master/src/validation.cpp
    // https://github.com/bitcoin-sv/bitcoin-sv/blob/master/src/chainparams.cpp
    bitcoinsv: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x00,
        scriptHash: 0x05,
        wif: 0x80,
        coin: networkTypes_1.coins.BSV,
        forkId: 0x00,
    },
    bitcoinsvTestnet: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bip32: getDefaultBip32Testnet(),
        pubKeyHash: 0x6f,
        scriptHash: 0xc4,
        wif: 0xef,
        coin: networkTypes_1.coins.BSV,
    },
    // https://github.com/dashpay/dash/blob/master/src/validation.cpp
    // https://github.com/dashpay/dash/blob/master/src/chainparams.cpp
    dash: {
        messagePrefix: '\x19DarkCoin Signed Message:\n',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x4c,
        scriptHash: 0x10,
        wif: 0xcc,
        coin: networkTypes_1.coins.DASH,
    },
    dashTest: {
        messagePrefix: '\x19DarkCoin Signed Message:\n',
        bip32: getDefaultBip32Testnet(),
        pubKeyHash: 0x8c,
        scriptHash: 0x13,
        wif: 0xef,
        coin: networkTypes_1.coins.DASH,
    },
    default: {
        messagePrefix: '\x15Verus signed data:\n',
        bech32: 'bc',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x3c,
        scriptHash: 0x55,
        verusID: 0x66,
        wif: 0xBC,
        consensusBranchId: {
            1: 0x00,
            2: 0x00,
            3: 0x5ba81b19,
            4: 0x76b809bb
        },
        coin: networkTypes_1.coins.DEFAULT,
        isPBaaS: true,
        isZcashCompatible: true
    },
    digibyte: {
        messagePrefix: '\x19Digibyte Signed Message:\n',
        bip44: 20,
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x1e,
        scriptHash: 0x5,
        wif: 0x80,
        coin: networkTypes_1.coins.DGB,
        dustThreshold: 1000
    },
    doge: {
        messagePrefix: '\x19Dogecoin Signed Message:\n',
        bip44: 3,
        bip32: getDogeBip32Mainnet(),
        pubKeyHash: 0x1e,
        scriptHash: 0x16,
        wif: 0x9e,
        coin: networkTypes_1.coins.DOGE,
        dustThreshold: 0 // https://github.com/dogecoin/dogecoin/blob/v1.7.1/src/core.h#L155-L160
    },
    kmd: {
        messagePrefix: '\x18Komodo Signed Message:\n',
        bech32: 'bc',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x3c,
        scriptHash: 0x55,
        verusID: 0x66,
        wif: 0xBC,
        consensusBranchId: {
            1: 0x00,
            2: 0x00,
            3: 0x5ba81b19,
            4: 0x76b809bb
        },
        coin: networkTypes_1.coins.KMD,
        isPBaaS: false,
        isZcashCompatible: true
    },
    // https://github.com/litecoin-project/litecoin/blob/master/src/validation.cpp
    // https://github.com/litecoin-project/litecoin/blob/master/src/chainparams.cpp
    litecoin: {
        messagePrefix: '\x19Litecoin Signed Message:\n',
        bech32: 'ltc',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x30,
        scriptHash: 0x32,
        wif: 0xb0,
        coin: networkTypes_1.coins.LTC,
    },
    litecoinTest: {
        messagePrefix: '\x19Litecoin Signed Message:\n',
        bech32: 'tltc',
        bip32: getDefaultBip32Testnet(),
        pubKeyHash: 0x6f,
        scriptHash: 0x3a,
        wif: 0xef,
        coin: networkTypes_1.coins.LTC,
    },
    verus: {
        messagePrefix: '\x15Verus signed data:\n',
        bech32: 'bc',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x3c,
        scriptHash: 0x55,
        verusID: 0x66,
        wif: 0xBC,
        consensusBranchId: {
            1: 0x00,
            2: 0x00,
            3: 0x5ba81b19,
            4: 0x76b809bb
        },
        coin: networkTypes_1.coins.VRSC,
        isPBaaS: true,
        isZcashCompatible: true
    },
    verustest: {
        messagePrefix: '\x15Verus signed data:\n',
        bech32: 'bc',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x3c,
        scriptHash: 0x55,
        verusID: 0x66,
        wif: 0xBC,
        consensusBranchId: {
            1: 0x00,
            2: 0x00,
            3: 0x5ba81b19,
            4: 0x76b809bb
        },
        coin: networkTypes_1.coins.VRSC,
        isPBaaS: true,
        isZcashCompatible: true
    },
    // https://github.com/zcash/zcash/blob/master/src/validation.cpp
    // https://github.com/zcash/zcash/blob/master/src/chainparams.cpp
    zcash: {
        messagePrefix: '\x18ZCash Signed Message:\n',
        bip32: getDefaultBip32Mainnet(),
        pubKeyHash: 0x1cb8,
        scriptHash: 0x1cbd,
        wif: 0x80,
        // This parameter was introduced in version 3 to allow soft forks, for version 1 and 2 transactions we add a
        // dummy value.
        consensusBranchId: {
            1: 0x00,
            2: 0x00,
            3: 0x5ba81b19,
            // 4: 0x76b809bb (old Sapling branch id). Blossom branch id becomes effective after block 653600
            // 4: 0x2bb40e60
            // 4: 0xf5b9230b (Heartwood branch id, see https://zips.z.cash/zip-0250)
            4: 0xe9ff75a6, // (Canopy branch id, see https://zips.z.cash/zip-0251)
        },
        coin: networkTypes_1.coins.ZEC,
        isZcashCompatible: true
    },
    zcashTest: {
        messagePrefix: '\x18ZCash Signed Message:\n',
        bip32: getDefaultBip32Testnet(),
        pubKeyHash: 0x1d25,
        scriptHash: 0x1cba,
        wif: 0xef,
        consensusBranchId: {
            1: 0x00,
            2: 0x00,
            3: 0x5ba81b19,
            // 4: 0x76b809bb (old Sapling branch id)
            // 4: 0x2bb40e60
            // 4: 0xf5b9230b (Heartwood branch id, see https://zips.z.cash/zip-0250)
            4: 0xe9ff75a6, // (Canopy branch id, see https://zips.z.cash/zip-0251)
        },
        coin: networkTypes_1.coins.ZEC,
        isZcashCompatible: true
    },
};
module.exports = networks;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29ya3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbmV0d29ya3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHO0FBRUg7Ozs7Ozs7Ozs7Ozs7OztFQWVFO0FBRUYsaURBQThIO0FBRTlILFNBQVMsc0JBQXNCO0lBQzdCLE9BQU87UUFDTCxnQkFBZ0I7UUFDaEIsTUFBTSxFQUFFLFVBQVU7UUFDbEIsZ0JBQWdCO1FBQ2hCLE9BQU8sRUFBRSxVQUFVO0tBQ3BCLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyxtQkFBbUI7SUFDMUIsT0FBTztRQUNMLE1BQU0sRUFBRSxVQUFVO1FBQ2xCLE9BQU8sRUFBRSxVQUFVO0tBQ3BCLENBQUE7QUFDSCxDQUFDO0FBRUQsU0FBUyxzQkFBc0I7SUFDN0IsT0FBTztRQUNMLGdCQUFnQjtRQUNoQixNQUFNLEVBQUUsVUFBVTtRQUNsQixnQkFBZ0I7UUFDaEIsT0FBTyxFQUFFLFVBQVU7S0FDcEIsQ0FBQztBQUNKLENBQUM7QUFFRCxNQUFNLFFBQVEsR0FJdUQ7SUFDbkUsb0VBQW9FO0lBQ3BFLHFFQUFxRTtJQUNyRSxPQUFPLEVBQUU7UUFDUCxhQUFhLEVBQUUsK0JBQStCO1FBQzlDLE1BQU0sRUFBRSxJQUFJO1FBQ1osS0FBSyxFQUFFLHNCQUFzQixFQUFFO1FBQy9CLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLEdBQUcsRUFBRSxJQUFJO1FBQ1QsSUFBSSxFQUFFLG9CQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELE9BQU8sRUFBRTtRQUNQLGFBQWEsRUFBRSwrQkFBK0I7UUFDOUMsTUFBTSxFQUFFLElBQUk7UUFDWixLQUFLLEVBQUUsc0JBQXNCLEVBQUU7UUFDL0IsVUFBVSxFQUFFLElBQUk7UUFDaEIsVUFBVSxFQUFFLElBQUk7UUFDaEIsR0FBRyxFQUFFLElBQUk7UUFDVCxJQUFJLEVBQUUsb0JBQUssQ0FBQyxHQUFHO0tBQ2hCO0lB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LENBQUMsRUFBRSxJQUFJO1lBQ1AsQ0FBQyxFQUFFLElBQUk7WUFDUCxDQUFDLEVBQUUsVUFBVTtZQUNiLHdDQUF3QztZQUN4QyxnQkFBZ0I7WUFDaEIsd0VBQXdFO1lBQ3hFLENBQUMsRUFBRSxVQUFVLEVBQUUsdURBQXVEO1NBQ3ZFO1FBQ0QsSUFBSSxFQUFFLG9CQUFLLENBQUMsR0FBRztRQUNmLGlCQUFpQixFQUFFLElBQUk7S0FDeEI7Q0FDRixDQUFDO0FBRUYsaUJBQVMsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcHJldHRpZXJcbiAqL1xuXG4vKlxuXG5UaGUgdmFsdWVzIGZvciB0aGUgdmFyaW91cyBmb3JrIGNvaW5zIGNhbiBiZSBmb3VuZCBpbiB0aGVzZSBmaWxlczpcblxucHJvcGVydHkgICAgICAgZmlsZW5hbWUgICAgICAgICAgICAgICAgICB2YXJuYW1lICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90ZXNcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxubWVzc2FnZVByZWZpeCAgc3JjL3ZhbGlkYXRpb24uY3BwICAgICAgICBzdHJNZXNzYWdlTWFnaWMgICAgICAgICAgICAgICAgICAgRm9ybWF0IGAke0NvaW5OYW1lfSBTaWduZWQgTWVzc2FnZWBcbmJlY2gzMl9ocnAgICAgIHNyYy9jaGFpbnBhcmFtcy5jcHAgICAgICAgYmVjaDMyX2hycCAgICAgICAgICAgICAgICAgICAgICAgIE9ubHkgZm9yIHNvbWUgbmV0d29ya3NcbmJpcDMyLnB1YmxpYyAgIHNyYy9jaGFpbnBhcmFtcy5jcHAgICAgICAgYmFzZTU4UHJlZml4ZXNbRVhUX1BVQkxJQ19LRVldICAgIE1haW5uZXRzIGhhdmUgc2FtZSB2YWx1ZSwgdGVzdG5ldHMgaGF2ZSBzYW1lIHZhbHVlXG5iaXAzMi5wcml2YXRlICBzcmMvY2hhaW5wYXJhbXMuY3BwICAgICAgIGJhc2U1OFByZWZpeGVzW0VYVF9TRUNSRVRfS0VZXSAgICBNYWlubmV0cyBoYXZlIHNhbWUgdmFsdWUsIHRlc3RuZXRzIGhhdmUgc2FtZSB2YWx1ZVxucHViS2V5SGFzaCAgICAgc3JjL2NoYWlucGFyYW1zLmNwcCAgICAgICBiYXNlNThQcmVmaXhlc1tQVUJLRVlfQUREUkVTU11cbnNjcmlwdEhhc2ggICAgIHNyYy9jaGFpbnBhcmFtcy5jcHAgICAgICAgYmFzZTU4UHJlZml4ZXNbU0NSSVBUX0FERFJFU1NdXG53aWYgICAgICAgICAgICBzcmMvY2hhaW5wYXJhbXMuY3BwICAgICAgIGJhc2U1OFByZWZpeGVzW1NFQ1JFVF9LRVldICAgICAgICBUZXN0bmV0cyBoYXZlIHNhbWUgdmFsdWVcbmZvcmtJZCAgICAgICAgIHNyYy9zY3JpcHQvaW50ZXJwcmV0ZXIuaCAgRk9SS0lEXypcblxuKi9cblxuaW1wb3J0IHsgY29pbnMsIEJpdGNvaW5DYXNoTmV0d29yaywgTmV0d29yaywgTmV0d29ya05hbWUsIFpjYXNoTmV0d29yaywgUEJhYVNOZXR3b3JrLCBEaWdpRG9nZU5ldHdvcmsgfSBmcm9tICcuL25ldHdvcmtUeXBlcyc7XG5cbmZ1bmN0aW9uIGdldERlZmF1bHRCaXAzMk1haW5uZXQoKTogTmV0d29ya1snYmlwMzInXSB7XG4gIHJldHVybiB7XG4gICAgLy8gYmFzZTU4ICd4cHViJ1xuICAgIHB1YmxpYzogMHgwNDg4YjIxZSxcbiAgICAvLyBiYXNlNTggJ3hwcnYnXG4gICAgcHJpdmF0ZTogMHgwNDg4YWRlNCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0RG9nZUJpcDMyTWFpbm5ldCgpOiBOZXR3b3JrWydiaXAzMiddIHtcbiAgcmV0dXJuIHtcbiAgICBwdWJsaWM6IDB4MDJmYWNhZmQsXG4gICAgcHJpdmF0ZTogMHgwMmZhYzM5OFxuICB9XG59XG5cbmZ1bmN0aW9uIGdldERlZmF1bHRCaXAzMlRlc3RuZXQoKTogTmV0d29ya1snYmlwMzInXSB7XG4gIHJldHVybiB7XG4gICAgLy8gYmFzZTU4ICd0cHViJ1xuICAgIHB1YmxpYzogMHgwNDM1ODdjZixcbiAgICAvLyBiYXNlNTggJ3RwcnYnXG4gICAgcHJpdmF0ZTogMHgwNDM1ODM5NCxcbiAgfTtcbn1cblxuY29uc3QgbmV0d29ya3M6IFJlY29yZDxOZXR3b3JrTmFtZSwgTmV0d29yaz4gJlxuICBSZWNvcmQ8J3pjYXNoJyB8ICd6Y2FzaFRlc3QnLCBaY2FzaE5ldHdvcms+ICZcbiAgUmVjb3JkPCd2ZXJ1cycgfCAndmVydXN0ZXN0JyB8ICdkZWZhdWx0JyB8ICdrbWQnLCBQQmFhU05ldHdvcms+ICZcbiAgUmVjb3JkPCdkaWdpYnl0ZScgfCAnZG9nZScsIERpZ2lEb2dlTmV0d29yaz4gJlxuICBSZWNvcmQ8J2JpdGNvaW5jYXNoJyB8ICdiaXRjb2luY2FzaFRlc3RuZXQnLCBCaXRjb2luQ2FzaE5ldHdvcms+ID0ge1xuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi9iaXRjb2luL2Jsb2IvbWFzdGVyL3NyYy92YWxpZGF0aW9uLmNwcFxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi9iaXRjb2luL2Jsb2IvbWFzdGVyL3NyYy9jaGFpbnBhcmFtcy5jcHBcbiAgYml0Y29pbjoge1xuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcbiAgICBiZWNoMzI6ICdiYycsXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcbiAgICBwdWJLZXlIYXNoOiAweDAwLFxuICAgIHNjcmlwdEhhc2g6IDB4MDUsXG4gICAgd2lmOiAweDgwLFxuICAgIGNvaW46IGNvaW5zLkJUQyxcbiAgfSxcbiAgdGVzdG5ldDoge1xuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcbiAgICBiZWNoMzI6ICd0YicsXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMlRlc3RuZXQoKSxcbiAgICBwdWJLZXlIYXNoOiAweDZmLFxuICAgIHNjcmlwdEhhc2g6IDB4YzQsXG4gICAgd2lmOiAweGVmLFxuICAgIGNvaW46IGNvaW5zLkJUQyxcbiAgfSxcblxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vQml0Y29pbi1BQkMvYml0Y29pbi1hYmMvYmxvYi9tYXN0ZXIvc3JjL3ZhbGlkYXRpb24uY3BwXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9CaXRjb2luLUFCQy9iaXRjb2luLWFiYy9ibG9iL21hc3Rlci9zcmMvY2hhaW5wYXJhbXMuY3BwXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luY2FzaG9yZy9iaXRjb2luY2FzaC5vcmcvYmxvYi9tYXN0ZXIvc3BlYy9jYXNoYWRkci5tZFxuICBiaXRjb2luY2FzaDoge1xuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyTWFpbm5ldCgpLFxuICAgIHB1YktleUhhc2g6IDB4MDAsXG4gICAgc2NyaXB0SGFzaDogMHgwNSxcbiAgICB3aWY6IDB4ODAsXG4gICAgY29pbjogY29pbnMuQkNILFxuICAgIGZvcmtJZDogMHgwMCxcbiAgICBjYXNoQWRkcjoge1xuICAgICAgcHJlZml4OiAnYml0Y29pbmNhc2gnLFxuICAgICAgcHViS2V5SGFzaDogMHgwMCxcbiAgICAgIHNjcmlwdEhhc2g6IDB4MDgsXG4gICAgfSxcbiAgfSxcbiAgYml0Y29pbmNhc2hUZXN0bmV0OiB7XG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0Y29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJUZXN0bmV0KCksXG4gICAgcHViS2V5SGFzaDogMHg2ZixcbiAgICBzY3JpcHRIYXNoOiAweGM0LFxuICAgIHdpZjogMHhlZixcbiAgICBjb2luOiBjb2lucy5CQ0gsXG4gICAgY2FzaEFkZHI6IHtcbiAgICAgIHByZWZpeDogJ2JjaHRlc3QnLFxuICAgICAgcHViS2V5SGFzaDogMHgwMCxcbiAgICAgIHNjcmlwdEhhc2g6IDB4MDgsXG4gICAgfSxcbiAgfSxcblxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vQlRDR1BVL0JUQ0dQVS9ibG9iL21hc3Rlci9zcmMvdmFsaWRhdGlvbi5jcHBcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0JUQ0dQVS9CVENHUFUvYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vQlRDR1BVL0JUQ0dQVS9ibG9iL21hc3Rlci9zcmMvc2NyaXB0L2ludGVycHJldGVyLmhcbiAgYml0Y29pbmdvbGQ6IHtcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThCaXRjb2luIEdvbGQgU2lnbmVkIE1lc3NhZ2U6XFxuJyxcbiAgICBiZWNoMzI6ICdidGcnLFxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXG4gICAgcHViS2V5SGFzaDogMHgyNixcbiAgICBzY3JpcHRIYXNoOiAweDE3LFxuICAgIHdpZjogMHg4MCxcbiAgICBmb3JrSWQ6IDc5LFxuICAgIGNvaW46IGNvaW5zLkJURyxcbiAgfSxcbiAgYml0Y29pbmdvbGRUZXN0bmV0OiB7XG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0Y29pbiBHb2xkIFNpZ25lZCBNZXNzYWdlOlxcbicsXG4gICAgYmVjaDMyOiAndGJ0ZycsXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMlRlc3RuZXQoKSxcbiAgICBwdWJLZXlIYXNoOiAxMTEsXG4gICAgc2NyaXB0SGFzaDogMTk2LFxuICAgIHdpZjogMHhlZixcbiAgICBmb3JrSWQ6IDc5LFxuICAgIGNvaW46IGNvaW5zLkJURyxcbiAgfSxcblxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi1zdi9iaXRjb2luLXN2L2Jsb2IvbWFzdGVyL3NyYy92YWxpZGF0aW9uLmNwcFxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbi1zdi9iaXRjb2luLXN2L2Jsb2IvbWFzdGVyL3NyYy9jaGFpbnBhcmFtcy5jcHBcbiAgYml0Y29pbnN2OiB7XG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0Y29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXG4gICAgcHViS2V5SGFzaDogMHgwMCxcbiAgICBzY3JpcHRIYXNoOiAweDA1LFxuICAgIHdpZjogMHg4MCxcbiAgICBjb2luOiBjb2lucy5CU1YsXG4gICAgZm9ya0lkOiAweDAwLFxuICB9LFxuICBiaXRjb2luc3ZUZXN0bmV0OiB7XG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0Y29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJUZXN0bmV0KCksXG4gICAgcHViS2V5SGFzaDogMHg2ZixcbiAgICBzY3JpcHRIYXNoOiAweGM0LFxuICAgIHdpZjogMHhlZixcbiAgICBjb2luOiBjb2lucy5CU1YsXG4gIH0sXG5cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2Rhc2hwYXkvZGFzaC9ibG9iL21hc3Rlci9zcmMvdmFsaWRhdGlvbi5jcHBcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2Rhc2hwYXkvZGFzaC9ibG9iL21hc3Rlci9zcmMvY2hhaW5wYXJhbXMuY3BwXG4gIGRhc2g6IHtcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MTlEYXJrQ29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXG4gICAgcHViS2V5SGFzaDogMHg0YyxcbiAgICBzY3JpcHRIYXNoOiAweDEwLFxuICAgIHdpZjogMHhjYyxcbiAgICBjb2luOiBjb2lucy5EQVNILFxuICB9LFxuICBkYXNoVGVzdDoge1xuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOURhcmtDb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMlRlc3RuZXQoKSxcbiAgICBwdWJLZXlIYXNoOiAweDhjLFxuICAgIHNjcmlwdEhhc2g6IDB4MTMsXG4gICAgd2lmOiAweGVmLFxuICAgIGNvaW46IGNvaW5zLkRBU0gsXG4gIH0sXG5cbiAgZGVmYXVsdDoge1xuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxNVZlcnVzIHNpZ25lZCBkYXRhOlxcbicsXG4gICAgYmVjaDMyOiAnYmMnLFxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXG4gICAgcHViS2V5SGFzaDogMHgzYyxcbiAgICBzY3JpcHRIYXNoOiAweDU1LFxuICAgIHZlcnVzSUQ6IDB4NjYsXG4gICAgd2lmOiAweEJDLFxuICAgIGNvbnNlbnN1c0JyYW5jaElkOiB7XG4gICAgICAxOiAweDAwLFxuICAgICAgMjogMHgwMCxcbiAgICAgIDM6IDB4NWJhODFiMTksXG4gICAgICA0OiAweDc2YjgwOWJiXG4gICAgfSxcbiAgICBjb2luOiBjb2lucy5ERUZBVUxULFxuICAgIGlzUEJhYVM6IHRydWUsXG4gICAgaXNaY2FzaENvbXBhdGlibGU6IHRydWVcbiAgfSxcblxuICBkaWdpYnl0ZToge1xuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOURpZ2lieXRlIFNpZ25lZCBNZXNzYWdlOlxcbicsXG4gICAgYmlwNDQ6IDIwLFxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXG4gICAgcHViS2V5SGFzaDogMHgxZSxcbiAgICBzY3JpcHRIYXNoOiAweDUsXG4gICAgd2lmOiAweDgwLFxuICAgIGNvaW46IGNvaW5zLkRHQixcbiAgICBkdXN0VGhyZXNob2xkOiAxMDAwXG4gIH0sXG5cbiAgZG9nZToge1xuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOURvZ2Vjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXG4gICAgYmlwNDQ6IDMsXG4gICAgYmlwMzI6IGdldERvZ2VCaXAzMk1haW5uZXQoKSxcbiAgICBwdWJLZXlIYXNoOiAweDFlLFxuICAgIHNjcmlwdEhhc2g6IDB4MTYsXG4gICAgd2lmOiAweDllLFxuICAgIGNvaW46IGNvaW5zLkRPR0UsXG4gICAgZHVzdFRocmVzaG9sZDogMCAvLyBodHRwczovL2dpdGh1Yi5jb20vZG9nZWNvaW4vZG9nZWNvaW4vYmxvYi92MS43LjEvc3JjL2NvcmUuaCNMMTU1LUwxNjBcbiAgfSxcblxuICBrbWQ6IHtcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThLb21vZG8gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcbiAgICBiZWNoMzI6ICdiYycsXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcbiAgICBwdWJLZXlIYXNoOiAweDNjLFxuICAgIHNjcmlwdEhhc2g6IDB4NTUsXG4gICAgdmVydXNJRDogMHg2NixcbiAgICB3aWY6IDB4QkMsXG4gICAgY29uc2Vuc3VzQnJhbmNoSWQ6IHtcbiAgICAgIDE6IDB4MDAsXG4gICAgICAyOiAweDAwLFxuICAgICAgMzogMHg1YmE4MWIxOSxcbiAgICAgIDQ6IDB4NzZiODA5YmJcbiAgICB9LFxuICAgIGNvaW46IGNvaW5zLktNRCxcbiAgICBpc1BCYWFTOiBmYWxzZSxcbiAgICBpc1pjYXNoQ29tcGF0aWJsZTogdHJ1ZVxuICB9LFxuXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9saXRlY29pbi1wcm9qZWN0L2xpdGVjb2luL2Jsb2IvbWFzdGVyL3NyYy92YWxpZGF0aW9uLmNwcFxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vbGl0ZWNvaW4tcHJvamVjdC9saXRlY29pbi9ibG9iL21hc3Rlci9zcmMvY2hhaW5wYXJhbXMuY3BwXG4gIGxpdGVjb2luOiB7XG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE5TGl0ZWNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcbiAgICBiZWNoMzI6ICdsdGMnLFxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXG4gICAgcHViS2V5SGFzaDogMHgzMCxcbiAgICBzY3JpcHRIYXNoOiAweDMyLFxuICAgIHdpZjogMHhiMCxcbiAgICBjb2luOiBjb2lucy5MVEMsXG4gIH0sXG4gIGxpdGVjb2luVGVzdDoge1xuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOUxpdGVjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXG4gICAgYmVjaDMyOiAndGx0YycsXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMlRlc3RuZXQoKSxcbiAgICBwdWJLZXlIYXNoOiAweDZmLFxuICAgIHNjcmlwdEhhc2g6IDB4M2EsXG4gICAgd2lmOiAweGVmLFxuICAgIGNvaW46IGNvaW5zLkxUQyxcbiAgfSxcblxuICB2ZXJ1czoge1xuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxNVZlcnVzIHNpZ25lZCBkYXRhOlxcbicsXG4gICAgYmVjaDMyOiAnYmMnLFxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXG4gICAgcHViS2V5SGFzaDogMHgzYyxcbiAgICBzY3JpcHRIYXNoOiAweDU1LFxuICAgIHZlcnVzSUQ6IDB4NjYsXG4gICAgd2lmOiAweEJDLFxuICAgIGNvbnNlbnN1c0JyYW5jaElkOiB7XG4gICAgICAxOiAweDAwLFxuICAgICAgMjogMHgwMCxcbiAgICAgIDM6IDB4NWJhODFiMTksXG4gICAgICA0OiAweDc2YjgwOWJiXG4gICAgfSxcbiAgICBjb2luOiBjb2lucy5WUlNDLFxuICAgIGlzUEJhYVM6IHRydWUsXG4gICAgaXNaY2FzaENvbXBhdGlibGU6IHRydWVcbiAgfSxcblxuICB2ZXJ1c3Rlc3Q6IHtcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MTVWZXJ1cyBzaWduZWQgZGF0YTpcXG4nLFxuICAgIGJlY2gzMjogJ2JjJyxcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyTWFpbm5ldCgpLFxuICAgIHB1YktleUhhc2g6IDB4M2MsXG4gICAgc2NyaXB0SGFzaDogMHg1NSxcbiAgICB2ZXJ1c0lEOiAweDY2LFxuICAgIHdpZjogMHhCQyxcbiAgICBjb25zZW5zdXNCcmFuY2hJZDoge1xuICAgICAgMTogMHgwMCxcbiAgICAgIDI6IDB4MDAsXG4gICAgICAzOiAweDViYTgxYjE5LFxuICAgICAgNDogMHg3NmI4MDliYlxuICAgIH0sXG4gICAgY29pbjogY29pbnMuVlJTQyxcbiAgICBpc1BCYWFTOiB0cnVlLFxuICAgIGlzWmNhc2hDb21wYXRpYmxlOiB0cnVlXG4gIH0sXG5cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3pjYXNoL3pjYXNoL2Jsb2IvbWFzdGVyL3NyYy92YWxpZGF0aW9uLmNwcFxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vemNhc2gvemNhc2gvYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxuICB6Y2FzaDoge1xuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOFpDYXNoIFNpZ25lZCBNZXNzYWdlOlxcbicsXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcbiAgICBwdWJLZXlIYXNoOiAweDFjYjgsXG4gICAgc2NyaXB0SGFzaDogMHgxY2JkLFxuICAgIHdpZjogMHg4MCxcbiAgICAvLyBUaGlzIHBhcmFtZXRlciB3YXMgaW50cm9kdWNlZCBpbiB2ZXJzaW9uIDMgdG8gYWxsb3cgc29mdCBmb3JrcywgZm9yIHZlcnNpb24gMSBhbmQgMiB0cmFuc2FjdGlvbnMgd2UgYWRkIGFcbiAgICAvLyBkdW1teSB2YWx1ZS5cbiAgICBjb25zZW5zdXNCcmFuY2hJZDoge1xuICAgICAgMTogMHgwMCxcbiAgICAgIDI6IDB4MDAsXG4gICAgICAzOiAweDViYTgxYjE5LFxuICAgICAgLy8gNDogMHg3NmI4MDliYiAob2xkIFNhcGxpbmcgYnJhbmNoIGlkKS4gQmxvc3NvbSBicmFuY2ggaWQgYmVjb21lcyBlZmZlY3RpdmUgYWZ0ZXIgYmxvY2sgNjUzNjAwXG4gICAgICAvLyA0OiAweDJiYjQwZTYwXG4gICAgICAvLyA0OiAweGY1YjkyMzBiIChIZWFydHdvb2QgYnJhbmNoIGlkLCBzZWUgaHR0cHM6Ly96aXBzLnouY2FzaC96aXAtMDI1MClcbiAgICAgIDQ6IDB4ZTlmZjc1YTYsIC8vIChDYW5vcHkgYnJhbmNoIGlkLCBzZWUgaHR0cHM6Ly96aXBzLnouY2FzaC96aXAtMDI1MSlcbiAgICB9LFxuICAgIGNvaW46IGNvaW5zLlpFQyxcbiAgICBpc1pjYXNoQ29tcGF0aWJsZTogdHJ1ZVxuICB9LFxuICB6Y2FzaFRlc3Q6IHtcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThaQ2FzaCBTaWduZWQgTWVzc2FnZTpcXG4nLFxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJUZXN0bmV0KCksXG4gICAgcHViS2V5SGFzaDogMHgxZDI1LFxuICAgIHNjcmlwdEhhc2g6IDB4MWNiYSxcbiAgICB3aWY6IDB4ZWYsXG4gICAgY29uc2Vuc3VzQnJhbmNoSWQ6IHtcbiAgICAgIDE6IDB4MDAsXG4gICAgICAyOiAweDAwLFxuICAgICAgMzogMHg1YmE4MWIxOSxcbiAgICAgIC8vIDQ6IDB4NzZiODA5YmIgKG9sZCBTYXBsaW5nIGJyYW5jaCBpZClcbiAgICAgIC8vIDQ6IDB4MmJiNDBlNjBcbiAgICAgIC8vIDQ6IDB4ZjViOTIzMGIgKEhlYXJ0d29vZCBicmFuY2ggaWQsIHNlZSBodHRwczovL3ppcHMuei5jYXNoL3ppcC0wMjUwKVxuICAgICAgNDogMHhlOWZmNzVhNiwgLy8gKENhbm9weSBicmFuY2ggaWQsIHNlZSBodHRwczovL3ppcHMuei5jYXNoL3ppcC0wMjUxKVxuICAgIH0sXG4gICAgY29pbjogY29pbnMuWkVDLFxuICAgIGlzWmNhc2hDb21wYXRpYmxlOiB0cnVlXG4gIH0sXG59O1xuXG5leHBvcnQgPSBuZXR3b3JrcztcbiJdfQ==