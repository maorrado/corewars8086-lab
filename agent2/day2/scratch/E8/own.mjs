// E8: per battle, member deaths (A/B) by class using att2 logic; loss rate conditional on class. Filter by file regex.
import fs from 'fs';
const re = new RegExp(process.env.FRE || '.'); const dirs = process.argv.slice(2);
const isZ = (n) => /^zom20/.test(n);
const cat = (by, me) => by === me ? 'self' : by === 'CAND1' ? 'A' : by === 'CAND2' ? 'B' : isZ(by) ? 'zombie' : (by === 'init' || by === 'load') ? by : 'opp';
function cls(r) {
  let phase, k0;
  if (r.cs === 0x1000) { phase = 'startup'; k0 = 3; }
  else { const anc = (r.di - 1) & 0xffff; const d = (r.ip - anc) & 0xffff; if (d >= 1 && d <= 4) { phase = 'dwell'; k0 = 4 - d; } else { phase = 'other'; k0 = 3; } }
  const fb = r.bytes.slice(k0, 4).filter(b => !b.oob);
  const foreign = fb.filter(b => b.by !== r.name).sort((a, b) => b.r - a.r);
  return { phase, killer: foreign.length ? cat(foreign[0].by, r.name) : 'self' };
}
let nb = 0, nl = 0; const T = {};
for (const dir of dirs) for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl') && re.test(f))) {
  const L = fs.readFileSync(dir + '/' + f, 'utf8').trim().split('\n').map(JSON.parse);
  const byWar = {}; for (const r of L) { const w = r.war ?? r.warEnd; (byWar[w] = byWar[w] || []).push(r); }
  for (const rs of Object.values(byWar)) { nb++;
    const end = rs.find(r => r.warEnd !== undefined); const won = end.winners.split(', ').some(x => /^CAND/.test(x)); if (!won) nl++;
    const ks = new Set();
    for (const r of rs.filter(r => /^CAND/.test(r.name))) { const c = cls(r); const own = ['A','B','zombie'].includes(c.killer) ? 'own' : c.phase === 'startup' ? 'startup' : 'opp/other'; ks.add(own); }
    for (const k of ks) { T[k] = T[k] || [0, 0]; T[k][0]++; if (!won) T[k][1]++; }
  }
}
console.log('battles', nb, 'lost', nl, (nl / nb).toFixed(3));
for (const [k, [n, l]] of Object.entries(T)) console.log(k.padEnd(10), 'battles with such a member death', n, 'lost', l, (l / n).toFixed(2));
