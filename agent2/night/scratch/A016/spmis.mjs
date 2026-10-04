// A016: deaths whose SP residue (mod 4) is not 2, with dwell history (hist) to see if the stream was misaligned for a whole generation
import fs from 'fs';
const dir = process.argv[2];
const hex = (v, n = 4) => (v >>> 0).toString(16).toUpperCase().padStart(n, '0');
let n = 0, nm = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) {
  for (const line of fs.readFileSync(dir + '/' + f, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);
    const isZ = r.type === 'ZOMBIE' && r.cs === 0x0FFB;
    if (!(r.name === 'CAND1' || r.name === 'CAND2' || isZ)) continue;
    n++;
    if (r.ss !== 0x1000 || (r.sp & 3) === 2) continue;
    nm++;
    const h = r.hist || [];
    const hs = h.length ? `hist ${h.length}: first [${h[0]}] last [${h[h.length - 1]}]` : 'no hist';
    console.log(f, 'war', r.war, 'r' + r.round, r.name, 'load', hex(r.load), 'cs:ip', hex(r.cs) + ':' + hex(r.ip), 'sp', hex(r.sp), 'di', hex(r.di), 'si', hex(r.si), 'ax', hex(r.ax), '\n   ', hs, '\n    bytes', r.bytes.slice(0, 6).map(b => hex(b.v, 2) + '/' + b.by + '@' + b.r).join(' '));
  }
}
console.log('our deaths', n, 'SP misaligned at death', nm);
