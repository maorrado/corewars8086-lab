import fs from "node:fs";

const fieldTemplate = JSON.parse(fs.readFileSync("config-good-test-good_test-holdout.json", "utf8"));
const duelTemplate = JSON.parse(fs.readFileSync("config-smart-defense-duel-m050-control.json", "utf8"));
const smart = JSON.parse(fs.readFileSync("config-smart-duel-baseline.json", "utf8")).candidate;
const addA = JSON.parse(fs.readFileSync("config-smart-step-duel-add-a.json", "utf8")).candidate;
const teams = {
  control: duelTemplate.candidate,
  a3400: JSON.parse(fs.readFileSync("config-m050-a-step-duel-3400.json", "utf8")).candidate,
  a3800: JSON.parse(fs.readFileSync("config-m050-a-step-duel-3800.json", "utf8")).candidate,
};
for (const [name, team] of Object.entries(teams)) {
  const field = structuredClone(fieldTemplate);
  field.experimentId = `m050-a-step-holdout-field-${name}`;
  field.outputPath = `experiments/smart-counter-2026-09-30/defense/a-step-holdout-field-${name}.json`;
  field.runDirectory = `build/official-runs/smart-counter-2026-09-30/defense/a-step-holdout-field-${name}`;
  field.candidate = team;
  field.battles = 50;
  field.seeds = ["m050-a-step-field-holdout-20260930-a", "m050-a-step-field-holdout-20260930-b"];
  fs.writeFileSync(`config-m050-a-step-holdout-field-${name}.json`, `${JSON.stringify(field, null, 2)}\n`);
  const duel = structuredClone(duelTemplate);
  duel.experimentId = `m050-a-step-holdout-duel-${name}`;
  duel.outputPath = `experiments/smart-counter-2026-09-30/defense/a-step-holdout-duel-${name}.json`;
  duel.runDirectory = `build/official-runs/smart-counter-2026-09-30/defense/a-step-holdout-duel-${name}`;
  duel.candidate = team;
  duel.cohorts = [{ id: "vs-smart", opponents: [smart] }, { id: "vs-add-a", opponents: [addA] }];
  duel.battles = 250;
  duel.seeds = ["m050-a-step-duel-holdout-20260930-a", "m050-a-step-duel-holdout-20260930-b", "m050-a-step-duel-holdout-20260930-c", "m050-a-step-duel-holdout-20260930-d"];
  fs.writeFileSync(`config-m050-a-step-holdout-duel-${name}.json`, `${JSON.stringify(duel, null, 2)}\n`);
}
