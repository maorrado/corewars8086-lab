import fs from "node:fs";

const fieldTemplate = JSON.parse(fs.readFileSync("config-smart-holdout-field-add-a.json", "utf8"));
const duelTemplate = JSON.parse(fs.readFileSync("config-smart-holdout-duel-add-a.json", "utf8"));
for (const id of ["30", "40"]) {
  const team = JSON.parse(fs.readFileSync(`config-add-a-phase-field-${id}.json`, "utf8")).candidate;
  const field = structuredClone(fieldTemplate);
  field.experimentId = `add-a-phase-holdout-field-${id}`;
  field.outputPath = `experiments/smart-counter-2026-09-30/holdout/field-add-a-phase-${id}.json`;
  field.runDirectory = `build/official-runs/smart-counter-2026-09-30/holdout/field-add-a-phase-${id}`;
  field.candidate = team;
  fs.writeFileSync(`config-add-a-phase-holdout-field-${id}.json`, `${JSON.stringify(field, null, 2)}\n`);
  const duel = structuredClone(duelTemplate);
  duel.experimentId = `add-a-phase-holdout-duel-${id}`;
  duel.outputPath = `experiments/smart-counter-2026-09-30/holdout/duel-add-a-phase-${id}.json`;
  duel.runDirectory = `build/official-runs/smart-counter-2026-09-30/holdout/duel-add-a-phase-${id}`;
  duel.candidate = team;
  fs.writeFileSync(`config-add-a-phase-holdout-duel-${id}.json`, `${JSON.stringify(duel, null, 2)}\n`);
}
