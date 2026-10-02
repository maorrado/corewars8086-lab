import fs from "node:fs";

const root = "experiments/smart-counter-2026-09-30/xorb-decision";
const checks = [
  ["official", "official-control.json", "official-xor_b.json"],
  ["claude_mixed", "claude_mixed-control.json", "claude_mixed-xor_b.json"],
  ["transfer_2024", "transfer-2024-control.json", "transfer-2024-xor_b.json"],
];

for (const [label, controlFile, variantFile] of checks) {
  const leftPath = `${root}/${controlFile}`;
  const rightPath = `${root}/${variantFile}`;
  if (!fs.existsSync(leftPath) || !fs.existsSync(rightPath)) {
    console.log(`${label}: pending`);
    continue;
  }
  const control = JSON.parse(fs.readFileSync(leftPath, "utf8"));
  const variant = JSON.parse(fs.readFileSync(rightPath, "utf8"));
  if (control.engineJar.sha256 !== variant.engineJar.sha256) throw new Error(`${label}: engine mismatch`);
  const matched = new Map(variant.runs.map((run) => [run.runId, run]));
  if (control.runs.length !== variant.runs.length || matched.size !== control.runs.length) {
    throw new Error(`${label}: run count mismatch`);
  }
  const byCohort = new Map();
  const warriorDeltas = [0, 0];
  for (const run of control.runs) {
    const other = matched.get(run.runId);
    if (!other || run.seed !== other.seed || run.battles !== other.battles) throw new Error(`${label}: missing paired run`);
    const names = Object.keys(run.inputs).filter((name) => name !== "COD_m050_control");
    for (const name of names) {
      for (const index of [0, 1]) {
        if (run.inputs[name][index].sha256 !== other.inputs[name][index].sha256) {
          throw new Error(`${label}: opponent input mismatch`);
        }
      }
    }
    for (const index of run.zombies.keys()) {
      if (run.zombies[index].sha256 !== other.zombies[index].sha256) throw new Error(`${label}: zombie mismatch`);
    }
    if (run.inputs.COD_m050_control[0].sha256 !== other.inputs.COD_m050_control[0].sha256) {
      throw new Error(`${label}: A changed`);
    }
    const delta = other.candidate.teamPerBattle - run.candidate.teamPerBattle;
    if (!byCohort.has(run.cohortId)) byCohort.set(run.cohortId, []);
    byCohort.get(run.cohortId).push(delta);
    warriorDeltas[0] += other.candidate.warrior1PerBattle - run.candidate.warrior1PerBattle;
    warriorDeltas[1] += other.candidate.warrior2PerBattle - run.candidate.warrior2PerBattle;
  }
  const blocks = [...byCohort.values()].map((values) => values.reduce((a, b) => a + b, 0) / values.length);
  const n = blocks.length;
  const mean = blocks.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(blocks.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1));
  const t = n === 25 ? 2.064 : n === 14 ? 2.160 : 1.96;
  const radius = t * sd / Math.sqrt(n);
  const signs = [blocks.filter((v) => v > 0).length, blocks.filter((v) => v < 0).length, blocks.filter((v) => v === 0).length];
  console.log(`${label}: ${control.aggregate.battles} paired battles, ${n} cohorts`);
  console.log(`  m050=${control.aggregate.teamPerBattle.toFixed(6)} XOR-B=${variant.aggregate.teamPerBattle.toFixed(6)} delta=${mean.toFixed(6)}`);
  console.log(`  cohort-cluster approximate 95% CI=[${(mean - radius).toFixed(6)}, ${(mean + radius).toFixed(6)}], cohort signs=${signs.join("/")}`);
  console.log(`  warrior deltas: A=${(warriorDeltas[0] / control.runs.length).toFixed(6)}, B=${(warriorDeltas[1] / control.runs.length).toFixed(6)}`);
}
