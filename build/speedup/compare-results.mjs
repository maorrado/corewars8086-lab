// Compare two result files of the same config run by different harnesses/engines.
// Reports exact score-file matches and, for the rest, the largest score difference.
// (The original engine's default parallel mode adds floats in completion order, so its
// files can differ from the deterministic order in the last float digit.)
// Usage: node build/speedup/compare-results.mjs official.json fast.json
import fs from "node:fs";

const [aPath, bPath] = process.argv.slice(2);
const a = JSON.parse(fs.readFileSync(aPath, "utf8"));
const b = JSON.parse(fs.readFileSync(bPath, "utf8"));
const key = (r) => `${r.cohortId}|${r.seed}`;
const bRuns = new Map(b.runs.map((r) => [key(r), r]));
let exact = 0, close = 0, far = 0, maxDiff = 0, maxRel = 0;
for (const ra of a.runs) {
  const rb = bRuns.get(key(ra));
  if (!rb) { far++; console.log(`missing in b: ${key(ra)}`); continue; }
  if (ra.rawScoreText === rb.rawScoreText) { exact++; continue; }
  let worst = 0, worstRel = 0;
  for (const section of ["groups", "warriors"]) {
    for (const [name, va] of Object.entries(ra.scores[section])) {
      const vb = rb.scores[section][name];
      const d = Math.abs(va - vb);
      worst = Math.max(worst, d);
      worstRel = Math.max(worstRel, d / Math.max(Math.abs(va), 1e-9));
    }
  }
  maxDiff = Math.max(maxDiff, worst);
  maxRel = Math.max(maxRel, worstRel);
  // float32 has ~7 significant digits: a last-digit difference is < 1e-5 relative
  if (worstRel < 1e-5) close++; else { far++; console.log(`DIFFERENT ${key(ra)}: max abs diff ${worst}`); }
}
console.log(`runs: ${a.runs.length}, exact: ${exact}, float-last-digit only: ${close}, different: ${far}`);
console.log(`max abs diff ${maxDiff}, max rel diff ${maxRel.toExponential(2)}`);
console.log(`aggregate team: a=${a.aggregate.teamPerBattle} b=${b.aggregate.teamPerBattle} diff=${(b.aggregate.teamPerBattle - a.aggregate.teamPerBattle).toExponential(2)}`);
process.exit(far === 0 ? 0 : 1);
