// E6: per opponent team, points taken from the CAND arm in the day2 fresh 2025-only check (40 battles per cohort).
import fs from 'fs';
const R = 'agent2/runs/day2-f2025-check-persistent';
const arms = {}; // arm -> team -> {pts, n, cand}
for (const d of fs.readdirSync(R)) {
  const arm = d.split('__')[0]; const p = `${R}/${d}/scores.csv`; if (!fs.existsSync(p)) continue;
  const g = fs.readFileSync(p, 'utf8').split('Warriors:')[0].split('\n').slice(1).filter(l => l.includes(',')).map(l => l.split(','));
  const tot = g.reduce((s, x) => s + +x[1], 0); const cand = +g.find(x => x[0] === 'CAND')[1];
  for (const [t, v] of g) { if (t === 'CAND') continue; const a = (arms[arm] ||= {}); const e = (a[t] ||= { pts: 0, n: 0, cand: 0, tot: 0 }); e.pts += +v; e.n++; e.cand += cand; e.tot += tot; }
  const a = (arms[arm] ||= {}); const e = (a._ALL ||= { pts: 0, n: 0, cand: 0, tot: 0 }); e.n++; e.cand += cand; e.tot += tot;
}
const teams = Object.keys(arms.DET2).filter(t => t !== '_ALL');
console.log('arm ALL cand share:', Object.entries(arms).map(([a, x]) => a + ' ' + (x._ALL.cand / x._ALL.tot).toFixed(4)).join('  '));
const rows = teams.map(t => { const r = { t, n: arms.DET2[t].n }; for (const a of Object.keys(arms)) { const e = arms[a][t]; r[a] = e ? e.cand / e.tot : NaN; r[a + 'opp'] = e ? e.pts / e.tot : NaN; } return r; });
rows.sort((x, y) => x.DET2 - y.DET2);
console.log('team'.padEnd(28), 'n', 'DET2', 'rev1', 'V6nh', 'V6', ' oppShare(DET2)');
for (const r of rows) console.log(r.t.padEnd(28), String(r.n).padStart(2), r.DET2.toFixed(3), (r.rev1 ?? NaN).toFixed(3), (r.V6nohunt ?? NaN).toFixed(3), (r.V6 ?? NaN).toFixed(3), ' ', r.DET2opp.toFixed(3));
