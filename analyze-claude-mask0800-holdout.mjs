import fs from "node:fs";

const base = "experiments/smart-counter-2026-09-30/claude-toggle-mask";
const read = (kind, name) => {
  const path = `${base}/holdout-${kind}-${name}.json`;
  return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8")) : null;
};
function paired(a, b) {
  const scores = new Map(a.runs.map((run) => [run.runId, run.candidate.teamPerBattle]));
  const deltas = b.runs.filter((run) => scores.has(run.runId)).map((run) => run.candidate.teamPerBattle - scores.get(run.runId));
  const mean = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
  const sd = Math.sqrt(deltas.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (deltas.length - 1));
  const half = 1.96 * sd / Math.sqrt(deltas.length);
  return { n: deltas.length, mean, ci95: [mean - half, mean + half], wins: deltas.filter((v) => v > 0).length, losses: deltas.filter((v) => v < 0).length, ties: deltas.filter((v) => v === 0).length };
}
for (const kind of ["field", "duel"]) {
  const mask = read(kind, "mask0800");
  const original = read(kind, "mask2000");
  const m050 = read(kind, "m050");
  for (const [name, data] of [["mask0800", mask], ["mask2000", original], ["m050", m050]]) {
    if (data) console.log(`${kind} ${name}: ${data.aggregate.teamPerBattle.toFixed(6)} (${data.aggregate.battles} battles)`);
  }
  if (mask && original) console.log(`${kind} 0800 - 2000:`, paired(original, mask));
  if (mask && m050) console.log(`${kind} 0800 - m050:`, paired(m050, mask));
}
