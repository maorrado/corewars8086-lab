import fs from "node:fs";

const members = {
  A: "0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44",
  B: "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782",
};
const pairs = ["AB", "AA", "BA", "BB"];
const results = new Map();
for (const pair of pairs) {
  const file = `experiments/codex-goal-20260930/pair/${pair.toLowerCase()}-tune.json`;
  if (!fs.existsSync(file)) {
    console.log(`${pair}: pending`);
    continue;
  }
  const result = JSON.parse(fs.readFileSync(file, "utf8"));
  if (result.runs.length !== 50 || result.aggregate.battles !== 500) throw new Error(`${pair}: unexpected sample`);
  const blocks = new Map();
  for (const run of result.runs) {
    if (run.battles !== 10 || !run.seed.startsWith("codex-goal-pair-tune-20260930-")) throw new Error(`${pair}: protocol mismatch`);
    const actual = run.inputs.COD_pair?.map((entry) => entry.sha256);
    const expected = [...pair].map((member) => members[member]);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${pair}: binary mismatch in ${run.runId}`);
    const key = `${run.cohortId}|${run.seed}`;
    if (blocks.has(key)) throw new Error(`${pair}: duplicate block ${key}`);
    blocks.set(key, run.scores.groups.COD_pair / 10);
  }
  results.set(pair, { engine: result.engineJar.sha256, blocks });
  const mean = [...blocks.values()].reduce((sum, score) => sum + score, 0) / blocks.size;
  console.log(`${pair}: score/battle=${mean.toFixed(6)} from 500 battles`);
}
const control = results.get("AB");
if (control) for (const pair of ["AA", "BA", "BB"]) {
  const trial = results.get(pair);
  if (!trial) continue;
  if (trial.engine !== control.engine) throw new Error(`${pair}: engine mismatch`);
  const differences = [...control.blocks].map(([key, score]) => {
    if (!trial.blocks.has(key)) throw new Error(`${pair}: missing ${key}`);
    return trial.blocks.get(key) - score;
  });
  const mean = differences.reduce((sum, value) => sum + value, 0) / differences.length;
  const positive = differences.filter((value) => value > 1e-8).length;
  const negative = differences.filter((value) => value < -1e-8).length;
  console.log(`${pair}-AB: ${mean.toFixed(6)} paired score/battle; ${positive} positive, ${negative} negative, ${differences.length - positive - negative} tied blocks`);
}
