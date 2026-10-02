import fs from "node:fs";

const duelTemplate = JSON.parse(fs.readFileSync("config-captured-toggle-counter-duel.json", "utf8"));
const fieldTemplate = JSON.parse(fs.readFileSync("config-good-test-good_test-holdout.json", "utf8"));
const smart = JSON.parse(fs.readFileSync("config-smart-duel-baseline.json", "utf8")).candidate;
const addA = JSON.parse(fs.readFileSync("config-smart-step-duel-add-a.json", "utf8")).candidate;
const m050 = JSON.parse(fs.readFileSync("config-smart-defense-duel-m050-control.json", "utf8")).candidate;
const captured = duelTemplate.candidate;
for (const [name, team] of Object.entries({ m050, captured })) {
  const duel = structuredClone(duelTemplate);
  duel.experimentId = `captured-toggle-holdout-duel-${name}`;
  duel.outputPath = `experiments/smart-counter-2026-09-30/defense/holdout-duel-${name}.json`;
  duel.runDirectory = `build/official-runs/smart-counter-2026-09-30/defense/holdout-duel-${name}`;
  duel.candidate = team;
  duel.cohorts = [{ id: "vs-smart", opponents: [smart] }, { id: "vs-add-a", opponents: [addA] }];
  duel.battles = 250;
  duel.seeds = ["captured-duel-holdout-20260930-a", "captured-duel-holdout-20260930-b", "captured-duel-holdout-20260930-c", "captured-duel-holdout-20260930-d"];
  fs.writeFileSync(`config-captured-toggle-holdout-duel-${name}.json`, `${JSON.stringify(duel, null, 2)}\n`);

  const field = structuredClone(fieldTemplate);
  field.experimentId = `captured-toggle-holdout-field-${name}`;
  field.outputPath = `experiments/smart-counter-2026-09-30/defense/holdout-field-${name}.json`;
  field.runDirectory = `build/official-runs/smart-counter-2026-09-30/defense/holdout-field-${name}`;
  field.candidate = team;
  field.battles = 50;
  field.seeds = ["captured-field-holdout-20260930-a", "captured-field-holdout-20260930-b"];
  fs.writeFileSync(`config-captured-toggle-holdout-field-${name}.json`, `${JSON.stringify(field, null, 2)}\n`);
}
