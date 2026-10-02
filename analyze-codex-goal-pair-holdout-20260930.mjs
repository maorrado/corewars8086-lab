import fs from "node:fs";

const hashes = {
  A: "0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44",
  B: "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782",
};
const scenarios = new Map();
for (const pair of ["AB", "BA"]) {
  const file = `experiments/codex-goal-20260930/pair/${pair.toLowerCase()}-holdout.json`;
  if (!fs.existsSync(file)) {
    console.log(`${pair}: pending`);
    continue;
  }
  const result = JSON.parse(fs.readFileSync(file, "utf8"));
  if (result.runs.length !== 50 || result.aggregate.battles !== 2500) throw new Error(`${pair}: unexpected run count`);
  const block = new Map();
  for (const run of result.runs) {
    if (run.battles !== 50 || !run.seed.startsWith("codex-goal-pair-holdout-20260930-")) throw new Error(`${pair}: protocol mismatch`);
    if (Object.keys(run.scores.groups).length !== 4) throw new Error(`${pair}: not four teams`);
    const expected = [...pair].map((member) => hashes[member]);
    const actual = run.inputs.COD_pair?.map((entry) => entry.sha256);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${pair}: binary mismatch`);
    const key = `${run.cohortId}|${run.seed}`;
    if (block.has(key)) throw new Error(`${pair}: duplicate ${key}`);
    block.set(key, run.scores.groups.COD_pair / 50);
  }
  scenarios.set(pair, { engine: result.engineJar.sha256, block });
  console.log(`${pair}: ${result.aggregate.teamPerBattle.toFixed(6)} score/battle over 2500 battles`);
}
if (scenarios.size === 2) {
  const ab = scenarios.get("AB"), ba = scenarios.get("BA");
  if (ab.engine !== ba.engine) throw new Error("engine mismatch");
  const differences = [...ab.block].map(([key, score]) => {
    if (!ba.block.has(key)) throw new Error(`missing ${key}`);
    return ba.block.get(key) - score;
  });
  const mean = differences.reduce((sum, value) => sum + value, 0) / differences.length;
  const byCohort = new Map();
  for (const [key, abScore] of ab.block) {
    const cohortId = key.split("|")[0];
    if (!byCohort.has(cohortId)) byCohort.set(cohortId, []);
    byCohort.get(cohortId).push(ba.block.get(key) - abScore);
  }
  if (byCohort.size !== 25 || [...byCohort.values()].some((values) => values.length !== 2)) {
    throw new Error("expected 25 cohorts with two seeds each");
  }
  const cohortDifferences = [...byCohort.values()].map((values) => (values[0] + values[1]) / 2);
  const sd = Math.sqrt(cohortDifferences.reduce((sum, value) => sum + (value - mean) ** 2, 0) / 24);
  const radius = 2.064 * sd / Math.sqrt(25); // t(24), clustering both seeds within each opponent trio.
  const positive = differences.filter((value) => value > 1e-8).length;
  const negative = differences.filter((value) => value < -1e-8).length;
  console.log(`BA−AB: ${mean.toFixed(6)}, descriptive 25-cohort CI [${(mean - radius).toFixed(6)}, ${(mean + radius).toFixed(6)}], 50 seed-blocks ${positive} positive/${negative} negative/${50 - positive - negative} tied`);
}
