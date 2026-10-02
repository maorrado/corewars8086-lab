import fs from "node:fs";

const sources = [
  fs.readFileSync("candidates/generated/smart-counter-2026-09-30/SmartA.asm", "utf8"),
  fs.readFileSync("candidates/generated/smart-counter-2026-09-30/SmartB.asm", "utf8"),
];
const variants = {
  "add-both": ["add", "add"],
  "sub-both": ["sub", "sub"],
  "add-a": ["add", "xor"],
  "add-b": ["xor", "add"],
  "sub-a": ["sub", "xor"],
  "sub-b": ["xor", "sub"],
};
const templateDuel = JSON.parse(fs.readFileSync("config-smart-duel-baseline.json", "utf8"));
const templateField = JSON.parse(fs.readFileSync("config-smart-counter-field-smart.json", "utf8"));
const duelControl = structuredClone(templateDuel);
duelControl.experimentId = "smart-step-duel-control";
duelControl.outputPath = "experiments/smart-counter-2026-09-30/steps/duel-control.json";
duelControl.runDirectory = "build/official-runs/smart-counter-2026-09-30/steps/duel-control";
duelControl.battles = 100;
fs.writeFileSync("config-smart-step-duel-control.json", `${JSON.stringify(duelControl, null, 2)}\n`);
for (const [name, operators] of Object.entries(variants)) {
  const dir = `candidates/generated/smart-step-operators/${name}`;
  fs.mkdirSync(dir, { recursive: true });
  for (let index = 0; index < 2; index += 1) {
    const source = sources[index].replace("    xor bp, dx\n", `    ${operators[index]} bp, dx\n`);
    if (source === sources[index] && operators[index] !== "xor") throw new Error(`missing worker step in ${name}/${index}`);
    fs.writeFileSync(`${dir}/${index === 0 ? "A" : "B"}.asm`, source);
  }
  const team = { name: `COD_${name.replaceAll("-", "_")}`, warriors: [`build/smart-step-operators/${name}/A`, `build/smart-step-operators/${name}/B`] };
  const duel = structuredClone(templateDuel);
  duel.experimentId = `smart-step-duel-${name}`;
  duel.outputPath = `experiments/smart-counter-2026-09-30/steps/duel-${name}.json`;
  duel.runDirectory = `build/official-runs/smart-counter-2026-09-30/steps/duel-${name}`;
  duel.candidate = team;
  duel.battles = 100;
  fs.writeFileSync(`config-smart-step-duel-${name}.json`, `${JSON.stringify(duel, null, 2)}\n`);
  const field = structuredClone(templateField);
  field.experimentId = `smart-step-field-${name}`;
  field.outputPath = `experiments/smart-counter-2026-09-30/steps/field-${name}.json`;
  field.runDirectory = `build/official-runs/smart-counter-2026-09-30/steps/field-${name}`;
  field.candidate = team;
  field.battles = 25;
  field.cohorts = field.cohorts.slice(0, 10);
  fs.writeFileSync(`config-smart-step-field-${name}.json`, `${JSON.stringify(field, null, 2)}\n`);
}
