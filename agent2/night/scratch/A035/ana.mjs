// A035: death attribution of our streams (CAND1=A, CAND2=B, captured zombies running FAR_SEG 0FFBh) by writer of the byte at IP.
import fs from 'fs';
const dir = process.argv[2];
const isZ = (n) => /^zom20/.test(n);
const cat = (by, me) => by === me ? 'self' : (by === 'CAND1' || by === 'CAND2') ? 'partner' : isZ(by) ? 'zombie' : (by === 'init' || by === 'load') ? by : 'opp';
const h = {}; let battles = new Set(); const zl = []; const zkills = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) {
  for (const line of fs.readFileSync(dir + '/' + f, 'utf8').split('\n')) {
    if (!line.trim()) continue; const r = JSON.parse(line); battles.add(f + r.war);
    const ours = r.name === 'CAND1' || r.name === 'CAND2';
    const capt = isZ(r.name) && r.cs === 0x0FFB;
    if (!ours && !capt) continue;
    const who = r.name === 'CAND1' ? 'A' : r.name === 'CAND2' ? 'B' : 'Zcapt';
    const by = r.bytes && r.bytes[0] ? r.bytes[0].by : '?';
    const k = who + ' <- ' + cat(by, r.name) + (isZ(by) ? '' : '');
    h[k] = (h[k] || 0) + 1;
    if (capt) zl.push(r.round);
    if ((who === 'B' || who === 'A') && isZ(by)) zkills[who + ':' + by] = (zkills[who + ':' + by] || 0) + 1;
  }
}
console.log('battles', battles.size);
console.log(Object.entries(h).sort().map(([k, v]) => String(v).padStart(4) + '  ' + k).join('\n'));
zl.sort((a, b) => a - b);
console.log('captured-zombie deaths', zl.length, 'median round', zl[zl.length >> 1], 'q25', zl[zl.length >> 2], 'q75', zl[(3 * zl.length) >> 2]);
console.log('our deaths by zombie writer', JSON.stringify(zkills));
