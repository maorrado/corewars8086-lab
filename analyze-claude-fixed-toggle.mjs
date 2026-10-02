import fs from "node:fs";

const base = "experiments/smart-counter-2026-09-30/claude-fixed-toggle";
const read = (kind, name) => {
  const path = `${base}/${kind}-${name}.json`;
  return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8")) : null;
};
function paired(control, candidate) {
  const scores = new Map(control.runs.map((run) => [run.runId, run.candidate.teamPerBattle]));
  const values = candidate.runs.filter((run) => scores.has(run.runId)).map((run) => run.candidate.teamPerBattle - scores.get(run.runId));
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const sd = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1));
  const half = 1.96 * sd / Math.sqrt(values.length);
  return { n: values.length, mean, ci95: [mean - half, mean + half], wins: values.filter((v) => v > 0).length, losses: values.filter((v) => v < 0).length, ties: values.filter((v) => v === 0).length };
}
for (const kind of ["field", "duel"]) {
  const entries = Object.fromEntries(["claude", "smart", "phase30", "m050"].map((name) => [name, read(kind, name)]));
  for (const [name, data] of Object.entries(entries)) if (data) {
    console.log(`${kind} ${name}: ${data.aggregate.teamPerBattle.toFixed(6)} (${data.aggregate.battles} battles)`);
  }
  for (const name of ["smart", "phase30", "m050"]) if (entries.claude && entries[name]) {
    console.log(`${kind} claude - ${name}:`, paired(entries[name], entries.claude));
  }
}
const recheckClaude = JSON.parse(fs.readFileSync(`${base}/recheck-claude.json`, "utf8"));
const recheckM050 = JSON.parse(fs.readFileSync(`${base}/recheck-m050.json`, "utf8"));
console.log("field recheck claude - m050:", paired(recheckM050, recheckClaude));
console.log("field recheck scores:", { claude: recheckClaude.aggregate.teamPerBattle, m050: recheckM050.aggregate.teamPerBattle });
