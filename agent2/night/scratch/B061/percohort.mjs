// B061: per-cohort base/cand team scores and opponents for a threat job result pair
// usage: node percohort.mjs <baseResult.json> <candResult.json>
import fs from "node:fs";
const rd = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const [b, c] = process.argv.slice(2).map(rd);
const m = (res, arm) => Object.fromEntries(res.runs.filter((r) => r.arm === arm).map((r) => [r.cohort, r]));
const B = m(b, "base"), C = m(c, "cand");
for (const k of Object.keys(B)) {
  const r = B[k], q = C[k]; const opp = Object.entries(r.opponents).map(([n, v]) => `${n}=${(v / r.battles).toFixed(2)}`).join(" ");
  const oq = Object.entries(q.opponents).map(([n, v]) => `${n}=${(v / q.battles).toFixed(2)}`).join(" ");
  console.log(k.padEnd(26), "base", (r.team / r.battles).toFixed(3), "cand", (q.team / q.battles).toFixed(3), "| vsBase:", opp, "| vsCand:", oq);
}
