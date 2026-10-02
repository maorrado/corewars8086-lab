import fs from "node:fs";

const original = fs.readFileSync("final/ChimeraA.asm", "utf8");
if (!original.includes("Chimera A (m050)")) throw new Error("unexpected final ChimeraA version");
const smart = JSON.parse(fs.readFileSync("config-smart-counter-joint-smart.json", "utf8")).candidate;
const duelTemplate = JSON.parse(fs.readFileSync("config-smart-defense-duel-m050-control.json", "utf8"));
const fieldTemplate = JSON.parse(fs.readFileSync("config-smart-defense-field-screen-m050-control.json", "utf8"));
const dir = "candidates/generated/m050-a-phase-defense";
fs.mkdirSync(dir, { recursive: true });
for (const phase of [0x04, 0x08, 0x0c, 0x14, 0x18, 0x1c]) {
  const id = phase.toString(16).padStart(2, "0");
  const code = original.replace("    add ah, 010h", `    add ah, 0${id.toUpperCase()}h`);
  if (code === original) throw new Error(`missing A phase edit ${id}`);
  fs.writeFileSync(`${dir}/ChimeraA-${id}.asm`, code);
  const team = { name: `COD_m050_A_phase_${id}`, warriors: [`build/m050-a-phase-defense/ChimeraA-${id}`, "build/m050-repro/ab_pad_b"] };
  const duel = structuredClone(duelTemplate);
  duel.experimentId = `m050-a-phase-duel-${id}`;
  duel.outputPath = `experiments/smart-counter-2026-09-30/defense/m050-a-phase-duel-${id}.json`;
  duel.runDirectory = `build/official-runs/smart-counter-2026-09-30/defense/m050-a-phase-duel-${id}`;
  duel.candidate = team;
  duel.cohorts = [{ id: "vs-smart", opponents: [smart] }];
  duel.battles = 125;
  fs.writeFileSync(`config-m050-a-phase-duel-${id}.json`, `${JSON.stringify(duel, null, 2)}\n`);
  const field = structuredClone(fieldTemplate);
  field.experimentId = `m050-a-phase-field-${id}`;
  field.outputPath = `experiments/smart-counter-2026-09-30/defense/m050-a-phase-field-${id}.json`;
  field.runDirectory = `build/official-runs/smart-counter-2026-09-30/defense/m050-a-phase-field-${id}`;
  field.candidate = team;
  fs.writeFileSync(`config-m050-a-phase-field-${id}.json`, `${JSON.stringify(field, null, 2)}\n`);
}
