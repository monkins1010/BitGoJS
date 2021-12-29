// {signature} {pubKey}
var bscript = require('../../script');
var typeforce = require('typeforce');
function isCompressedCanonicalPubKey(pubKey) {
    return bscript.isCanonicalPubKey(pubKey) && pubKey.length === 33;
}
function check(script) {
    var chunks = bscript.decompile(script);
    return chunks.length === 2 &&
        bscript.isCanonicalSignature(chunks[0]) &&
        isCompressedCanonicalPubKey(chunks[1]);
}
check.toJSON = function () { return 'witnessPubKeyHash input'; };
function encodeStack(signature, pubKey) {
    typeforce({
        signature: bscript.isCanonicalSignature,
        pubKey: isCompressedCanonicalPubKey
    }, {
        signature: signature,
        pubKey: pubKey
    });
    return [signature, pubKey];
}
function decodeStack(stack) {
    typeforce(check, stack);
    return {
        signature: stack[0],
        pubKey: stack[1]
    };
}
module.exports = {
    check: check,
    decodeStack: decodeStack,
    encodeStack: encodeStack
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdGVtcGxhdGVzL3dpdG5lc3NwdWJrZXloYXNoL2lucHV0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHVCQUF1QjtBQUV2QixJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUE7QUFDckMsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFBO0FBRXBDLFNBQVMsMkJBQTJCLENBQUUsTUFBTTtJQUMxQyxPQUFPLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLEVBQUUsQ0FBQTtBQUNsRSxDQUFDO0FBRUQsU0FBUyxLQUFLLENBQUUsTUFBTTtJQUNwQixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBRXRDLE9BQU8sTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDO1FBQ3hCLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsMkJBQTJCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDMUMsQ0FBQztBQUNELEtBQUssQ0FBQyxNQUFNLEdBQUcsY0FBYyxPQUFPLHlCQUF5QixDQUFBLENBQUMsQ0FBQyxDQUFBO0FBRS9ELFNBQVMsV0FBVyxDQUFFLFNBQVMsRUFBRSxNQUFNO0lBQ3JDLFNBQVMsQ0FBQztRQUNSLFNBQVMsRUFBRSxPQUFPLENBQUMsb0JBQW9CO1FBQ3ZDLE1BQU0sRUFBRSwyQkFBMkI7S0FDcEMsRUFBRTtRQUNELFNBQVMsRUFBRSxTQUFTO1FBQ3BCLE1BQU0sRUFBRSxNQUFNO0tBQ2YsQ0FBQyxDQUFBO0lBRUYsT0FBTyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUM1QixDQUFDO0FBRUQsU0FBUyxXQUFXLENBQUUsS0FBSztJQUN6QixTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBRXZCLE9BQU87UUFDTCxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNuQixNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztLQUNqQixDQUFBO0FBQ0gsQ0FBQztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDZixLQUFLLEVBQUUsS0FBSztJQUNaLFdBQVcsRUFBRSxXQUFXO0lBQ3hCLFdBQVcsRUFBRSxXQUFXO0NBQ3pCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB7c2lnbmF0dXJlfSB7cHViS2V5fVxuXG52YXIgYnNjcmlwdCA9IHJlcXVpcmUoJy4uLy4uL3NjcmlwdCcpXG52YXIgdHlwZWZvcmNlID0gcmVxdWlyZSgndHlwZWZvcmNlJylcblxuZnVuY3Rpb24gaXNDb21wcmVzc2VkQ2Fub25pY2FsUHViS2V5IChwdWJLZXkpIHtcbiAgcmV0dXJuIGJzY3JpcHQuaXNDYW5vbmljYWxQdWJLZXkocHViS2V5KSAmJiBwdWJLZXkubGVuZ3RoID09PSAzM1xufVxuXG5mdW5jdGlvbiBjaGVjayAoc2NyaXB0KSB7XG4gIHZhciBjaHVua3MgPSBic2NyaXB0LmRlY29tcGlsZShzY3JpcHQpXG5cbiAgcmV0dXJuIGNodW5rcy5sZW5ndGggPT09IDIgJiZcbiAgICBic2NyaXB0LmlzQ2Fub25pY2FsU2lnbmF0dXJlKGNodW5rc1swXSkgJiZcbiAgICBpc0NvbXByZXNzZWRDYW5vbmljYWxQdWJLZXkoY2h1bmtzWzFdKVxufVxuY2hlY2sudG9KU09OID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJ3dpdG5lc3NQdWJLZXlIYXNoIGlucHV0JyB9XG5cbmZ1bmN0aW9uIGVuY29kZVN0YWNrIChzaWduYXR1cmUsIHB1YktleSkge1xuICB0eXBlZm9yY2Uoe1xuICAgIHNpZ25hdHVyZTogYnNjcmlwdC5pc0Nhbm9uaWNhbFNpZ25hdHVyZSxcbiAgICBwdWJLZXk6IGlzQ29tcHJlc3NlZENhbm9uaWNhbFB1YktleVxuICB9LCB7XG4gICAgc2lnbmF0dXJlOiBzaWduYXR1cmUsXG4gICAgcHViS2V5OiBwdWJLZXlcbiAgfSlcblxuICByZXR1cm4gW3NpZ25hdHVyZSwgcHViS2V5XVxufVxuXG5mdW5jdGlvbiBkZWNvZGVTdGFjayAoc3RhY2spIHtcbiAgdHlwZWZvcmNlKGNoZWNrLCBzdGFjaylcblxuICByZXR1cm4ge1xuICAgIHNpZ25hdHVyZTogc3RhY2tbMF0sXG4gICAgcHViS2V5OiBzdGFja1sxXVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjaGVjazogY2hlY2ssXG4gIGRlY29kZVN0YWNrOiBkZWNvZGVTdGFjayxcbiAgZW5jb2RlU3RhY2s6IGVuY29kZVN0YWNrXG59XG4iXX0=