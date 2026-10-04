// B067: paired per-cohort difference between two screened candidates (same field S cohorts/seeds).
import fs from "node:fs";
const ld = (f) => { const j = JSON.parse(fs.readFileSync(`agent2/night/results/${f}.json`, "utf8")); return Object.fromEntries(j.runs.map(r => [`${r.cohort}|${r.seed}`, r.team / r.battles])); };
const a = ld(process.argv[2]), b = ld(process.argv[3]); const S = JSON.parse(fs.readFileSync("agent2/night/fields/S.json", "utf8"));
const grp = Object.fromEntries(S.cohorts.map(c => [c.id, c.group]));
const by = {}; for (const k of Object.keys(a)) { if (!(k in b)) continue; const g = grp[k.split("|")[0]]; for (const G of ["ALL", g]) (by[G] ??= []).push(a[k] - b[k]); }
for (const [g, d] of Object.entries(by)) { const n = d.length, m = d.reduce((s, x) => s + x, 0) / n, sd = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, n - 1)), h = 1.96 * sd / Math.sqrt(n);
  console.log(`${g.padEnd(7)} n=${n} diff ${m.toFixed(4)} [${(m - h).toFixed(4)},${(m + h).toFixed(4)}]`); }
