import fs from "node:fs";

const baseA = fs.readFileSync("candidates/generated/smart-counter-2026-09-30/SmartA.asm", "utf8");
const baseB = fs.readFileSync("candidates/generated/smart-counter-2026-09-30/SmartB.asm", "utf8");
const variants = {
  "adc-a": ["adc bp, dx", "xor bp, dx"],
  "sbb-a": ["sbb bp, dx", "xor bp, dx"],
  "adc-b": ["add bp, dx", "adc bp, dx"],
  "sbb-b": ["add bp, dx", "sbb bp, dx"],
  "ror-a": ["ror bp, 1", "xor bp, dx"],
  "ror-b": ["add bp, dx", "ror bp, 1"],
  "adc-both": ["adc bp, dx", "adc bp, dx"],
};
const fieldTemplate = JSON.parse(fs.readFileSync("config-smart-step-field-add-a.json", "utf8"));
const duelTemplate = JSON.parse(fs.readFileSync("config-smart-step-duel-add-a.json", "utf8"));
for (const [name, [opA, opB]] of Object.entries(variants)) {
  const sourceDirectory = `candidates/generated/smart-carry-step/${name}`;
  fs.mkdirSync(sourceDirectory, { recursive: true });
  for (const [warrior, original, operator] of [["A", baseA, opA], ["B", baseB, opB]]) {
    const source = original.replace("    xor bp, dx\n", `    ${operator}\n`);
    if (source === original && operator !== "xor bp, dx") throw new Error(`missing XOR BP for ${name}/${warrior}`);
    fs.writeFileSync(`${sourceDirectory}/${warrior}.asm`, source);
  }
  const team = { name: `COD_carry_${name.replaceAll("-", "_")}`, warriors: [`build/smart-carry-step/${name}/A`, `build/smart-carry-step/${name}/B`] };
  for (const [kind, template] of [["field", fieldTemplate], ["duel", duelTemplate]]) {
    const config = structuredClone(template);
    config.experimentId = `smart-carry-${kind}-${name}`;
    config.outputPath = `experiments/smart-counter-2026-09-30/carry-step/${kind}-${name}.json`;
    config.runDirectory = `build/official-runs/smart-counter-2026-09-30/carry-step/${kind}-${name}`;
    config.candidate = team;
    fs.writeFileSync(`config-smart-carry-${kind}-${name}.json`, `${JSON.stringify(config, null, 2)}\n`);
  }
}
