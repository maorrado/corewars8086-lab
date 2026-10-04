// E6: deaths of our streams (A, B, captured zombies) caused by 2025 teams (not T_*, not zombies, not own).
import fs from 'fs';
const dirs = process.argv.slice(2);
const isZ = n => /^zom20/.test(n); const hex = (v, w = 4) => (v >>> 0).toString(16).padStart(w, '0');
const out = []; const tally = {}; let nb = 0;
for (const dir of dirs) for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) for (const line of fs.readFileSync(dir + '/' + f, 'utf8').split('\n')) {
  if (!line.trim()) continue; const r = JSON.parse(line);
  const ours = r.name === 'CAND1' || r.name === 'CAND2'; const capt = isZ(r.name) && (r.cs === 0xffb || r.cs === 0xffa);
  if (!ours && !capt) continue;
  const who = r.name === 'CAND1' ? 'A' : r.name === 'CAND2' ? 'B' : 'Z';
  let phase, k0;
  if (r.cs === 0x1000) { phase = 'startup'; k0 = 3; }
  else { const anc = (r.di - 1) & 0xffff; const d = (r.ip - anc) & 0xffff; if (d >= 1 && d <= 4) { phase = 'dwell'; k0 = 4 - d; } else { phase = 'other'; k0 = 3; } }
  const fb = r.bytes.slice(k0, 4).filter(b => !b.oob);
  const foreign = fb.filter(b => b.by !== r.name).sort((a, b) => b.r - a.r);
  const killer = foreign.length ? foreign[0].by : 'self';
  const kc = killer === 'CAND1' ? 'A' : killer === 'CAND2' ? 'B' : isZ(killer) ? 'zombie' : (killer==='init'||killer==='load'||killer==='self') ? killer : killer.startsWith('T_') ? 'T' : 'team';
  const key = `${who} ${phase} ${kc}`; tally[key] = (tally[key] || 0) + 1;
  if (kc === 'team') out.push(`${dir.split('/').pop().slice(0,14)} ${f.replace('.jsonl','').padEnd(28)} w${String(r.war).padEnd(2)} r${String(r.round).padEnd(6)} ${who} ${phase.padEnd(7)} ${killer.padEnd(26)} ip ${hex(r.ip)} di ${hex(r.di)} sp ${hex(r.sp)} si ${hex(r.si)} cx? ${r.reason.slice(0,12)} | ` + r.bytes.map((b, i) => (i === k0 ? '[' : '') + (b.oob ? 'oob' : hex(b.v, 2) + ':' + (b.by===r.name?'me':b.by.replace(/^[AY]_[A-Z]+_/,'').slice(0,10)) + '@' + b.r) + (i === 3 ? ']' : '')).join(' '));
}
console.log(Object.entries(tally).sort().map(([k, v]) => String(v).padStart(4) + ' ' + k).join('\n'));
console.log(out.join('\n'));
