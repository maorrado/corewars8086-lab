import fs from "node:fs";

const original = fs.readFileSync("final/ChimeraB.asm", "utf8");
if (!original.includes("Chimera B (m050)")) throw new Error("unexpected final ChimeraB version");
const smart = JSON.parse(fs.readFileSync("config-smart-counter-joint-smart.json", "utf8")).candidate;
const duelTemplate = JSON.parse(fs.readFileSync("config-smart-defense-duel-m050-control.json", "utf8"));
const fieldTemplate = JSON.parse(fs.readFileSync("config-smart-defense-field-screen-m050-control.json", "utf8"));
const sourceDir = "candidates/generated/m050-b-phase-defense";
fs.mkdirSync(sourceDir, { recursive: true });
for (const phase of [0x28, 0x2c, 0x30, 0x38, 0x3c, 0x40]) {
  const id = phase.toString(16).padStart(2, "0");
  const source = original.replace("    add ah, 034h", `    add ah, 0${id.toUpperCase()}h`);
  if (source === original) throw new Error(`missing phase edit ${id}`);
  fs.writeFileSync(`${sourceDir}/ChimeraB-${id}.asm`, source);
  const team = { name: `COD_m050_B_phase_${id}`, warriors: ["build/m050-repro/ab_pad_a", `build/m050-b-phase-defense/ChimeraB-${id}`] };
  const duel = structuredClone(duelTemplate);
  duel.experimentId = `m050-b-phase-duel-${id}`;
  duel.outputPath = `experiments/smart-counter-2026-09-30/defense/m050-phase-duel-${id}.json`;
  duel.runDirectory = `build/official-runs/smart-counter-2026-09-30/defense/m050-phase-duel-${id}`;
  duel.candidate = team;
  duel.cohorts = [{ id: "vs-smart", opponents: [smart] }];
  duel.battles = 125;
  fs.writeFileSync(`config-m050-b-phase-duel-${id}.json`, `${JSON.stringify(duel, null, 2)}\n`);
  const field = structuredClone(fieldTemplate);
  field.experimentId = `m050-b-phase-field-${id}`;
  field.outputPath = `experiments/smart-counter-2026-09-30/defense/m050-phase-field-${id}.json`;
  field.runDirectory = `build/official-runs/smart-counter-2026-09-30/defense/m050-phase-field-${id}`;
  field.candidate = team;
  fs.writeFileSync(`config-m050-b-phase-field-${id}.json`, `${JSON.stringify(field, null, 2)}\n`);
}
