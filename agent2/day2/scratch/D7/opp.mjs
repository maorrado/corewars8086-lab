// per-opponent mean diff (armX - armY) over cohorts of a group prefix
import fs from 'fs';
const [,, file, X, Y, prefix] = process.argv;
const r = JSON.parse(fs.readFileSync(file));
const by = {};
for (const run of r.runs) { (by[run.cohort] ??= {})[run.arm] = run; }
const opp = {}; let n=0, tot=0;
for (const [c, arms] of Object.entries(by)) {
  if (!c.startsWith(prefix) || !arms[X] || !arms[Y]) continue;
  const d = arms[X].team/arms[X].battles - arms[Y].team/arms[Y].battles; n++; tot+=d;
  for (const o of Object.keys(arms[X].opponents)) { (opp[o] ??= []).push(d); }
}
console.log('cohorts', n, 'mean', (tot/n).toFixed(4));
const rows = Object.entries(opp).map(([o, ds]) => [o, ds.length, ds.reduce((a,b)=>a+b,0)/ds.length, ds.reduce((a,b)=>a+b,0)]);
rows.sort((a,b)=>b[3]-a[3]);
for (const r of rows) console.log(r[0].padEnd(34), r[1], r[2].toFixed(3), r[3].toFixed(2));
