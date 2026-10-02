import fs from "node:fs";

const base = "experiments/smart-counter-2026-09-30/defense";
const read = (kind, variant) => {
  const path = `${base}/a-step-holdout-${kind}-${variant}.json`;
  return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8")) : null;
};
function paired(control, candidate, filter = () => true) {
  const values = new Map(control.runs.filter(filter).map((run) => [run.runId, run.candidate.teamPerBattle]));
  const deltas = candidate.runs.filter((run) => values.has(run.runId)).map((run) => run.candidate.teamPerBattle - values.get(run.runId));
  const mean = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
  const sd = Math.sqrt(deltas.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (deltas.length - 1));
  const half = 1.96 * sd / Math.sqrt(deltas.length);
  return { n: deltas.length, mean, ci95: [mean - half, mean + half], wins: deltas.filter((v) => v > 0).length, losses: deltas.filter((v) => v < 0).length, ties: deltas.filter((v) => v === 0).length };
}
for (const kind of ["field", "duel"]) {
  const control = read(kind, "control");
  if (!control) continue;
  console.log(`${kind} control: ${control.aggregate.teamPerBattle.toFixed(6)} (${control.aggregate.battles} battles)`);
  for (const variant of ["a3400", "a3800"]) {
    const candidate = read(kind, variant);
    if (!candidate) continue;
    console.log(`${kind} ${variant}: ${candidate.aggregate.teamPerBattle.toFixed(6)} (${candidate.aggregate.battles} battles)`);
    console.log("  overall", paired(control, candidate));
    if (kind === "duel") for (const opponent of ["vs-smart", "vs-add-a"]) {
      console.log(`  ${opponent}`, paired(control, candidate, (run) => run.cohortId === opponent));
    }
  }
}
