// E6: per-opponent-team CAND share by arm. node pt.mjs <runDir> <cohortRegex> <armRef> [arms...]
import fs from 'fs';
const [R, rx, ref] = process.argv.slice(2); const re = new RegExp(rx);
const arms = {};
for (const d of fs.readdirSync(R)) {
  const [arm, coh] = d.split('__'); if (!coh || !re.test(coh)) continue; const p = `${R}/${d}/scores.csv`; if (!fs.existsSync(p)) continue;
  const g = fs.readFileSync(p, 'utf8').split('Warriors:')[0].split('\n').slice(1).filter(l => l.includes(',')).map(l => l.split(','));
  const tot = g.reduce((s, x) => s + +x[1], 0); const cand = +g.find(x => x[0] === 'CAND')[1];
  const a = (arms[arm] ||= {});
  for (const [t] of g) { const e = (a[t] ||= { n: 0, cand: 0, tot: 0 }); e.n++; e.cand += cand; e.tot += tot; }
}
const names = Object.keys(arms); console.log('ALL', names.map(a => a + ' ' + (arms[a].CAND.cand / arms[a].CAND.tot).toFixed(4)).join('  '));
const teams = Object.keys(arms[ref]).filter(t => t !== 'CAND');
const rows = teams.map(t => ({ t, n: arms[ref][t].n, v: Object.fromEntries(names.map(a => [a, arms[a][t] ? arms[a][t].cand / arms[a][t].tot : NaN])) }));
rows.sort((x, y) => x.v[ref] - y.v[ref]);
console.log('team'.padEnd(28), 'n ', names.map(a => a.slice(0, 7).padStart(7)).join(' '));
for (const r of rows) console.log(r.t.padEnd(28), String(r.n).padStart(2), names.map(a => r.v[a].toFixed(3).padStart(7)).join(' '));
