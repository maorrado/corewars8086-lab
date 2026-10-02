import fs from "node:fs";

const base = "experiments/smart-counter-2026-09-30/xorb-competition-proxy";
const deltas = [];
const partitionDeltas = [];
let totalControl = 0;
let totalXor = 0;
let totalBattles = 0;
const ranks = { control: [], xor_b: [] };

for (let part = 1; part <= 4; part++) {
  const controlPath = `${base}/part-${part}-control.json`;
  const xorPath = `${base}/part-${part}-xor_b.json`;
  if (!fs.existsSync(controlPath) || !fs.existsSync(xorPath)) {
    console.log(`partition ${part}: pending`);
    continue;
  }
  const control = JSON.parse(fs.readFileSync(controlPath, "utf8"));
  const xor = JSON.parse(fs.readFileSync(xorPath, "utf8"));
  if (control.engineJar.sha256 !== xor.engineJar.sha256) throw new Error(`part ${part}: different engine`);
  if (control.runs.length !== 25 || xor.runs.length !== 25) throw new Error(`part ${part}: expected 25 cohorts`);
  const xorRuns = new Map(xor.runs.map((run) => [run.runId, run]));
  const partDeltas = [];
  for (const run of control.runs) {
    const other = xorRuns.get(run.runId);
    if (!other || run.seed !== other.seed || run.battles !== other.battles) throw new Error(`part ${part}: pair mismatch`);
    if (run.inputs.COD_m050_control[0].sha256 !== other.inputs.COD_m050_control[0].sha256) {
      throw new Error(`part ${part}: warrior A changed`);
    }
    for (const [name, warriors] of Object.entries(run.inputs)) {
      if (name === "COD_m050_control") continue;
      if (!other.inputs[name] || warriors.some((warrior, index) => warrior.sha256 !== other.inputs[name][index].sha256)) {
        throw new Error(`part ${part}: opponent mismatch`);
      }
    }
    if (run.zombies.some((zombie, index) => zombie.sha256 !== other.zombies[index].sha256)) {
      throw new Error(`part ${part}: Zombie mismatch`);
    }
    for (const [arm, record] of [["control", run], ["xor_b", other]]) {
      const own = record.scores.groups.COD_m050_control;
      if (Object.keys(record.scores.groups).length !== 4 || !Number.isFinite(own)) {
        throw new Error(`part ${part}: expected exactly four scored teams`);
      }
      ranks[arm].push(1 + Object.entries(record.scores.groups)
        .filter(([name, value]) => name !== "COD_m050_control" && value > own + 1e-8).length);
    }
    partDeltas.push(other.candidate.teamPerBattle - run.candidate.teamPerBattle);
  }
  const mean = partDeltas.reduce((a, b) => a + b, 0) / partDeltas.length;
  const wins = partDeltas.filter((d) => d > 0).length;
  const losses = partDeltas.filter((d) => d < 0).length;
  console.log(`partition ${part}: m050=${control.aggregate.teamPerBattle.toFixed(6)} xorB=${xor.aggregate.teamPerBattle.toFixed(6)} delta=${mean.toFixed(6)} cohort signs=${wins}/${losses}/${25 - wins - losses}`);
  partitionDeltas.push(mean);
  deltas.push(...partDeltas);
  totalControl += control.aggregate.teamPerBattle * control.aggregate.battles;
  totalXor += xor.aggregate.teamPerBattle * xor.aggregate.battles;
  totalBattles += control.aggregate.battles;
}

if (deltas.length === 100) {
  const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const sd = Math.sqrt(deltas.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (deltas.length - 1));
  const radius = 1.984 * sd / Math.sqrt(deltas.length);
  const partitionSd = Math.sqrt(partitionDeltas.reduce((sum, value) => sum + (value - mean) ** 2, 0) / 3);
  const partitionRadius = 3.182 * partitionSd / 2;
  console.log(`pooled ${totalBattles} paired battles, 100 cohort groups: m050=${(totalControl / totalBattles).toFixed(6)} xorB=${(totalXor / totalBattles).toFixed(6)}, delta=${mean.toFixed(6)}`);
  console.log(`approximate cohort-level 95% CI=[${(mean - radius).toFixed(6)},${(mean + radius).toFixed(6)}]`);
  console.log(`four-partition approximate 95% CI=[${(mean - partitionRadius).toFixed(6)},${(mean + partitionRadius).toFixed(6)}]`);
  for (const [arm, values] of Object.entries(ranks)) {
    console.log(`${arm} cohort mean rank=${(values.reduce((sum, rank) => sum + rank, 0) / values.length).toFixed(3)}, first-or-tied blocks=${values.filter((rank) => rank === 1).length}/${values.length}`);
  }
}
