"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransactionForNetwork = exports.createTransactionBuilderFromTransaction = exports.createTransactionBuilderForNetwork = exports.createTransactionFromHex = exports.createTransactionFromBuffer = void 0;
/**
 * @prettier
 */
const networks = require("../networks");
const coins_1 = require("../coins");
const Transaction = require('../transaction');
const TransactionBuilder = require('../transaction_builder');
function createTransactionFromBuffer(buf, network) {
    switch (coins_1.getMainnet(network)) {
        case networks.bitcoin:
        case networks.bitcoincash:
        case networks.bitcoinsv:
        case networks.bitcoingold:
        case networks.dash:
        case networks.litecoin:
        case networks.zcash:
            return Transaction.fromBuffer(buf, network);
    }
    /* istanbul ignore next */
    throw new Error(`invalid network`);
}
exports.createTransactionFromBuffer = createTransactionFromBuffer;
function createTransactionFromHex(hex, network) {
    return createTransactionFromBuffer(Buffer.from(hex, 'hex'), network);
}
exports.createTransactionFromHex = createTransactionFromHex;
function createTransactionBuilderForNetwork(network) {
    switch (coins_1.getMainnet(network)) {
        case networks.bitcoin:
        case networks.bitcoincash:
        case networks.bitcoinsv:
        case networks.bitcoingold:
        case networks.dash:
        case networks.litecoin: {
            const txb = new TransactionBuilder(network);
            switch (coins_1.getMainnet(network)) {
                case networks.bitcoincash:
                case networks.bitcoinsv:
                    txb.setVersion(2);
            }
            return txb;
        }
        case networks.zcash: {
            const txb = new TransactionBuilder(network);
            txb.setVersion(4);
            txb.setVersionGroupId(0x892f2085);
            // Use "Canopy" consensus branch ID https://zips.z.cash/zip-0251
            txb.setConsensusBranchId(0xe9ff75a6);
            return txb;
        }
    }
    /* istanbul ignore next */
    throw new Error(`invalid network`);
}
exports.createTransactionBuilderForNetwork = createTransactionBuilderForNetwork;
function createTransactionBuilderFromTransaction(tx) {
    switch (coins_1.getMainnet(tx.network)) {
        case networks.bitcoin:
        case networks.bitcoincash:
        case networks.bitcoinsv:
        case networks.bitcoingold:
        case networks.dash:
        case networks.litecoin:
        case networks.zcash:
            return TransactionBuilder.fromTransaction(tx, tx.network);
    }
    /* istanbul ignore next */
    throw new Error(`invalid network`);
}
exports.createTransactionBuilderFromTransaction = createTransactionBuilderFromTransaction;
function createTransactionForNetwork(network) {
    switch (coins_1.getMainnet(network)) {
        case networks.bitcoin:
        case networks.bitcoincash:
        case networks.bitcoinsv:
        case networks.bitcoingold:
        case networks.dash:
        case networks.litecoin:
        case networks.zcash:
            return new Transaction(network);
    }
    /* istanbul ignore next */
    throw new Error(`invalid network`);
}
exports.createTransactionForNetwork = createTransactionForNetwork;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYml0Z28vdHJhbnNhY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7O0dBRUc7QUFDSCx3Q0FBd0M7QUFFeEMsb0NBQXNDO0FBRXRDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQzlDLE1BQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUFDLHdCQUF3QixDQUFDLENBQUM7QUFNN0QsU0FBZ0IsMkJBQTJCLENBQUMsR0FBVyxFQUFFLE9BQWdCO0lBQ3ZFLFFBQVEsa0JBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUMzQixLQUFLLFFBQVEsQ0FBQyxPQUFPLENBQUM7UUFDdEIsS0FBSyxRQUFRLENBQUMsV0FBVyxDQUFDO1FBQzFCLEtBQUssUUFBUSxDQUFDLFNBQVMsQ0FBQztRQUN4QixLQUFLLFFBQVEsQ0FBQyxXQUFXLENBQUM7UUFDMUIsS0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDO1FBQ25CLEtBQUssUUFBUSxDQUFDLFFBQVEsQ0FBQztRQUN2QixLQUFLLFFBQVEsQ0FBQyxLQUFLO1lBQ2pCLE9BQU8sV0FBVyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0M7SUFFRCwwQkFBMEI7SUFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3JDLENBQUM7QUFkRCxrRUFjQztBQUVELFNBQWdCLHdCQUF3QixDQUFDLEdBQVcsRUFBRSxPQUFnQjtJQUNwRSxPQUFPLDJCQUEyQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZFLENBQUM7QUFGRCw0REFFQztBQUVELFNBQWdCLGtDQUFrQyxDQUFDLE9BQWdCO0lBQ2pFLFFBQVEsa0JBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUMzQixLQUFLLFFBQVEsQ0FBQyxPQUFPLENBQUM7UUFDdEIsS0FBSyxRQUFRLENBQUMsV0FBVyxDQUFDO1FBQzFCLEtBQUssUUFBUSxDQUFDLFNBQVMsQ0FBQztRQUN4QixLQUFLLFFBQVEsQ0FBQyxXQUFXLENBQUM7UUFDMUIsS0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDO1FBQ25CLEtBQUssUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3RCLE1BQU0sR0FBRyxHQUFHLElBQUksa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDNUMsUUFBUSxrQkFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUMzQixLQUFLLFFBQVEsQ0FBQyxXQUFXLENBQUM7Z0JBQzFCLEtBQUssUUFBUSxDQUFDLFNBQVM7b0JBQ3JCLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDckI7WUFDRCxPQUFPLEdBQUcsQ0FBQztTQUNaO1FBQ0QsS0FBSyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkIsTUFBTSxHQUFHLEdBQUcsSUFBSSxrQkFBa0IsQ0FBQyxPQUF1QixDQUFDLENBQUM7WUFDNUQsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQixHQUFHLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbEMsZ0VBQWdFO1lBQ2hFLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNyQyxPQUFPLEdBQUcsQ0FBQztTQUNaO0tBQ0Y7SUFFRCwwQkFBMEI7SUFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3JDLENBQUM7QUE1QkQsZ0ZBNEJDO0FBRUQsU0FBZ0IsdUNBQXVDLENBQUMsRUFBZTtJQUNyRSxRQUFRLGtCQUFVLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQzlCLEtBQUssUUFBUSxDQUFDLE9BQU8sQ0FBQztRQUN0QixLQUFLLFFBQVEsQ0FBQyxXQUFXLENBQUM7UUFDMUIsS0FBSyxRQUFRLENBQUMsU0FBUyxDQUFDO1FBQ3hCLEtBQUssUUFBUSxDQUFDLFdBQVcsQ0FBQztRQUMxQixLQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDbkIsS0FBSyxRQUFRLENBQUMsUUFBUSxDQUFDO1FBQ3ZCLEtBQUssUUFBUSxDQUFDLEtBQUs7WUFDakIsT0FBTyxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUM3RDtJQUVELDBCQUEwQjtJQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDckMsQ0FBQztBQWRELDBGQWNDO0FBRUQsU0FBZ0IsMkJBQTJCLENBQUMsT0FBZ0I7SUFDMUQsUUFBUSxrQkFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQzNCLEtBQUssUUFBUSxDQUFDLE9BQU8sQ0FBQztRQUN0QixLQUFLLFFBQVEsQ0FBQyxXQUFXLENBQUM7UUFDMUIsS0FBSyxRQUFRLENBQUMsU0FBUyxDQUFDO1FBQ3hCLEtBQUssUUFBUSxDQUFDLFdBQVcsQ0FBQztRQUMxQixLQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDbkIsS0FBSyxRQUFRLENBQUMsUUFBUSxDQUFDO1FBQ3ZCLEtBQUssUUFBUSxDQUFDLEtBQUs7WUFDakIsT0FBTyxJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUNuQztJQUVELDBCQUEwQjtJQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDckMsQ0FBQztBQWRELGtFQWNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcHJldHRpZXJcbiAqL1xuaW1wb3J0ICogYXMgbmV0d29ya3MgZnJvbSAnLi4vbmV0d29ya3MnO1xuaW1wb3J0IHsgTmV0d29yaywgWmNhc2hOZXR3b3JrIH0gZnJvbSAnLi4vbmV0d29ya1R5cGVzJztcbmltcG9ydCB7IGdldE1haW5uZXQgfSBmcm9tICcuLi9jb2lucyc7XG5cbmNvbnN0IFRyYW5zYWN0aW9uID0gcmVxdWlyZSgnLi4vdHJhbnNhY3Rpb24nKTtcbmNvbnN0IFRyYW5zYWN0aW9uQnVpbGRlciA9IHJlcXVpcmUoJy4uL3RyYW5zYWN0aW9uX2J1aWxkZXInKTtcblxudHlwZSBUcmFuc2FjdGlvbiA9IGFueTtcblxudHlwZSBUcmFuc2FjdGlvbkJ1aWxkZXIgPSBhbnk7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUcmFuc2FjdGlvbkZyb21CdWZmZXIoYnVmOiBCdWZmZXIsIG5ldHdvcms6IE5ldHdvcmspOiBUcmFuc2FjdGlvbiB7XG4gIHN3aXRjaCAoZ2V0TWFpbm5ldChuZXR3b3JrKSkge1xuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbjpcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoOlxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnN2OlxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGQ6XG4gICAgY2FzZSBuZXR3b3Jrcy5kYXNoOlxuICAgIGNhc2UgbmV0d29ya3MubGl0ZWNvaW46XG4gICAgY2FzZSBuZXR3b3Jrcy56Y2FzaDpcbiAgICAgIHJldHVybiBUcmFuc2FjdGlvbi5mcm9tQnVmZmVyKGJ1ZiwgbmV0d29yayk7XG4gIH1cblxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgbmV0d29ya2ApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHJhbnNhY3Rpb25Gcm9tSGV4KGhleDogc3RyaW5nLCBuZXR3b3JrOiBOZXR3b3JrKTogVHJhbnNhY3Rpb24ge1xuICByZXR1cm4gY3JlYXRlVHJhbnNhY3Rpb25Gcm9tQnVmZmVyKEJ1ZmZlci5mcm9tKGhleCwgJ2hleCcpLCBuZXR3b3JrKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRyYW5zYWN0aW9uQnVpbGRlckZvck5ldHdvcmsobmV0d29yazogTmV0d29yayk6IFRyYW5zYWN0aW9uQnVpbGRlciB7XG4gIHN3aXRjaCAoZ2V0TWFpbm5ldChuZXR3b3JrKSkge1xuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbjpcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoOlxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnN2OlxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGQ6XG4gICAgY2FzZSBuZXR3b3Jrcy5kYXNoOlxuICAgIGNhc2UgbmV0d29ya3MubGl0ZWNvaW46IHtcbiAgICAgIGNvbnN0IHR4YiA9IG5ldyBUcmFuc2FjdGlvbkJ1aWxkZXIobmV0d29yayk7XG4gICAgICBzd2l0Y2ggKGdldE1haW5uZXQobmV0d29yaykpIHtcbiAgICAgICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcbiAgICAgICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luc3Y6XG4gICAgICAgICAgdHhiLnNldFZlcnNpb24oMik7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHhiO1xuICAgIH1cbiAgICBjYXNlIG5ldHdvcmtzLnpjYXNoOiB7XG4gICAgICBjb25zdCB0eGIgPSBuZXcgVHJhbnNhY3Rpb25CdWlsZGVyKG5ldHdvcmsgYXMgWmNhc2hOZXR3b3JrKTtcbiAgICAgIHR4Yi5zZXRWZXJzaW9uKDQpO1xuICAgICAgdHhiLnNldFZlcnNpb25Hcm91cElkKDB4ODkyZjIwODUpO1xuICAgICAgLy8gVXNlIFwiQ2Fub3B5XCIgY29uc2Vuc3VzIGJyYW5jaCBJRCBodHRwczovL3ppcHMuei5jYXNoL3ppcC0wMjUxXG4gICAgICB0eGIuc2V0Q29uc2Vuc3VzQnJhbmNoSWQoMHhlOWZmNzVhNik7XG4gICAgICByZXR1cm4gdHhiO1xuICAgIH1cbiAgfVxuXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBuZXR3b3JrYCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUcmFuc2FjdGlvbkJ1aWxkZXJGcm9tVHJhbnNhY3Rpb24odHg6IFRyYW5zYWN0aW9uKTogVHJhbnNhY3Rpb25CdWlsZGVyIHtcbiAgc3dpdGNoIChnZXRNYWlubmV0KHR4Lm5ldHdvcmspKSB7XG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luOlxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmNhc2g6XG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luc3Y6XG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcbiAgICBjYXNlIG5ldHdvcmtzLmRhc2g6XG4gICAgY2FzZSBuZXR3b3Jrcy5saXRlY29pbjpcbiAgICBjYXNlIG5ldHdvcmtzLnpjYXNoOlxuICAgICAgcmV0dXJuIFRyYW5zYWN0aW9uQnVpbGRlci5mcm9tVHJhbnNhY3Rpb24odHgsIHR4Lm5ldHdvcmspO1xuICB9XG5cbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIG5ldHdvcmtgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRyYW5zYWN0aW9uRm9yTmV0d29yayhuZXR3b3JrOiBOZXR3b3JrKTogVHJhbnNhY3Rpb24ge1xuICBzd2l0Y2ggKGdldE1haW5uZXQobmV0d29yaykpIHtcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW46XG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdjpcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5nb2xkOlxuICAgIGNhc2UgbmV0d29ya3MuZGFzaDpcbiAgICBjYXNlIG5ldHdvcmtzLmxpdGVjb2luOlxuICAgIGNhc2UgbmV0d29ya3MuemNhc2g6XG4gICAgICByZXR1cm4gbmV3IFRyYW5zYWN0aW9uKG5ldHdvcmspO1xuICB9XG5cbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIG5ldHdvcmtgKTtcbn1cbiJdfQ==