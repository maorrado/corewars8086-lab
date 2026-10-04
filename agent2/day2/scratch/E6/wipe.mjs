// E6: battles where both our warriors die: who killed each, phase, rounds; winners.
import fs from 'fs';
const dirs = process.argv.slice(2);
const isZ = n => /^zom20/.test(n);
function classify(r) {
  let phase, k0;
  if (r.cs === 0x1000) { phase = 'startup'; k0 = 3; }
  else { const anc = (r.di - 1) & 0xffff; const d = (r.ip - anc) & 0xffff; if (d >= 1 && d <= 4) { phase = 'dwell'; k0 = 4 - d; } else { phase = 'other'; k0 = 3; } }
  const fb = r.bytes.slice(k0, 4).filter(b => !b.oob);
  const foreign = fb.filter(b => b.by !== r.name).sort((a, b) => b.r - a.r);
  let killer = foreign.length ? foreign[0].by : 'self';
  killer = killer === 'CAND1' ? 'A' : killer === 'CAND2' ? 'B' : isZ(killer) ? 'zomb' : killer.replace(/^[AYT]_([A-Z]+_)?/, '');
  return `${phase}<-${killer}@${r.round}`;
}
const tal = {}; const lines = [];
for (const dir of dirs) for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) {
  const sc = fs.readFileSync(dir + '/' + f.replace('.jsonl', '.scores.csv'), 'utf8').split('Warriors:')[1].trim().split('\n').map(l => l.split(',')[0]);
  const D = {};
  for (const line of fs.readFileSync(dir + '/' + f, 'utf8').split('\n')) { if (!line.trim()) continue; const r = JSON.parse(line); if (isZ(r.name)) continue; (D[r.war] ||= {})[r.name] = r; }
  for (let w = 0; w < 20; w++) {
    const d = D[w] || {}; if (!(d.CAND1 && d.CAND2)) continue;
    const alive = sc.filter(n => !(n in d)).map(n => n.replace(/^[AY]_[A-Z]+_/, ''));
    const a = classify(d.CAND1), b = classify(d.CAND2);
    lines.push(`${dir.split('/').pop().slice(0, 12)} ${f.replace('.jsonl', '').padEnd(12)} w${String(w).padEnd(2)} A ${a.padEnd(36)} B ${b.padEnd(36)} win ${alive.join(',')}`);
    for (const x of [a, b]) { const k = x.replace(/@.*/, ''); tal[k] = (tal[k] || 0) + 1; }
  }
}
console.log(lines.join('\n'));
console.log(Object.entries(tal).sort((a, b) => b[1] - a[1]).map(([k, v]) => v + ' ' + k).join('\n'));
