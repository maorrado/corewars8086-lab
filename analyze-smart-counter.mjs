import fs from "node:fs";

const root = "experiments/smart-counter-2026-09-30";
const read = (path) => fs.existsSync(`${root}/${path}`) ? JSON.parse(fs.readFileSync(`${root}/${path}`, "utf8")) : null;
function summary(path) {
  const result = read(path);
  if (!result) return;
  console.log(`${path}: ${result.aggregate.teamPerBattle.toFixed(6)} / ${result.aggregate.battles} battles`);
}
function paired(firstPath, secondPath) {
  const first = read(firstPath);
  const second = read(secondPath);
  if (!first || !second) return;
  const left = new Map(first.runs.map((run) => [run.runId, run.candidate.teamPerBattle]));
  const differences = second.runs.filter((run) => left.has(run.runId)).map((run) => run.candidate.teamPerBattle - left.get(run.runId));
  const mean = differences.reduce((sum, value) => sum + value, 0) / differences.length;
  const variance = differences.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (differences.length - 1);
  const halfWidth = 1.96 * Math.sqrt(variance / differences.length);
  console.log(`${secondPath} minus ${firstPath}: ${mean.toFixed(6)}, CI95 [${(mean - halfWidth).toFixed(6)}, ${(mean + halfWidth).toFixed(6)}], ${differences.filter((value) => value > 0).length}W/${differences.filter((value) => value < 0).length}L/${differences.filter((value) => value === 0).length}T (${differences.length} paired runs)`);
}
for (const path of [
  "smart-counter-field-smart.json", "smart-counter-field-m050.json", "field/fixed-both.json",
  "target/baseline.json", "target/fixed-both.json", "target/copy-nine.json", "target/add-a.json",
  "duel/baseline.json", "duel/fixed-both.json",
  "defense/m050-smart-a.json", "defense/m050-smart-b.json",
  "defense/toggle-counter-duel.json", "defense/toggle-counter-field-screen.json",
  "field/screen-control.json", "field/screen-fixed-a.json", "field/screen-fixed-b.json",
  "defense/field-screen-m050-control.json", "steps/duel-control.json", "steps/duel-add-a.json",
  "steps/duel-sub-a.json", "steps/field-add-a.json", "steps/field-sub-a.json",
  "holdout/field-smart.json", "holdout/field-add-a.json", "holdout/field-m050.json",
  "holdout/duel-smart.json", "holdout/duel-add-a.json",
  "holdout/field-add-a-phase-30.json", "holdout/duel-add-a-phase-30.json",
  "defense/captured-toggle-counter-duel.json", "defense/captured-toggle-counter-field-screen.json",
  "defense/m050-control.json", "defense/holdout-field-m050.json", "defense/holdout-field-captured.json",
  "defense/holdout-duel-m050.json", "defense/holdout-duel-captured.json",
]) summary(path);
paired("smart-counter-field-m050.json", "smart-counter-field-smart.json");
paired("smart-counter-field-m050.json", "field/fixed-both.json");
paired("target/baseline.json", "target/fixed-both.json");
paired("target/baseline.json", "target/copy-nine.json");
paired("target/baseline.json", "target/add-a.json");
paired("field/screen-control.json", "field/screen-fixed-a.json");
paired("field/screen-control.json", "field/screen-fixed-b.json");
paired("field/screen-control.json", "steps/field-add-a.json");
paired("steps/duel-control.json", "steps/duel-add-a.json");
paired("steps/duel-control.json", "steps/duel-sub-a.json");
paired("holdout/field-smart.json", "holdout/field-add-a.json");
paired("holdout/field-m050.json", "holdout/field-add-a.json");
paired("holdout/duel-smart.json", "holdout/duel-add-a.json");
paired("holdout/field-add-a.json", "holdout/field-add-a-phase-30.json");
paired("holdout/field-m050.json", "holdout/field-add-a-phase-30.json");
paired("holdout/duel-add-a.json", "holdout/duel-add-a-phase-30.json");
paired("defense/field-screen-m050-control.json", "defense/captured-toggle-counter-field-screen.json");
paired("defense/m050-control.json", "defense/captured-toggle-counter-duel.json");
paired("defense/holdout-field-m050.json", "defense/holdout-field-captured.json");
paired("defense/holdout-duel-m050.json", "defense/holdout-duel-captured.json");
