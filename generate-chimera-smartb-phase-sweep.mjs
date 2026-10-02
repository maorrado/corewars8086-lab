import fs from "node:fs";

const original = fs.readFileSync("candidates/generated/smart-counter-2026-09-30/SmartB.asm", "utf8");
const duelTemplate = JSON.parse(fs.readFileSync("config-smart-defense-duel-m050-smart-b.json", "utf8"));
const fieldTemplate = JSON.parse(fs.readFileSync("config-smart-defense-field-screen-m050-smart-b.json", "utf8"));
const addADuelTemplate = JSON.parse(fs.readFileSync("config-smart-step-duel-add-a.json", "utf8"));
const addAFieldTemplate = JSON.parse(fs.readFileSync("config-smart-step-field-add-a.json", "utf8"));
for (const phase of [0x28, 0x2c, 0x30, 0x38, 0x3c, 0x40]) {
  const id = phase.toString(16).padStart(2, "0");
  const replacement = `    add ah, 0${id.toUpperCase()}h`;
  const code = original.replace("    add ah, 034h", replacement);
  if (code === original) throw new Error(`expected B phase replacement ${id}`);
  const dir = "candidates/generated/chimera-smartb-phase-sweep";
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/SmartB-${id}.asm`, code);
  const team = { name: `COD_smartb_phase_${id}`, warriors: ["build/m050-repro/ab_pad_a", `build/chimera-smartb-phase-sweep/SmartB-${id}`] };
  const duel = structuredClone(duelTemplate);
  duel.experimentId = `smartb-phase-duel-${id}`;
  duel.outputPath = `experiments/smart-counter-2026-09-30/defense/phase-duel-${id}.json`;
  duel.runDirectory = `build/official-runs/smart-counter-2026-09-30/defense/phase-duel-${id}`;
  duel.candidate = team;
  duel.battles = 125;
  fs.writeFileSync(`config-smartb-phase-duel-${id}.json`, `${JSON.stringify(duel, null, 2)}\n`);
  const field = structuredClone(fieldTemplate);
  field.experimentId = `smartb-phase-field-${id}`;
  field.outputPath = `experiments/smart-counter-2026-09-30/defense/phase-field-${id}.json`;
  field.runDirectory = `build/official-runs/smart-counter-2026-09-30/defense/phase-field-${id}`;
  field.candidate = team;
  fs.writeFileSync(`config-smartb-phase-field-${id}.json`, `${JSON.stringify(field, null, 2)}\n`);

  const addATeam = { name: `COD_add_a_phase_${id}`, warriors: ["build/smart-step-operators/add-a/A", `build/chimera-smartb-phase-sweep/SmartB-${id}`] };
  const addADuel = structuredClone(addADuelTemplate);
  addADuel.experimentId = `add-a-phase-duel-${id}`;
  addADuel.outputPath = `experiments/smart-counter-2026-09-30/steps/add-a-phase-duel-${id}.json`;
  addADuel.runDirectory = `build/official-runs/smart-counter-2026-09-30/steps/add-a-phase-duel-${id}`;
  addADuel.candidate = addATeam;
  fs.writeFileSync(`config-add-a-phase-duel-${id}.json`, `${JSON.stringify(addADuel, null, 2)}\n`);
  const addAField = structuredClone(addAFieldTemplate);
  addAField.experimentId = `add-a-phase-field-${id}`;
  addAField.outputPath = `experiments/smart-counter-2026-09-30/steps/add-a-phase-field-${id}.json`;
  addAField.runDirectory = `build/official-runs/smart-counter-2026-09-30/steps/add-a-phase-field-${id}`;
  addAField.candidate = addATeam;
  fs.writeFileSync(`config-add-a-phase-field-${id}.json`, `${JSON.stringify(addAField, null, 2)}\n`);
}
