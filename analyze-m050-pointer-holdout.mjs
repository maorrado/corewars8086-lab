import fs from "node:fs";

const base = "experiments/smart-counter-2026-09-30/pointer-operator";
const read = (kind, name) => {
  const path = `${base}/holdout-${kind}-${name}.json`;
  return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8")) : null;
};
function paired(control, candidate, filter = () => true) {
  const scores = new Map(control.runs.filter(filter).map((run) => [run.runId, run.candidate.teamPerBattle]));
  const values = candidate.runs.filter((run) => scores.has(run.runId)).map((run) => run.candidate.teamPerBattle - scores.get(run.runId));
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const sd = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1));
  const half = 1.96 * sd / Math.sqrt(values.length);
  return { n: values.length, mean, ci95: [mean - half, mean + half], wins: values.filter((v) => v > 0).length, losses: values.filter((v) => v < 0).length, ties: values.filter((v) => v === 0).length };
}
for (const kind of ["field", "duel"]) {
  const control = read(kind, "control");
  const candidate = read(kind, "xor-b");
  if (!control || !candidate) continue;
  console.log(kind, { control: control.aggregate.teamPerBattle, candidate: candidate.aggregate.teamPerBattle, battles: candidate.aggregate.battles });
  console.log("  paired", paired(control, candidate));
  if (kind === "duel") for (const opponent of ["vs-smart", "vs-add-a"]) {
    console.log(`  ${opponent}`, paired(control, candidate, (run) => run.cohortId === opponent));
  }
}
const fieldRecheckControlPath = `${base}/field-recheck-control.json`;
const fieldRecheckCandidatePath = `${base}/field-recheck-xor-b.json`;
if (fs.existsSync(fieldRecheckControlPath) && fs.existsSync(fieldRecheckCandidatePath)) {
  const recheckControl = JSON.parse(fs.readFileSync(fieldRecheckControlPath, "utf8"));
  const recheckCandidate = JSON.parse(fs.readFileSync(fieldRecheckCandidatePath, "utf8"));
  console.log("counter-free field recheck", { control: recheckControl.aggregate.teamPerBattle, candidate: recheckCandidate.aggregate.teamPerBattle, battles: recheckCandidate.aggregate.battles });
  console.log("  paired", paired(recheckControl, recheckCandidate));
}
const claudePath = "experiments/smart-counter-2026-09-30/claude-fixed-toggle";
const claudeControl = JSON.parse(fs.readFileSync(`${claudePath}/defense-duel-control.json`, "utf8"));
const claudeCandidate = JSON.parse(fs.readFileSync(`${claudePath}/defense-duel-xor-b.json`, "utf8"));
console.log("duel vs Claude", { control: claudeControl.aggregate.teamPerBattle, candidate: claudeCandidate.aggregate.teamPerBattle, battles: claudeCandidate.aggregate.battles });
console.log("  paired", paired(claudeControl, claudeCandidate));
const mixedControlPath = `${claudePath}/mixed-field-control.json`;
const mixedCandidatePath = `${claudePath}/mixed-field-xor-b.json`;
if (fs.existsSync(mixedControlPath) && fs.existsSync(mixedCandidatePath)) {
  const mixedControl = JSON.parse(fs.readFileSync(mixedControlPath, "utf8"));
  const mixedCandidate = JSON.parse(fs.readFileSync(mixedCandidatePath, "utf8"));
  console.log("mixed four-team field with Claude", { control: mixedControl.aggregate.teamPerBattle, candidate: mixedCandidate.aggregate.teamPerBattle, battles: mixedCandidate.aggregate.battles });
  console.log("  paired", paired(mixedControl, mixedCandidate));
}
const mixedRecheckControlPath = `${claudePath}/mixed-recheck-control.json`;
const mixedRecheckCandidatePath = `${claudePath}/mixed-recheck-xor-b.json`;
if (fs.existsSync(mixedRecheckControlPath) && fs.existsSync(mixedRecheckCandidatePath)) {
  const mixedControl = JSON.parse(fs.readFileSync(mixedRecheckControlPath, "utf8"));
  const mixedCandidate = JSON.parse(fs.readFileSync(mixedRecheckCandidatePath, "utf8"));
  console.log("mixed four-team recheck", { control: mixedControl.aggregate.teamPerBattle, candidate: mixedCandidate.aggregate.teamPerBattle, battles: mixedCandidate.aggregate.battles });
  console.log("  paired", paired(mixedControl, mixedCandidate));
}
const nameControlPath = `${claudePath}/mixed-field-xor-b-control-name.json`;
if (fs.existsSync(nameControlPath) && fs.existsSync(mixedCandidatePath)) {
  const ordinary = JSON.parse(fs.readFileSync(mixedCandidatePath, "utf8"));
  const renamed = JSON.parse(fs.readFileSync(nameControlPath, "utf8"));
  console.log("same xor-b binary with control name vs ordinary name", paired(ordinary, renamed));
}
