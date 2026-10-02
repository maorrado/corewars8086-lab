import fs from "node:fs";

const scenarios = [
  ["m050", "experiments/codex-goal-20260930/pair/ab-holdout.json", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"],
  ["stackxor-b", process.argv[2] ?? "experiments/codex-goal-20260930/stack-xor/b-holdout.json", "d162507e4cfa89deae0717b10e6c5896fe37e2af29f336771d9b96bffa86b360"],
];
const aHash = "0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44";
const values = new Map();
for (const [name, file, bHash] of scenarios) {
  if (!fs.existsSync(file)) { console.log(`${name}: pending`); continue; }
  const result = JSON.parse(fs.readFileSync(file, "utf8"));
  if (result.runs.length !== 50 || result.aggregate.battles !== 2500) throw new Error(`${name}: sample mismatch`);
  const blocks = new Map();
  for (const run of result.runs) {
    if (run.battles !== 50 || !run.seed.startsWith("codex-goal-pair-holdout-20260930-")) throw new Error(`${name}: protocol mismatch`);
    if (Object.keys(run.scores.groups).length !== 4) throw new Error(`${name}: four-team mismatch`);
    if (JSON.stringify(run.inputs.COD_pair?.map((entry) => entry.sha256)) !== JSON.stringify([aHash, bHash])) throw new Error(`${name}: binary mismatch`);
    const key = `${run.cohortId}|${run.seed}`;
    if (blocks.has(key)) throw new Error(`${name}: duplicate block`);
    blocks.set(key, run.scores.groups.COD_pair / 50);
  }
  values.set(name, { engine: result.engineJar.sha256, blocks });
  console.log(`${name}: ${result.aggregate.teamPerBattle.toFixed(6)} score/battle, 2500 battles`);
}
if (values.size === 2) {
  const control = values.get("m050"), test = values.get("stackxor-b");
  if (control.engine !== test.engine) throw new Error("engine mismatch");
  const byCohort = new Map();
  for (const [key, score] of control.blocks) {
    if (!test.blocks.has(key)) throw new Error(`missing block ${key}`);
    const cohort = key.split("|")[0];
    if (!byCohort.has(cohort)) byCohort.set(cohort, []);
    byCohort.get(cohort).push(test.blocks.get(key) - score);
  }
  if (byCohort.size !== 25 || [...byCohort.values()].some((items) => items.length !== 2)) throw new Error("expected 25 cohorts × two seeds");
  const differences = [...byCohort.values()].map((items) => (items[0] + items[1]) / 2);
  const mean = differences.reduce((sum, value) => sum + value, 0) / 25;
  const sd = Math.sqrt(differences.reduce((sum, value) => sum + (value - mean) ** 2, 0) / 24);
  const radius = 2.064 * sd / Math.sqrt(25);
  const positive = differences.filter((value) => value > 1e-8).length;
  const negative = differences.filter((value) => value < -1e-8).length;
  console.log(`stackxor-b−m050: ${mean.toFixed(6)}, descriptive 25-cohort CI [${(mean - radius).toFixed(6)}, ${(mean + radius).toFixed(6)}], cohorts ${positive} positive/${negative} negative/${25 - positive - negative} tied`);
}
