// Compacts a benchmark result file (official or fast schema) for committing: keeps the
// aggregate, engine info and per-run scores (enough for compare.mjs), drops the per-run
// raw score text, stdout, command lines and repeated input listings.
// Usage: node compact-result.mjs <in.json> <out.json>
import fs from "node:fs";

const [inPath, outPath] = process.argv.slice(2);
const r = JSON.parse(fs.readFileSync(inPath, "utf8"));
// Input provenance: the candidate's files (hashes) once; for opponents only their team names per
// cohort (the committed config + generator define their files; hashes of all 2025 teams are fixed).
const candidateName = Object.keys(r.runs[0].inputs)[0];
const candidateInputs = r.runs[0].inputs[candidateName].map((f) => ({ source: f.source, bytes: f.bytes, sha256: f.sha256 }));
const cohortOpponents = {};
for (const run of r.runs) {
  if (!cohortOpponents[run.cohortId]) cohortOpponents[run.cohortId] = Object.keys(run.inputs).slice(1);
}
const compact = {
  schemaVersion: r.schemaVersion,
  compacted: true,
  experimentId: r.experimentId,
  generatedAt: r.generatedAt,
  configPath: r.configPath,
  configSha256: r.configSha256,
  engineJar: r.engineJar,
  engine: r.engine ?? null,
  aggregate: r.aggregate,
  zombies: (r.runs[0]?.zombies ?? []).map((z) => ({ name: z.name, source: z.source, sha256: z.sha256 })),
  candidateInputs,
  cohortOpponents,
  runs: r.runs.map((run) => ({
    runId: run.runId,
    cohortId: run.cohortId,
    seed: run.seed,
    battles: run.battles,
    scores: run.scores,
    candidate: run.candidate,
  })),
};
fs.writeFileSync(outPath, `${JSON.stringify(compact)}\n`);
console.log(`${outPath}: ${(fs.statSync(outPath).size / 1024).toFixed(0)} KB`);
