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
            // 4: 0xe9ff75a6, // (Canopy branch id, see https://zips.z.cash/zip-0251)
            4: 0x37519621 // NU5 Branch ID (backwards compatible with NU4)
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
            // 4: 0xe9ff75a6, // (Canopy branch id, see https://zips.z.cash/zip-0251)
            4: 0x37519621 // NU5 Branch ID (backwards compatible with NU4)
        },
        coin: networkTypes_1.coins.ZEC,
        isZcashCompatible: true
    },
};
module.exports = networks;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29ya3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbmV0d29ya3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHO0FBRUg7Ozs7Ozs7Ozs7Ozs7OztFQWVFO0FBRUYsaURBQThIO0FBRTlILFNBQVMsc0JBQXNCO0lBQzdCLE9BQU87UUFDTCxnQkFBZ0I7UUFDaEIsTUFBTSxFQUFFLFVBQVU7UUFDbEIsZ0JBQWdCO1FBQ2hCLE9BQU8sRUFBRSxVQUFVO0tBQ3BCLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyxtQkFBbUI7SUFDMUIsT0FBTztRQUNMLE1BQU0sRUFBRSxVQUFVO1FBQ2xCLE9BQU8sRUFBRSxVQUFVO0tBQ3BCLENBQUE7QUFDSCxDQUFDO0FBRUQsU0FBUyxzQkFBc0I7SUFDN0IsT0FBTztRQUNMLGdCQUFnQjtRQUNoQixNQUFNLEVBQUUsVUFBVTtRQUNsQixnQkFBZ0I7UUFDaEIsT0FBTyxFQUFFLFVBQVU7S0FDcEIsQ0FBQztBQUNKLENBQUM7QUFFRCxNQUFNLFFBQVEsR0FJdUQ7SUFDbkUsb0VBQW9FO0lBQ3BFLHFFQUFxRTtJQUNyRSxPQUFPLEVBQUU7UUFDUCxhQUFhLEVBQUUsK0JBQStCO1FBQzlDLE1BQU0sRUFBRSxJQUFJO1FBQ1osS0FBSyxFQUFFLHNCQUFzQixFQUFFO1FBQy9CLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLEdBQUcsRUFBRSxJQUFJO1FBQ1QsSUFBSSxFQUFFLG9CQUFLLENBQUMsR0FBRztLQUNoQjtJQUNELE9BQU8sRUFBRTtRQUNQLGFBQWEsRUFBRSwrQkFBK0I7UUFDOUMsTUFBTSxFQUFFLElBQUk7UUFDWixLQUFLLEVBQUUsc0JBQXNCLEVBQUU7UUFDL0IsVUFBVSxFQUFFLElBQUk7UUFDaEIsVUFBVSxFQUFFLElBQUk7UUFDaEIsR0FBRyxFQUFFLElBQUk7UUFDVCxJQUFJLEVBQUUsb0JBQUssQ0FBQyxHQUFHO0tBQ2hCO0lB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aUIsRUFBRTtZQUNqQixDQUFDLEVBQUUsSUFBSTtZQUNQLENBQUMsRUFBRSxJQUFJO1lBQ1AsQ0FBQyxFQUFFLFVBQVU7WUFDYix3Q0FBd0M7WUFDeEMsZ0JBQWdCO1lBQ2hCLHdFQUF3RTtZQUN4RSx5RUFBeUU7WUFDekUsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxnREFBZ0Q7U0FDL0Q7UUFDRCxJQUFJLEVBQUUsb0JBQUssQ0FBQyxHQUFHO1FBQ2YsaUJBQWlCLEVBQUUsSUFBSTtLQUN4QjtDQUNGLENBQUM7QUFFRixpQkFBUyxRQUFRLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwcmV0dGllclxuICovXG5cbi8qXG5cblRoZSB2YWx1ZXMgZm9yIHRoZSB2YXJpb3VzIGZvcmsgY29pbnMgY2FuIGJlIGZvdW5kIGluIHRoZXNlIGZpbGVzOlxuXG5wcm9wZXJ0eSAgICAgICBmaWxlbmFtZSAgICAgICAgICAgICAgICAgIHZhcm5hbWUgICAgICAgICAgICAgICAgICAgICAgICAgICBub3Rlc1xuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5tZXNzYWdlUHJlZml4ICBzcmMvdmFsaWRhdGlvbi5jcHAgICAgICAgIHN0ck1lc3NhZ2VNYWdpYyAgICAgICAgICAgICAgICAgICBGb3JtYXQgYCR7Q29pbk5hbWV9IFNpZ25lZCBNZXNzYWdlYFxuYmVjaDMyX2hycCAgICAgc3JjL2NoYWlucGFyYW1zLmNwcCAgICAgICBiZWNoMzJfaHJwICAgICAgICAgICAgICAgICAgICAgICAgT25seSBmb3Igc29tZSBuZXR3b3Jrc1xuYmlwMzIucHVibGljICAgc3JjL2NoYWlucGFyYW1zLmNwcCAgICAgICBiYXNlNThQcmVmaXhlc1tFWFRfUFVCTElDX0tFWV0gICAgTWFpbm5ldHMgaGF2ZSBzYW1lIHZhbHVlLCB0ZXN0bmV0cyBoYXZlIHNhbWUgdmFsdWVcbmJpcDMyLnByaXZhdGUgIHNyYy9jaGFpbnBhcmFtcy5jcHAgICAgICAgYmFzZTU4UHJlZml4ZXNbRVhUX1NFQ1JFVF9LRVldICAgIE1haW5uZXRzIGhhdmUgc2FtZSB2YWx1ZSwgdGVzdG5ldHMgaGF2ZSBzYW1lIHZhbHVlXG5wdWJLZXlIYXNoICAgICBzcmMvY2hhaW5wYXJhbXMuY3BwICAgICAgIGJhc2U1OFByZWZpeGVzW1BVQktFWV9BRERSRVNTXVxuc2NyaXB0SGFzaCAgICAgc3JjL2NoYWlucGFyYW1zLmNwcCAgICAgICBiYXNlNThQcmVmaXhlc1tTQ1JJUFRfQUREUkVTU11cbndpZiAgICAgICAgICAgIHNyYy9jaGFpbnBhcmFtcy5jcHAgICAgICAgYmFzZTU4UHJlZml4ZXNbU0VDUkVUX0tFWV0gICAgICAgIFRlc3RuZXRzIGhhdmUgc2FtZSB2YWx1ZVxuZm9ya0lkICAgICAgICAgc3JjL3NjcmlwdC9pbnRlcnByZXRlci5oICBGT1JLSURfKlxuXG4qL1xuXG5pbXBvcnQgeyBjb2lucywgQml0Y29pbkNhc2hOZXR3b3JrLCBOZXR3b3JrLCBOZXR3b3JrTmFtZSwgWmNhc2hOZXR3b3JrLCBQQmFhU05ldHdvcmssIERpZ2lEb2dlTmV0d29yayB9IGZyb20gJy4vbmV0d29ya1R5cGVzJztcblxuZnVuY3Rpb24gZ2V0RGVmYXVsdEJpcDMyTWFpbm5ldCgpOiBOZXR3b3JrWydiaXAzMiddIHtcbiAgcmV0dXJuIHtcbiAgICAvLyBiYXNlNTggJ3hwdWInXG4gICAgcHVibGljOiAweDA0ODhiMjFlLFxuICAgIC8vIGJhc2U1OCAneHBydidcbiAgICBwcml2YXRlOiAweDA0ODhhZGU0LFxuICB9O1xufVxuXG5mdW5jdGlvbiBnZXREb2dlQmlwMzJNYWlubmV0KCk6IE5ldHdvcmtbJ2JpcDMyJ10ge1xuICByZXR1cm4ge1xuICAgIHB1YmxpYzogMHgwMmZhY2FmZCxcbiAgICBwcml2YXRlOiAweDAyZmFjMzk4XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpOiBOZXR3b3JrWydiaXAzMiddIHtcbiAgcmV0dXJuIHtcbiAgICAvLyBiYXNlNTggJ3RwdWInXG4gICAgcHVibGljOiAweDA0MzU4N2NmLFxuICAgIC8vIGJhc2U1OCAndHBydidcbiAgICBwcml2YXRlOiAweDA0MzU4Mzk0LFxuICB9O1xufVxuXG5jb25zdCBuZXR3b3JrczogUmVjb3JkPE5ldHdvcmtOYW1lLCBOZXR3b3JrPiAmXG4gIFJlY29yZDwnemNhc2gnIHwgJ3pjYXNoVGVzdCcsIFpjYXNoTmV0d29yaz4gJlxuICBSZWNvcmQ8J3ZlcnVzJyB8ICd2ZXJ1c3Rlc3QnIHwgJ2RlZmF1bHQnIHwgJ2ttZCcsIFBCYWFTTmV0d29yaz4gJlxuICBSZWNvcmQ8J2RpZ2lieXRlJyB8ICdkb2dlJywgRGlnaURvZ2VOZXR3b3JrPiAmXG4gIFJlY29yZDwnYml0Y29pbmNhc2gnIHwgJ2JpdGNvaW5jYXNoVGVzdG5ldCcsIEJpdGNvaW5DYXNoTmV0d29yaz4gPSB7XG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luL2JpdGNvaW4vYmxvYi9tYXN0ZXIvc3JjL3ZhbGlkYXRpb24uY3BwXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luL2JpdGNvaW4vYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxuICBiaXRjb2luOiB7XG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0Y29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxuICAgIGJlY2gzMjogJ2JjJyxcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyTWFpbm5ldCgpLFxuICAgIHB1YktleUhhc2g6IDB4MDAsXG4gICAgc2NyaXB0SGFzaDogMHgwNSxcbiAgICB3aWY6IDB4ODAsXG4gICAgY29pbjogY29pbnMuQlRDLFxuICB9LFxuICB0ZXN0bmV0OiB7XG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0Y29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxuICAgIGJlY2gzMjogJ3RiJyxcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxuICAgIHB1YktleUhhc2g6IDB4NmYsXG4gICAgc2NyaXB0SGFzaDogMHhjNCxcbiAgICB3aWY6IDB4ZWYsXG4gICAgY29pbjogY29pbnMuQlRDLFxuICB9LFxuXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9CaXRjb2luLUFCQy9iaXRjb2luLWFiYy9ibG9iL21hc3Rlci9zcmMvdmFsaWRhdGlvbi5jcHBcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0JpdGNvaW4tQUJDL2JpdGNvaW4tYWJjL2Jsb2IvbWFzdGVyL3NyYy9jaGFpbnBhcmFtcy5jcHBcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW5jYXNob3JnL2JpdGNvaW5jYXNoLm9yZy9ibG9iL21hc3Rlci9zcGVjL2Nhc2hhZGRyLm1kXG4gIGJpdGNvaW5jYXNoOiB7XG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4Qml0Y29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXG4gICAgcHViS2V5SGFzaDogMHgwMCxcbiAgICBzY3JpcHRIYXNoOiAweDA1LFxuICAgIHdpZjogMHg4MCxcbiAgICBjb2luOiBjb2lucy5CQ0gsXG4gICAgZm9ya0lkOiAweDAwLFxuICAgIGNhc2hBZGRyOiB7XG4gICAgICBwcmVmaXg6ICdiaXRjb2luY2FzaCcsXG4gICAgICBwdWJLZXlIYXNoOiAweDAwLFxuICAgICAgc2NyaXB0SGFzaDogMHgwOCxcbiAgICB9LFxuICB9LFxuICBiaXRjb2luY2FzaFRlc3RuZXQ6IHtcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThCaXRjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMlRlc3RuZXQoKSxcbiAgICBwdWJLZXlIYXNoOiAweDZmLFxuICAgIHNjcmlwdEhhc2g6IDB4YzQsXG4gICAgd2lmOiAweGVmLFxuICAgIGNvaW46IGNvaW5zLkJDSCxcbiAgICBjYXNoQWRkcjoge1xuICAgICAgcHJlZml4OiAnYmNodGVzdCcsXG4gICAgICBwdWJLZXlIYXNoOiAweDAwLFxuICAgICAgc2NyaXB0SGFzaDogMHgwOCxcbiAgICB9LFxuICB9LFxuXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9CVENHUFUvQlRDR1BVL2Jsb2IvbWFzdGVyL3NyYy92YWxpZGF0aW9uLmNwcFxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vQlRDR1BVL0JUQ0dQVS9ibG9iL21hc3Rlci9zcmMvY2hhaW5wYXJhbXMuY3BwXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9CVENHUFUvQlRDR1BVL2Jsb2IvbWFzdGVyL3NyYy9zY3JpcHQvaW50ZXJwcmV0ZXIuaFxuICBiaXRjb2luZ29sZDoge1xuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEJpdGNvaW4gR29sZCBTaWduZWQgTWVzc2FnZTpcXG4nLFxuICAgIGJlY2gzMjogJ2J0ZycsXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcbiAgICBwdWJLZXlIYXNoOiAweDI2LFxuICAgIHNjcmlwdEhhc2g6IDB4MTcsXG4gICAgd2lmOiAweDgwLFxuICAgIGZvcmtJZDogNzksXG4gICAgY29pbjogY29pbnMuQlRHLFxuICB9LFxuICBiaXRjb2luZ29sZFRlc3RuZXQ6IHtcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThCaXRjb2luIEdvbGQgU2lnbmVkIE1lc3NhZ2U6XFxuJyxcbiAgICBiZWNoMzI6ICd0YnRnJyxcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxuICAgIHB1YktleUhhc2g6IDExMSxcbiAgICBzY3JpcHRIYXNoOiAxOTYsXG4gICAgd2lmOiAweGVmLFxuICAgIGZvcmtJZDogNzksXG4gICAgY29pbjogY29pbnMuQlRHLFxuICB9LFxuXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luLXN2L2JpdGNvaW4tc3YvYmxvYi9tYXN0ZXIvc3JjL3ZhbGlkYXRpb24uY3BwXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luLXN2L2JpdGNvaW4tc3YvYmxvYi9tYXN0ZXIvc3JjL2NoYWlucGFyYW1zLmNwcFxuICBiaXRjb2luc3Y6IHtcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThCaXRjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcbiAgICBwdWJLZXlIYXNoOiAweDAwLFxuICAgIHNjcmlwdEhhc2g6IDB4MDUsXG4gICAgd2lmOiAweDgwLFxuICAgIGNvaW46IGNvaW5zLkJTVixcbiAgICBmb3JrSWQ6IDB4MDAsXG4gIH0sXG4gIGJpdGNvaW5zdlRlc3RuZXQ6IHtcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThCaXRjb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMlRlc3RuZXQoKSxcbiAgICBwdWJLZXlIYXNoOiAweDZmLFxuICAgIHNjcmlwdEhhc2g6IDB4YzQsXG4gICAgd2lmOiAweGVmLFxuICAgIGNvaW46IGNvaW5zLkJTVixcbiAgfSxcblxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZGFzaHBheS9kYXNoL2Jsb2IvbWFzdGVyL3NyYy92YWxpZGF0aW9uLmNwcFxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZGFzaHBheS9kYXNoL2Jsb2IvbWFzdGVyL3NyYy9jaGFpbnBhcmFtcy5jcHBcbiAgZGFzaDoge1xuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOURhcmtDb2luIFNpZ25lZCBNZXNzYWdlOlxcbicsXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcbiAgICBwdWJLZXlIYXNoOiAweDRjLFxuICAgIHNjcmlwdEhhc2g6IDB4MTAsXG4gICAgd2lmOiAweGNjLFxuICAgIGNvaW46IGNvaW5zLkRBU0gsXG4gIH0sXG4gIGRhc2hUZXN0OiB7XG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE5RGFya0NvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxuICAgIHB1YktleUhhc2g6IDB4OGMsXG4gICAgc2NyaXB0SGFzaDogMHgxMyxcbiAgICB3aWY6IDB4ZWYsXG4gICAgY29pbjogY29pbnMuREFTSCxcbiAgfSxcblxuICBkZWZhdWx0OiB7XG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE1VmVydXMgc2lnbmVkIGRhdGE6XFxuJyxcbiAgICBiZWNoMzI6ICdiYycsXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcbiAgICBwdWJLZXlIYXNoOiAweDNjLFxuICAgIHNjcmlwdEhhc2g6IDB4NTUsXG4gICAgdmVydXNJRDogMHg2NixcbiAgICB3aWY6IDB4QkMsXG4gICAgY29uc2Vuc3VzQnJhbmNoSWQ6IHtcbiAgICAgIDE6IDB4MDAsXG4gICAgICAyOiAweDAwLFxuICAgICAgMzogMHg1YmE4MWIxOSxcbiAgICAgIDQ6IDB4NzZiODA5YmJcbiAgICB9LFxuICAgIGNvaW46IGNvaW5zLkRFRkFVTFQsXG4gICAgaXNQQmFhUzogdHJ1ZSxcbiAgICBpc1pjYXNoQ29tcGF0aWJsZTogdHJ1ZVxuICB9LFxuXG4gIGRpZ2lieXRlOiB7XG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE5RGlnaWJ5dGUgU2lnbmVkIE1lc3NhZ2U6XFxuJyxcbiAgICBiaXA0NDogMjAsXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcbiAgICBwdWJLZXlIYXNoOiAweDFlLFxuICAgIHNjcmlwdEhhc2g6IDB4NSxcbiAgICB3aWY6IDB4ODAsXG4gICAgY29pbjogY29pbnMuREdCLFxuICAgIGR1c3RUaHJlc2hvbGQ6IDEwMDBcbiAgfSxcblxuICBkb2dlOiB7XG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE5RG9nZWNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcbiAgICBiaXA0NDogMyxcbiAgICBiaXAzMjogZ2V0RG9nZUJpcDMyTWFpbm5ldCgpLFxuICAgIHB1YktleUhhc2g6IDB4MWUsXG4gICAgc2NyaXB0SGFzaDogMHgxNixcbiAgICB3aWY6IDB4OWUsXG4gICAgY29pbjogY29pbnMuRE9HRSxcbiAgICBkdXN0VGhyZXNob2xkOiAwIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kb2dlY29pbi9kb2dlY29pbi9ibG9iL3YxLjcuMS9zcmMvY29yZS5oI0wxNTUtTDE2MFxuICB9LFxuXG4gIGttZDoge1xuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxOEtvbW9kbyBTaWduZWQgTWVzc2FnZTpcXG4nLFxuICAgIGJlY2gzMjogJ2JjJyxcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyTWFpbm5ldCgpLFxuICAgIHB1YktleUhhc2g6IDB4M2MsXG4gICAgc2NyaXB0SGFzaDogMHg1NSxcbiAgICB2ZXJ1c0lEOiAweDY2LFxuICAgIHdpZjogMHhCQyxcbiAgICBjb25zZW5zdXNCcmFuY2hJZDoge1xuICAgICAgMTogMHgwMCxcbiAgICAgIDI6IDB4MDAsXG4gICAgICAzOiAweDViYTgxYjE5LFxuICAgICAgNDogMHg3NmI4MDliYlxuICAgIH0sXG4gICAgY29pbjogY29pbnMuS01ELFxuICAgIGlzUEJhYVM6IGZhbHNlLFxuICAgIGlzWmNhc2hDb21wYXRpYmxlOiB0cnVlXG4gIH0sXG5cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2xpdGVjb2luLXByb2plY3QvbGl0ZWNvaW4vYmxvYi9tYXN0ZXIvc3JjL3ZhbGlkYXRpb24uY3BwXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9saXRlY29pbi1wcm9qZWN0L2xpdGVjb2luL2Jsb2IvbWFzdGVyL3NyYy9jaGFpbnBhcmFtcy5jcHBcbiAgbGl0ZWNvaW46IHtcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MTlMaXRlY29pbiBTaWduZWQgTWVzc2FnZTpcXG4nLFxuICAgIGJlY2gzMjogJ2x0YycsXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcbiAgICBwdWJLZXlIYXNoOiAweDMwLFxuICAgIHNjcmlwdEhhc2g6IDB4MzIsXG4gICAgd2lmOiAweGIwLFxuICAgIGNvaW46IGNvaW5zLkxUQyxcbiAgfSxcbiAgbGl0ZWNvaW5UZXN0OiB7XG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE5TGl0ZWNvaW4gU2lnbmVkIE1lc3NhZ2U6XFxuJyxcbiAgICBiZWNoMzI6ICd0bHRjJyxcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyVGVzdG5ldCgpLFxuICAgIHB1YktleUhhc2g6IDB4NmYsXG4gICAgc2NyaXB0SGFzaDogMHgzYSxcbiAgICB3aWY6IDB4ZWYsXG4gICAgY29pbjogY29pbnMuTFRDLFxuICB9LFxuXG4gIHZlcnVzOiB7XG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE1VmVydXMgc2lnbmVkIGRhdGE6XFxuJyxcbiAgICBiZWNoMzI6ICdiYycsXG4gICAgYmlwMzI6IGdldERlZmF1bHRCaXAzMk1haW5uZXQoKSxcbiAgICBwdWJLZXlIYXNoOiAweDNjLFxuICAgIHNjcmlwdEhhc2g6IDB4NTUsXG4gICAgdmVydXNJRDogMHg2NixcbiAgICB3aWY6IDB4QkMsXG4gICAgY29uc2Vuc3VzQnJhbmNoSWQ6IHtcbiAgICAgIDE6IDB4MDAsXG4gICAgICAyOiAweDAwLFxuICAgICAgMzogMHg1YmE4MWIxOSxcbiAgICAgIDQ6IDB4NzZiODA5YmJcbiAgICB9LFxuICAgIGNvaW46IGNvaW5zLlZSU0MsXG4gICAgaXNQQmFhUzogdHJ1ZSxcbiAgICBpc1pjYXNoQ29tcGF0aWJsZTogdHJ1ZVxuICB9LFxuXG4gIHZlcnVzdGVzdDoge1xuICAgIG1lc3NhZ2VQcmVmaXg6ICdcXHgxNVZlcnVzIHNpZ25lZCBkYXRhOlxcbicsXG4gICAgYmVjaDMyOiAnYmMnLFxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJNYWlubmV0KCksXG4gICAgcHViS2V5SGFzaDogMHgzYyxcbiAgICBzY3JpcHRIYXNoOiAweDU1LFxuICAgIHZlcnVzSUQ6IDB4NjYsXG4gICAgd2lmOiAweEJDLFxuICAgIGNvbnNlbnN1c0JyYW5jaElkOiB7XG4gICAgICAxOiAweDAwLFxuICAgICAgMjogMHgwMCxcbiAgICAgIDM6IDB4NWJhODFiMTksXG4gICAgICA0OiAweDc2YjgwOWJiXG4gICAgfSxcbiAgICBjb2luOiBjb2lucy5WUlNDLFxuICAgIGlzUEJhYVM6IHRydWUsXG4gICAgaXNaY2FzaENvbXBhdGlibGU6IHRydWVcbiAgfSxcblxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vemNhc2gvemNhc2gvYmxvYi9tYXN0ZXIvc3JjL3ZhbGlkYXRpb24uY3BwXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS96Y2FzaC96Y2FzaC9ibG9iL21hc3Rlci9zcmMvY2hhaW5wYXJhbXMuY3BwXG4gIHpjYXNoOiB7XG4gICAgbWVzc2FnZVByZWZpeDogJ1xceDE4WkNhc2ggU2lnbmVkIE1lc3NhZ2U6XFxuJyxcbiAgICBiaXAzMjogZ2V0RGVmYXVsdEJpcDMyTWFpbm5ldCgpLFxuICAgIHB1YktleUhhc2g6IDB4MWNiOCxcbiAgICBzY3JpcHRIYXNoOiAweDFjYmQsXG4gICAgd2lmOiAweDgwLFxuICAgIC8vIFRoaXMgcGFyYW1ldGVyIHdhcyBpbnRyb2R1Y2VkIGluIHZlcnNpb24gMyB0byBhbGxvdyBzb2Z0IGZvcmtzLCBmb3IgdmVyc2lvbiAxIGFuZCAyIHRyYW5zYWN0aW9ucyB3ZSBhZGQgYVxuICAgIC8vIGR1bW15IHZhbHVlLlxuICAgIGNvbnNlbnN1c0JyYW5jaElkOiB7XG4gICAgICAxOiAweDAwLFxuICAgICAgMjogMHgwMCxcbiAgICAgIDM6IDB4NWJhODFiMTksXG4gICAgICAvLyA0OiAweDc2YjgwOWJiIChvbGQgU2FwbGluZyBicmFuY2ggaWQpLiBCbG9zc29tIGJyYW5jaCBpZCBiZWNvbWVzIGVmZmVjdGl2ZSBhZnRlciBibG9jayA2NTM2MDBcbiAgICAgIC8vIDQ6IDB4MmJiNDBlNjBcbiAgICAgIC8vIDQ6IDB4ZjViOTIzMGIgKEhlYXJ0d29vZCBicmFuY2ggaWQsIHNlZSBodHRwczovL3ppcHMuei5jYXNoL3ppcC0wMjUwKVxuICAgICAgLy8gNDogMHhlOWZmNzVhNiwgLy8gKENhbm9weSBicmFuY2ggaWQsIHNlZSBodHRwczovL3ppcHMuei5jYXNoL3ppcC0wMjUxKVxuICAgICAgNDogMHgzNzUxOTYyMSAvLyBOVTUgQnJhbmNoIElEIChiYWNrd2FyZHMgY29tcGF0aWJsZSB3aXRoIE5VNClcbiAgICB9LFxuICAgIGNvaW46IGNvaW5zLlpFQyxcbiAgICBpc1pjYXNoQ29tcGF0aWJsZTogdHJ1ZVxuICB9LFxuICB6Y2FzaFRlc3Q6IHtcbiAgICBtZXNzYWdlUHJlZml4OiAnXFx4MThaQ2FzaCBTaWduZWQgTWVzc2FnZTpcXG4nLFxuICAgIGJpcDMyOiBnZXREZWZhdWx0QmlwMzJUZXN0bmV0KCksXG4gICAgcHViS2V5SGFzaDogMHgxZDI1LFxuICAgIHNjcmlwdEhhc2g6IDB4MWNiYSxcbiAgICB3aWY6IDB4ZWYsXG4gICAgY29uc2Vuc3VzQnJhbmNoSWQ6IHtcbiAgICAgIDE6IDB4MDAsXG4gICAgICAyOiAweDAwLFxuICAgICAgMzogMHg1YmE4MWIxOSxcbiAgICAgIC8vIDQ6IDB4NzZiODA5YmIgKG9sZCBTYXBsaW5nIGJyYW5jaCBpZClcbiAgICAgIC8vIDQ6IDB4MmJiNDBlNjBcbiAgICAgIC8vIDQ6IDB4ZjViOTIzMGIgKEhlYXJ0d29vZCBicmFuY2ggaWQsIHNlZSBodHRwczovL3ppcHMuei5jYXNoL3ppcC0wMjUwKVxuICAgICAgLy8gNDogMHhlOWZmNzVhNiwgLy8gKENhbm9weSBicmFuY2ggaWQsIHNlZSBodHRwczovL3ppcHMuei5jYXNoL3ppcC0wMjUxKVxuICAgICAgNDogMHgzNzUxOTYyMSAvLyBOVTUgQnJhbmNoIElEIChiYWNrd2FyZHMgY29tcGF0aWJsZSB3aXRoIE5VNClcbiAgICB9LFxuICAgIGNvaW46IGNvaW5zLlpFQyxcbiAgICBpc1pjYXNoQ29tcGF0aWJsZTogdHJ1ZVxuICB9LFxufTtcblxuZXhwb3J0ID0gbmV0d29ya3M7XG4iXX0=