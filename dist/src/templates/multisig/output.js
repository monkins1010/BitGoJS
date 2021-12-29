// m [pubKeys ...] n OP_CHECKMULTISIG
var bscript = require('../../script');
var types = require('../../types');
var typeforce = require('typeforce');
var OPS = require('bitcoin-ops');
var OP_INT_BASE = OPS.OP_RESERVED; // OP_1 - 1
function check(script, allowIncomplete) {
    var chunks = bscript.decompile(script);
    if (chunks.length < 4)
        return false;
    if (chunks[chunks.length - 1] !== OPS.OP_CHECKMULTISIG)
        return false;
    if (!types.Number(chunks[0]))
        return false;
    if (!types.Number(chunks[chunks.length - 2]))
        return false;
    var m = chunks[0] - OP_INT_BASE;
    var n = chunks[chunks.length - 2] - OP_INT_BASE;
    if (m <= 0)
        return false;
    if (n > 16)
        return false;
    if (m > n)
        return false;
    if (n !== chunks.length - 3)
        return false;
    if (allowIncomplete)
        return true;
    var keys = chunks.slice(1, -2);
    return keys.every(bscript.isCanonicalPubKey);
}
check.toJSON = function () { return 'multi-sig output'; };
function encode(m, pubKeys) {
    typeforce({
        m: types.Number,
        pubKeys: [bscript.isCanonicalPubKey]
    }, {
        m: m,
        pubKeys: pubKeys
    });
    var n = pubKeys.length;
    if (n < m)
        throw new TypeError('Not enough pubKeys provided');
    return bscript.compile([].concat(OP_INT_BASE + m, pubKeys, OP_INT_BASE + n, OPS.OP_CHECKMULTISIG));
}
function decode(buffer, allowIncomplete) {
    var chunks = bscript.decompile(buffer);
    typeforce(check, chunks, allowIncomplete);
    return {
        m: chunks[0] - OP_INT_BASE,
        pubKeys: chunks.slice(1, -2)
    };
}
module.exports = {
    check: check,
    decode: decode,
    encode: encode
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RlbXBsYXRlcy9tdWx0aXNpZy9vdXRwdXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscUNBQXFDO0FBRXJDLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQTtBQUNyQyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUE7QUFDbEMsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFBO0FBQ3BDLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtBQUNoQyxJQUFJLFdBQVcsR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFBLENBQUMsV0FBVztBQUU3QyxTQUFTLEtBQUssQ0FBRSxNQUFNLEVBQUUsZUFBZTtJQUNyQyxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBRXRDLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDO1FBQUUsT0FBTyxLQUFLLENBQUE7SUFDbkMsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsZ0JBQWdCO1FBQUUsT0FBTyxLQUFLLENBQUE7SUFDcEUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQUUsT0FBTyxLQUFLLENBQUE7SUFDMUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFBRSxPQUFPLEtBQUssQ0FBQTtJQUMxRCxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFBO0lBQy9CLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQTtJQUUvQyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQUUsT0FBTyxLQUFLLENBQUE7SUFDeEIsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUFFLE9BQU8sS0FBSyxDQUFBO0lBQ3hCLElBQUksQ0FBQyxHQUFHLENBQUM7UUFBRSxPQUFPLEtBQUssQ0FBQTtJQUN2QixJQUFJLENBQUMsS0FBSyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUM7UUFBRSxPQUFPLEtBQUssQ0FBQTtJQUN6QyxJQUFJLGVBQWU7UUFBRSxPQUFPLElBQUksQ0FBQTtJQUVoQyxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQzlCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtBQUM5QyxDQUFDO0FBQ0QsS0FBSyxDQUFDLE1BQU0sR0FBRyxjQUFjLE9BQU8sa0JBQWtCLENBQUEsQ0FBQyxDQUFDLENBQUE7QUFFeEQsU0FBUyxNQUFNLENBQUUsQ0FBQyxFQUFFLE9BQU87SUFDekIsU0FBUyxDQUFDO1FBQ1IsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNO1FBQ2YsT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDO0tBQ3JDLEVBQUU7UUFDRCxDQUFDLEVBQUUsQ0FBQztRQUNKLE9BQU8sRUFBRSxPQUFPO0tBQ2pCLENBQUMsQ0FBQTtJQUVGLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUE7SUFDdEIsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUFFLE1BQU0sSUFBSSxTQUFTLENBQUMsNkJBQTZCLENBQUMsQ0FBQTtJQUU3RCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FDOUIsV0FBVyxHQUFHLENBQUMsRUFDZixPQUFPLEVBQ1AsV0FBVyxHQUFHLENBQUMsRUFDZixHQUFHLENBQUMsZ0JBQWdCLENBQ3JCLENBQUMsQ0FBQTtBQUNKLENBQUM7QUFFRCxTQUFTLE1BQU0sQ0FBRSxNQUFNLEVBQUUsZUFBZTtJQUN0QyxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ3RDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLGVBQWUsQ0FBQyxDQUFBO0lBRXpDLE9BQU87UUFDTCxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLFdBQVc7UUFDMUIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQzdCLENBQUE7QUFDSCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLEtBQUssRUFBRSxLQUFLO0lBQ1osTUFBTSxFQUFFLE1BQU07SUFDZCxNQUFNLEVBQUUsTUFBTTtDQUNmLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBtIFtwdWJLZXlzIC4uLl0gbiBPUF9DSEVDS01VTFRJU0lHXG5cbnZhciBic2NyaXB0ID0gcmVxdWlyZSgnLi4vLi4vc2NyaXB0JylcbnZhciB0eXBlcyA9IHJlcXVpcmUoJy4uLy4uL3R5cGVzJylcbnZhciB0eXBlZm9yY2UgPSByZXF1aXJlKCd0eXBlZm9yY2UnKVxudmFyIE9QUyA9IHJlcXVpcmUoJ2JpdGNvaW4tb3BzJylcbnZhciBPUF9JTlRfQkFTRSA9IE9QUy5PUF9SRVNFUlZFRCAvLyBPUF8xIC0gMVxuXG5mdW5jdGlvbiBjaGVjayAoc2NyaXB0LCBhbGxvd0luY29tcGxldGUpIHtcbiAgdmFyIGNodW5rcyA9IGJzY3JpcHQuZGVjb21waWxlKHNjcmlwdClcblxuICBpZiAoY2h1bmtzLmxlbmd0aCA8IDQpIHJldHVybiBmYWxzZVxuICBpZiAoY2h1bmtzW2NodW5rcy5sZW5ndGggLSAxXSAhPT0gT1BTLk9QX0NIRUNLTVVMVElTSUcpIHJldHVybiBmYWxzZVxuICBpZiAoIXR5cGVzLk51bWJlcihjaHVua3NbMF0pKSByZXR1cm4gZmFsc2VcbiAgaWYgKCF0eXBlcy5OdW1iZXIoY2h1bmtzW2NodW5rcy5sZW5ndGggLSAyXSkpIHJldHVybiBmYWxzZVxuICB2YXIgbSA9IGNodW5rc1swXSAtIE9QX0lOVF9CQVNFXG4gIHZhciBuID0gY2h1bmtzW2NodW5rcy5sZW5ndGggLSAyXSAtIE9QX0lOVF9CQVNFXG5cbiAgaWYgKG0gPD0gMCkgcmV0dXJuIGZhbHNlXG4gIGlmIChuID4gMTYpIHJldHVybiBmYWxzZVxuICBpZiAobSA+IG4pIHJldHVybiBmYWxzZVxuICBpZiAobiAhPT0gY2h1bmtzLmxlbmd0aCAtIDMpIHJldHVybiBmYWxzZVxuICBpZiAoYWxsb3dJbmNvbXBsZXRlKSByZXR1cm4gdHJ1ZVxuXG4gIHZhciBrZXlzID0gY2h1bmtzLnNsaWNlKDEsIC0yKVxuICByZXR1cm4ga2V5cy5ldmVyeShic2NyaXB0LmlzQ2Fub25pY2FsUHViS2V5KVxufVxuY2hlY2sudG9KU09OID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJ211bHRpLXNpZyBvdXRwdXQnIH1cblxuZnVuY3Rpb24gZW5jb2RlIChtLCBwdWJLZXlzKSB7XG4gIHR5cGVmb3JjZSh7XG4gICAgbTogdHlwZXMuTnVtYmVyLFxuICAgIHB1YktleXM6IFtic2NyaXB0LmlzQ2Fub25pY2FsUHViS2V5XVxuICB9LCB7XG4gICAgbTogbSxcbiAgICBwdWJLZXlzOiBwdWJLZXlzXG4gIH0pXG5cbiAgdmFyIG4gPSBwdWJLZXlzLmxlbmd0aFxuICBpZiAobiA8IG0pIHRocm93IG5ldyBUeXBlRXJyb3IoJ05vdCBlbm91Z2ggcHViS2V5cyBwcm92aWRlZCcpXG5cbiAgcmV0dXJuIGJzY3JpcHQuY29tcGlsZShbXS5jb25jYXQoXG4gICAgT1BfSU5UX0JBU0UgKyBtLFxuICAgIHB1YktleXMsXG4gICAgT1BfSU5UX0JBU0UgKyBuLFxuICAgIE9QUy5PUF9DSEVDS01VTFRJU0lHXG4gICkpXG59XG5cbmZ1bmN0aW9uIGRlY29kZSAoYnVmZmVyLCBhbGxvd0luY29tcGxldGUpIHtcbiAgdmFyIGNodW5rcyA9IGJzY3JpcHQuZGVjb21waWxlKGJ1ZmZlcilcbiAgdHlwZWZvcmNlKGNoZWNrLCBjaHVua3MsIGFsbG93SW5jb21wbGV0ZSlcblxuICByZXR1cm4ge1xuICAgIG06IGNodW5rc1swXSAtIE9QX0lOVF9CQVNFLFxuICAgIHB1YktleXM6IGNodW5rcy5zbGljZSgxLCAtMilcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY2hlY2s6IGNoZWNrLFxuICBkZWNvZGU6IGRlY29kZSxcbiAgZW5jb2RlOiBlbmNvZGVcbn1cbiJdfQ==