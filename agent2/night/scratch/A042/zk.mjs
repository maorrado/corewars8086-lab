// A042: list A/B deaths and captured-zombie deaths where any of the 10 bytes at IP were written by zombies or partner
import fs from 'fs';
const dir = process.argv[2];
const isZ = (n) => /^zom20/.test(n);
const hex = (v, w = 4) => v.toString(16).padStart(w, '0');
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) {
  for (const line of fs.readFileSync(dir + '/' + f, 'utf8').split('\n')) {
    if (!line.trim()) continue; const r = JSON.parse(line);
    const ours = r.name === 'CAND1' || r.name === 'CAND2';
    const capt = isZ(r.name) && r.cs === 0x0FFB;
    if (!ours && !capt) continue;
    const bys = (r.bytes || []).map(b => b.by);
    const zb = bys.some(isZ) || (capt && bys.some(b => b === 'CAND1' || b === 'CAND2'));
    if (!zb && !(ours && bys.some(b => b === 'CAND1' || b === 'CAND2') && bys.some(b=>b!==r.name && (b==='CAND1'||b==='CAND2')))) continue;
    const lin = (r.cs * 16 + r.ip - 0x10000) & 0xffff;
    console.log(f.replace('.jsonl',''), 'w' + r.war, 'r' + r.round, r.name, r.reason.slice(0,3), 'cs', hex(r.cs), 'ip', hex(r.ip), 'arena', hex(lin), 'sp', hex(r.sp), 'di', hex(r.di), 'si', hex(r.si), '|',
      (r.bytes || []).map(b => hex(b.v, 2) + ':' + b.by.replace('CAND1','A').replace('CAND2','B') + '@' + b.r).join(' '));
  }
}
