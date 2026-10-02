import fs from "node:fs";

const base = "experiments/smart-counter-2026-09-30/addboth-holdout";
const read = (kind, variant) => {
  const path = `${base}/${kind}-${variant}.json`;
  return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8")) : null;
};
function paired(a, b) {
  const scores = new Map(a.runs.map((run) => [run.runId, run.candidate.teamPerBattle]));
  const values = b.runs.filter((run) => scores.has(run.runId)).map((run) => run.candidate.teamPerBattle - scores.get(run.runId));
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const sd = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1));
  const half = 1.96 * sd / Math.sqrt(values.length);
  return { n: values.length, mean, ci95: [mean - half, mean + half], wins: values.filter((v) => v > 0).length, losses: values.filter((v) => v < 0).length, ties: values.filter((v) => v === 0).length };
}
for (const kind of ["field", "duel"]) {
  const smart = read(kind, "smart");
  const addA = read(kind, "add-a");
  const phase30 = read(kind, "add-a-phase30");
  const addBoth = read(kind, "add-both");
  const m050 = read(kind, "m050");
  for (const [name, data] of [["smart", smart], ["add-a", addA], ["add-a-phase30", phase30], ["add-both", addBoth], ["m050", m050]]) {
    if (data) console.log(`${kind} ${name}: ${data.aggregate.teamPerBattle.toFixed(6)} (${data.aggregate.battles} battles)`);
  }
  if (addA && addBoth) console.log(`${kind} add-both - add-a:`, paired(addA, addBoth));
  if (addA && phase30) console.log(`${kind} phase30 - add-a:`, paired(addA, phase30));
  if (smart && addA) console.log(`${kind} add-a - smart:`, paired(smart, addA));
  if (smart && addBoth) console.log(`${kind} add-both - smart:`, paired(smart, addBoth));
  if (m050 && addBoth) console.log(`${kind} add-both - m050:`, paired(m050, addBoth));
}
