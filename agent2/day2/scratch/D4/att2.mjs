// A042: corrected death attribution. A2Trace bytes[] = [IP-4, IP+6); IP is the after-fetch IP.
// For dwell deaths (DI low byte = anchor+1), the fatal instruction starts at the anchor (DI-1).
// Killer = last writer among the fatal-instruction bytes [anchor, IP) other than the victim itself
// (latest round wins); 'self' only if all were self-written.
import fs from 'fs';
const dir = process.argv[2]; const segs = (process.argv[3] || '0FFB').split(',').map(s => parseInt(s, 16));
const isZ = (n) => /^zom20/.test(n); const hex = (v, w = 4) => v.toString(16).padStart(w, '0');
const cat = (by, me) => by === me ? 'self' : by === 'CAND1' ? 'A' : by === 'CAND2' ? 'B' : isZ(by) ? 'zombie' : (by === 'init' || by === 'load') ? by : by.replace(/[12]$/,'');
const h = {}; const ex = []; let battles = new Set();
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) for (const line of fs.readFileSync(dir + '/' + f, 'utf8').split('\n')) {
  if (!line.trim()) continue; const r = JSON.parse(line); battles.add(f + r.war);
  const ours = r.name === 'CAND1' || r.name === 'CAND2'; const capt = isZ(r.name) && segs.includes(r.cs);
  if (!ours && !capt) continue;
  const who = r.name === 'CAND1' ? 'A' : r.name === 'CAND2' ? 'B' : 'Zc';
  let phase, k0;
  if (r.cs === 0x1000) { phase = 'startup'; k0 = 3; }
  else {
    const anc = (r.di - 1) & 0xffff; const d = (r.ip - anc) & 0xffff;
    if (d >= 1 && d <= 4) { phase = 'dwell'; k0 = 4 - d; } else { phase = 'other'; k0 = 3; }
  }
  const fb = r.bytes.slice(k0, 4).filter(b => !b.oob);
  let killer = 'self';
  const foreign = fb.filter(b => b.by !== r.name).sort((a, b) => b.r - a.r);
  if (foreign.length) killer = cat(foreign[0].by, r.name);
  const key = who + ' ' + phase.padEnd(7) + ' <- ' + killer; h[key] = (h[key] || 0) + 1;
  if (['A', 'B', 'zombie'].includes(killer)) ex.push(`${f.replace('.jsonl', '')} w${r.war} r${r.round} ${r.name} ${phase} cs ${hex(r.cs)} ip ${hex(r.ip)} di ${hex(r.di)} | ` + r.bytes.map((b, i) => (i === k0 ? '[' : '') + (b.oob ? 'oob' : hex(b.v, 2) + ':' + b.by.replace('CAND1', 'A').replace('CAND2', 'B') + '@' + b.r) + (i === 3 ? ']' : '')).join(' '));
}
console.log('battles', battles.size);
console.log(Object.entries(h).sort().map(([k, v]) => String(v).padStart(4) + '  ' + k).join('\n'));
console.log(ex.join('\n'));
