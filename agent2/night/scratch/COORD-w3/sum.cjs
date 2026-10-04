// Summarize a confirm job result: node sum.cjs <jobId>
const fs = require("fs");
const id = process.argv[2];
const r = JSON.parse(fs.readFileSync(`agent2/night/queue/done/${id}.json`, "utf8"));
if (!r.ok) { console.log("ERROR", r.error); process.exit(1); }
const x = r.result;
const f = (s) => s ? `${s.diff >= 0 ? "+" : ""}${s.diff} [${s.lo},${s.hi}] n=${s.n} W/L=${s.wins}/${s.losses}` : "-";
console.log(`job ${id} base rev ${x.baseRevision} salt ${x.salt} battles/arm ${x.battlesPerArm}`);
console.log("arms", JSON.stringify(x.arms));
console.log("means", JSON.stringify(x.means));
for (const [k, c] of Object.entries(x.compare)) {
  console.log(`== vs ${k}: pooled ${f(c.pooled_2025_strong_2024live_z2_5)}`);
  for (const [g, s] of Object.entries(c.groups)) console.log(`   ${g}: ${f(s)}`);
  if (k === "base") for (const [t, s] of Object.entries(c.byThreat)) console.log(`   T ${t}: ${f(s)}`);
}
