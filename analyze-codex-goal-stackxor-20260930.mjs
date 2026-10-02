import fs from "node:fs";

const hash = {
  controlA: "0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44",
  controlB: "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782",
  xorA: "915ee87cbc653530ef43be7da400a89ac680f0ca9c5287ae8590e503e1b93e07",
  xorB: "d162507e4cfa89deae0717b10e6c5896fe37e2af29f336771d9b96bffa86b360",
};
const cases = [
  ["control", "experiments/codex-goal-20260930/pair/ab-tune.json", [hash.controlA, hash.controlB]],
  ["xor-a", "experiments/codex-goal-20260930/stack-xor/a-tune.json", [hash.xorA, hash.controlB]],
  ["xor-b", "experiments/codex-goal-20260930/stack-xor/b-tune.json", [hash.controlA, hash.xorB]],
  ["xor-ab", "experiments/codex-goal-20260930/stack-xor/ab-tune.json", [hash.xorA, hash.xorB]],
];
const results = new Map();
for (const [name, file, expected] of cases) {
  if (!fs.existsSync(file)) { console.log(`${name}: pending`); continue; }
  const result = JSON.parse(fs.readFileSync(file, "utf8"));
  if (result.runs.length !== 50 || result.aggregate.battles !== 500) throw new Error(`${name}: sample mismatch`);
  const blocks = new Map();
  for (const run of result.runs) {
    if (run.battles !== 10 || !run.seed.startsWith("codex-goal-pair-tune-20260930-")) throw new Error(`${name}: protocol mismatch`);
    if (Object.keys(run.scores.groups).length !== 4) throw new Error(`${name}: not four teams`);
    const actual = run.inputs.COD_pair?.map((entry) => entry.sha256);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${name}: hash mismatch`);
    const key = `${run.cohortId}|${run.seed}`;
    if (blocks.has(key)) throw new Error(`${name}: duplicate block`);
    blocks.set(key, run.scores.groups.COD_pair / 10);
  }
  results.set(name, { engine: result.engineJar.sha256, blocks });
  console.log(`${name}: ${result.aggregate.teamPerBattle.toFixed(6)} score/battle`);
}
const control = results.get("control");
if (control) for (const [name] of cases.slice(1)) {
  const candidate = results.get(name);
  if (!candidate) continue;
  if (candidate.engine !== control.engine) throw new Error("engine mismatch");
  const differences = [...control.blocks].map(([key, score]) => {
    if (!candidate.blocks.has(key)) throw new Error(`${name}: missing block ${key}`);
    return candidate.blocks.get(key) - score;
  });
  const mean = differences.reduce((sum, value) => sum + value, 0) / differences.length;
  const positive = differences.filter((value) => value > 1e-8).length;
  const negative = differences.filter((value) => value < -1e-8).length;
  console.log(`${name}−control: ${mean.toFixed(6)}; ${positive} positive/${negative} negative/${50 - positive - negative} tied blocks`);
}
