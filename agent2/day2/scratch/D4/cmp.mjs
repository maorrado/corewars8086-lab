// per-cohort diff cand vs base (rev1) with opponent scores
import fs from "node:fs";
const c = JSON.parse(fs.readFileSync(process.argv[2])); const b = JSON.parse(fs.readFileSync(process.argv[3] || "agent2/day2/q/results/nightS-base-rev1.json"));
const bm = Object.fromEntries(b.runs.map(r => [r.cohort, r])); const filt = process.argv[4] ? new RegExp(process.argv[4]) : null;
for (const r of c.runs) { if (filt && !filt.test(r.cohort)) continue; const x = bm[r.cohort]; if (!x) continue;
  console.log(r.cohort.padEnd(20), ((r.team - x.team) / r.battles).toFixed(3).padStart(7), " cand", (r.team / r.battles).toFixed(3), `A ${r.w1.toFixed(1)} B ${r.w2.toFixed(1)}`, " base", (x.team / x.battles).toFixed(3), `A ${x.w1.toFixed(1)} B ${x.w2.toFixed(1)}`, " opp", JSON.stringify(r.opponents), "| base", JSON.stringify(x.opponents)); }
