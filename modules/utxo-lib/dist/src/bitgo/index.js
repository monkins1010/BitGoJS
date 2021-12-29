"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSignatureScript = exports.verifySignature = exports.getDefaultSigHash = exports.outputScripts = exports.keyutil = void 0;
exports.keyutil = require("./keyutil");
exports.outputScripts = require("./outputScripts");
var signature_1 = require("./signature");
Object.defineProperty(exports, "getDefaultSigHash", { enumerable: true, get: function () { return signature_1.getDefaultSigHash; } });
Object.defineProperty(exports, "verifySignature", { enumerable: true, get: function () { return signature_1.verifySignature; } });
Object.defineProperty(exports, "parseSignatureScript", { enumerable: true, get: function () { return signature_1.parseSignatureScript; } });
__exportStar(require("./transaction"), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYml0Z28vaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBLHVDQUFxQztBQUNyQyxtREFBaUQ7QUFDakQseUNBQXVGO0FBQTlFLDhHQUFBLGlCQUFpQixPQUFBO0FBQUUsNEdBQUEsZUFBZSxPQUFBO0FBQUUsaUhBQUEsb0JBQW9CLE9BQUE7QUFDakUsZ0RBQThCIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0ICogYXMga2V5dXRpbCBmcm9tICcuL2tleXV0aWwnO1xuZXhwb3J0ICogYXMgb3V0cHV0U2NyaXB0cyBmcm9tICcuL291dHB1dFNjcmlwdHMnO1xuZXhwb3J0IHsgZ2V0RGVmYXVsdFNpZ0hhc2gsIHZlcmlmeVNpZ25hdHVyZSwgcGFyc2VTaWduYXR1cmVTY3JpcHQgfSBmcm9tICcuL3NpZ25hdHVyZSc7XG5leHBvcnQgKiBmcm9tICcuL3RyYW5zYWN0aW9uJztcbiJdfQ==