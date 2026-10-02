import fs from "node:fs";

const fieldTemplate = JSON.parse(fs.readFileSync("config-smart-holdout-field-add-a.json", "utf8"));
const duelTemplate = JSON.parse(fs.readFileSync("config-smart-holdout-duel-add-a.json", "utf8"));
const teams = {
  smart: JSON.parse(fs.readFileSync("config-smart-holdout-field-smart.json", "utf8")).candidate,
  "add-a": { name: "COD_add_a", warriors: ["build/smart-step-operators/add-a/A", "build/smart-step-operators/add-a/B"] },
  "add-a-phase30": { name: "COD_add_a_phase30", warriors: ["build/smart-step-operators/add-a/A", "build/chimera-smartb-phase-sweep/SmartB-30"] },
  "add-both": { name: "COD_add_both", warriors: ["build/smart-step-operators/add-both/A", "build/smart-step-operators/add-both/B"] },
  m050: JSON.parse(fs.readFileSync("config-smart-holdout-field-m050.json", "utf8")).candidate,
};

for (const [name, team] of Object.entries(teams)) {
  const field = structuredClone(fieldTemplate);
  field.experimentId = `smart-addboth-fresh-field-${name}`;
  field.outputPath = `experiments/smart-counter-2026-09-30/addboth-holdout/field-${name}.json`;
  field.runDirectory = `build/official-runs/smart-counter-2026-09-30/addboth-holdout/field-${name}`;
  field.candidate = team;
  field.seeds = ["smart-addboth-field-20260930-a", "smart-addboth-field-20260930-b"];
  fs.writeFileSync(`config-smart-addboth-holdout-field-${name}.json`, `${JSON.stringify(field, null, 2)}\n`);
  if (name === "m050") continue;
  const duel = structuredClone(duelTemplate);
  duel.experimentId = `smart-addboth-fresh-duel-${name}`;
  duel.outputPath = `experiments/smart-counter-2026-09-30/addboth-holdout/duel-${name}.json`;
  duel.runDirectory = `build/official-runs/smart-counter-2026-09-30/addboth-holdout/duel-${name}`;
  duel.candidate = team;
  duel.seeds = ["smart-addboth-duel-20260930-a", "smart-addboth-duel-20260930-b", "smart-addboth-duel-20260930-c", "smart-addboth-duel-20260930-d"];
  fs.writeFileSync(`config-smart-addboth-holdout-duel-${name}.json`, `${JSON.stringify(duel, null, 2)}\n`);
}
