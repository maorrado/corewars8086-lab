// per-threat absolute scores from a results file: node pert.mjs <results.json> [arm]
import fs from "node:fs";
const j = JSON.parse(fs.readFileSync(process.argv[2], "utf8")); const arm = process.argv[3] ?? null;
const g = {};
for (const r of j.runs) { if (arm && r.arm !== arm) continue; const t = r.arm + " " + r.cohort.split("#")[0]; const o = (g[t] ??= { n: 0, us: [], opp: {} }); o.n++; o.us.push(r.team / r.battles);
  let x = 0, fill = 0; for (const [k, v] of Object.entries(r.opponents)) { if (/^X_|_c[ABC]$|_m[ABC]$|^T_|^Y_TOM|^A_WAN|^A_IND_cgx|^A_OHS|^A_HRZ/.test(k) && !/fill/.test(k)) { (o.opp[k.replace(/_c[ABC]$/, "_c*")] ??= []).push(v / r.battles); } else fill += v / r.battles; } (o.opp.fill ??= []).push(fill); }
const m = (a) => (a.reduce((x, y) => x + y, 0) / a.length);
const sd = (a) => { const mu = m(a); return Math.sqrt(a.reduce((s, x) => s + (x - mu) ** 2, 0) / Math.max(1, a.length - 1)) / Math.sqrt(a.length); };
for (const [t, o] of Object.entries(g)) console.log(t.padEnd(40), "n", o.n, "us", m(o.us).toFixed(4), "+-", sd(o.us).toFixed(4), Object.entries(o.opp).map(([k, a]) => `${k}=${m(a).toFixed(3)}`).join(" "));
