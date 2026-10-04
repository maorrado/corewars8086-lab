// B089: per-threat member scores (A=w1, B=w2, team) from night results files.
// usage: node members.cjs <resultsFile> [<resultsFile> ...]
const fs = require('fs');
for (const f of process.argv.slice(2)) {
  const r = JSON.parse(fs.readFileSync(f, 'utf8'));
  const agg = {};
  for (const x of r.runs) { const t = x.cohort.split('#')[0]; const a = (agg[t] ??= { n: 0, A: 0, B: 0, T: 0 }); a.n += x.battles; a.A += x.w1; a.B += x.w2; a.T += x.team; }
  console.log('==', f.split('/').pop());
  for (const [t, a] of Object.entries(agg)) console.log(t.padEnd(14), 'A', (a.A / a.n).toFixed(3), 'B', (a.B / a.n).toFixed(3), 'team', (a.T / a.n).toFixed(3), 'battles', a.n);
}
