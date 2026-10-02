import fs from "node:fs";

const fieldTemplate = JSON.parse(fs.readFileSync("config-good-test-good_test-holdout.json", "utf8"));
const duelTemplate = JSON.parse(fs.readFileSync("config-smart-duel-baseline.json", "utf8"));
const m049 = duelTemplate.cohorts[0].opponents[0];
const m050 = duelTemplate.cohorts[1].opponents[0];
const smart = duelTemplate.candidate;
const addA = JSON.parse(fs.readFileSync("config-smart-step-duel-add-a.json", "utf8")).candidate;
const subA = JSON.parse(fs.readFileSync("config-smart-step-duel-sub-a.json", "utf8")).candidate;
const teams = { smart, "add-a": addA, "sub-a": subA, m050 };
for (const [name, team] of Object.entries(teams)) {
  const field = structuredClone(fieldTemplate);
  field.experimentId = `smart-holdout-field-${name}`;
  field.outputPath = `experiments/smart-counter-2026-09-30/holdout/field-${name}.json`;
  field.runDirectory = `build/official-runs/smart-counter-2026-09-30/holdout/field-${name}`;
  field.candidate = team;
  field.battles = 50;
  field.seeds = ["smart-field-holdout-20260930-a", "smart-field-holdout-20260930-b"];
  fs.writeFileSync(`config-smart-holdout-field-${name}.json`, `${JSON.stringify(field, null, 2)}\n`);
}
for (const [name, team] of Object.entries({ smart, "add-a": addA, "sub-a": subA })) {
  const duel = structuredClone(duelTemplate);
  duel.experimentId = `smart-holdout-duel-${name}`;
  duel.outputPath = `experiments/smart-counter-2026-09-30/holdout/duel-${name}.json`;
  duel.runDirectory = `build/official-runs/smart-counter-2026-09-30/holdout/duel-${name}`;
  duel.candidate = team;
  duel.cohorts = [{ id: "vs-m049", opponents: [m049] }, { id: "vs-m050", opponents: [m050] }];
  duel.battles = 250;
  duel.seeds = ["smart-duel-holdout-20260930-a", "smart-duel-holdout-20260930-b", "smart-duel-holdout-20260930-c", "smart-duel-holdout-20260930-d"];
  fs.writeFileSync(`config-smart-holdout-duel-${name}.json`, `${JSON.stringify(duel, null, 2)}\n`);
}
