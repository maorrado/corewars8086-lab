// B076: per-threat team score (base and candidate arms) from a threat job's result files.
const fs = require("fs"); const N = "agent2/night";
const id = process.argv[2]; const j = JSON.parse(fs.readFileSync(`${N}/queue/done/${id}.json`)); const r = j.result;
const files = fs.readdirSync(`${N}/results`).filter((f) => f.startsWith(`nightT-${r.specKey}-`));
for (const f of files) {
  const res = JSON.parse(fs.readFileSync(`${N}/results/${f}`)); const g = {};
  for (const run of res.runs) { const t = run.cohort.split("#")[0]; const o = (g[t] ??= { b: 0, team: 0, w1: 0, w2: 0, opp: {} }); o.b += run.battles; o.team += run.team; o.w1 += run.w1; o.w2 += run.w2; for (const [k, v] of Object.entries(run.opponents)) o.opp[k] = (o.opp[k] ?? 0) + v; }
  console.log(f);
  for (const [t, o] of Object.entries(g)) console.log(`  ${t.padEnd(8)} battles ${o.b} team ${(o.team / o.b).toFixed(4)} A ${(o.w1 / o.b).toFixed(4)} B ${(o.w2 / o.b).toFixed(4)}  opp ${Object.entries(o.opp).map(([k, v]) => k + " " + (v / o.b).toFixed(3)).join(", ")}`);
}
