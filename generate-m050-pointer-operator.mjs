import fs from "node:fs";

const baseA = fs.readFileSync("final/ChimeraA.asm", "utf8");
const baseB = fs.readFileSync("final/ChimeraB.asm", "utf8");
const variants = {
  "add-a": ["add", "sub"],
  "add-b": ["sub", "add"],
  "add-both": ["add", "add"],
  "xor-a": ["xor", "sub"],
  "xor-b": ["sub", "xor"],
  "xor-both": ["xor", "xor"],
  "sbb-a": ["sbb", "sub"],
  "sbb-b": ["sub", "sbb"],
  "sbb-both": ["sbb", "sbb"],
  "adc-a": ["adc", "sub"],
  "adc-b": ["sub", "adc"],
  "adc-both": ["adc", "adc"],
};
const duelTemplate = JSON.parse(fs.readFileSync("config-smart-defense-duel-m050-control.json", "utf8"));
const fieldTemplate = JSON.parse(fs.readFileSync("config-smart-defense-field-screen-m050-control.json", "utf8"));
for (const [name, [operatorA, operatorB]] of Object.entries(variants)) {
  const sourceDirectory = `candidates/generated/m050-pointer-operator/${name}`;
  fs.mkdirSync(sourceDirectory, { recursive: true });
  for (const [warrior, original, operator] of [["A", baseA, operatorA], ["B", baseB, operatorB]]) {
    const source = original.replace(/    sub \[bx\], bp\r?\n/, `    ${operator} [bx], bp\n`);
    if (source === original && operator !== "sub") throw new Error(`missing pointer operation for ${name}/${warrior}`);
    fs.writeFileSync(`${sourceDirectory}/${warrior}.asm`, source);
  }
  const candidate = { name: `COD_ptr_${name.replaceAll("-", "_")}`, warriors: [`build/m050-pointer-operator/${name}/A`, `build/m050-pointer-operator/${name}/B`] };
  for (const [kind, template] of [["field", fieldTemplate], ["duel", duelTemplate]]) {
    const config = structuredClone(template);
    config.experimentId = `m050-pointer-${kind}-${name}`;
    config.outputPath = `experiments/smart-counter-2026-09-30/pointer-operator/${kind}-${name}.json`;
    config.runDirectory = `build/official-runs/smart-counter-2026-09-30/pointer-operator/${kind}-${name}`;
    config.candidate = candidate;
    fs.writeFileSync(`config-m050-pointer-${kind}-${name}.json`, `${JSON.stringify(config, null, 2)}\n`);
  }
}
