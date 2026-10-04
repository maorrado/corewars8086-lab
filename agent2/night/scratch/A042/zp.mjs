// A042: captured-zombie deaths whose fatal byte (bytes[0]) was written by A or B; plus A/B deaths by captured-zombie trail words
import fs from 'fs';
const dir = process.argv[2]; const seg = +(process.argv[3] || 0x0FFB);
const isZ = (n) => /^zom20/.test(n); const hex = (v, w = 4) => v.toString(16).padStart(w, '0');
let n = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) for (const line of fs.readFileSync(dir + '/' + f, 'utf8').split('\n')) {
  if (!line.trim()) continue; const r = JSON.parse(line);
  if (!(isZ(r.name) && r.cs !== 0x1000)) continue;
  const b0 = r.bytes && r.bytes[0] ? r.bytes[0].by : '?';
  if (b0 !== 'CAND1' && b0 !== 'CAND2') continue; n++;
  const lin = (r.cs * 16 + r.ip - 0x10000) & 0xffff;
  console.log(f.replace('.jsonl', ''), 'w' + r.war, 'r' + r.round, r.name, 'cs', hex(r.cs), 'arena', hex(lin), 'inpage', hex(lin & 0xff, 2), 'di', hex(r.di), 'si', hex(r.si), '|', (r.bytes || []).slice(0, 6).map(b => hex(b.v, 2) + ':' + b.by.replace('CAND1', 'A').replace('CAND2', 'B') + '@' + b.r).join(' '));
}
console.log('total', n);
