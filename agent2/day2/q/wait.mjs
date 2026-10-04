// Wait (up to ~9 minutes per call) for a job result; prints a compact summary, or PENDING with queue position.
// usage: node agent2/day2/q/wait.mjs <jobId> [--full]
import fs from "node:fs";
const id = process.argv[2]; const full = process.argv.includes("--full");
const done = `agent2/day2/q/queue/done/${id}.json`;
const t0 = Date.now();
while (!fs.existsSync(done) && Date.now() - t0 < 540000) await new Promise((r) => setTimeout(r, 5000));
if (!fs.existsSync(done)) {
  const pend = fs.readdirSync("agent2/day2/q/queue/pending").filter((f) => f.endsWith(".json")).sort();
  const pos = pend.indexOf(`${id}.json`);
  console.log(`PENDING ${id} queuePosition=${pos < 0 ? "running" : pos + 1}/${pend.length} — call wait.mjs again`);
  process.exit(3);
}
const r = JSON.parse(fs.readFileSync(done, "utf8"));
if (full) { console.log(JSON.stringify(r, null, 1)); process.exit(0); }
if (!r.ok) { console.log("ERROR", r.error); process.exit(1); }
const x = r.result; const c = x.candidate;
console.log(`job ${id} kind=${r.job.kind} baseRevision=${x.baseRevision} seconds=${r.seconds}${x.duplicateOf ? " DUPLICATE of " + x.duplicateOf : ""}`);
console.log(`candidate A ${c.sizeA}B ${c.shaA}  B ${c.sizeB}B ${c.shaB}`);
const f = (s) => s ? `${s.diff >= 0 ? "+" : ""}${s.diff} [${s.lo},${s.hi}] n=${s.n} W/L=${s.wins}/${s.losses}` : "-";
if (r.job.kind === "screen") {
  console.log(`screen: cand ${x.candMean} base ${x.baseMean} (battles/arm ${x.battlesPerArm})  ALL ${f(x.all)}`);
  for (const [g, s] of Object.entries(x.groups)) console.log(`  group ${g}: ${f(s)}`);
  const th = x.perCohort.filter((p) => p.group !== "2025" && p.group !== "strong");
  console.log("  per threat/multi cohort diff: " + th.map((p) => `${p.threat ?? p.cohort}=${p.diff}`).join(" "));
} else if (r.job.kind === "threat") {
  console.log(`threat: cand ${x.candMean} base ${x.baseMean} (battles/arm ${x.battlesPerArm}) ALL ${f(x.all)}`);
  for (const [t, s] of Object.entries(x.byThreat)) console.log(`  ${t}: ${f(s)}  threatTeamScore vsCand=${x.threatFirstTeamScore.vsCand[t]} vsBase=${x.threatFirstTeamScore.vsBase[t]}`);
} else if (r.job.kind === "trace") {
  console.log(x.summary); console.log("traceDir", x.traceDir);
} else console.log(JSON.stringify(x, null, 1).slice(0, 8000));
