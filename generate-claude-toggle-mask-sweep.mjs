import fs from "node:fs";

const original = {
  A: fs.readFileSync("candidates/generated/claude-fixed-toggle-2026-09-30/A.asm", "utf8"),
  B: fs.readFileSync("candidates/generated/claude-fixed-toggle-2026-09-30/B.asm", "utf8"),
};
const masks = ["0800", "1000", "1800", "2000", "2800", "3000", "5000", "6000", "7000"];
const template = JSON.parse(fs.readFileSync("config-smart-defense-field-screen-m050-control.json", "utf8"));
for (const mask of masks) {
  const directory = `candidates/generated/claude-toggle-mask-sweep/${mask}`;
  fs.mkdirSync(directory, { recursive: true });
  for (const warrior of ["A", "B"]) {
    const source = original[warrior].replace("xor bp, 02000h", `xor bp, 0${mask}h`);
    if (source === original[warrior] && mask !== "2000") throw new Error(`missing mask in ${warrior}`);
    fs.writeFileSync(`${directory}/${warrior}.asm`, source);
  }
  const config = structuredClone(template);
  config.experimentId = `claude-mask-screen-${mask}`;
  config.outputPath = `experiments/smart-counter-2026-09-30/claude-toggle-mask/screen-${mask}.json`;
  config.runDirectory = `build/official-runs/smart-counter-2026-09-30/claude-toggle-mask/screen-${mask}`;
  config.candidate = { name: `COD_claude_mask_${mask}`, warriors: [`build/claude-toggle-mask-sweep/${mask}/A`, `build/claude-toggle-mask-sweep/${mask}/B`] };
  fs.writeFileSync(`config-claude-toggle-mask-screen-${mask}.json`, `${JSON.stringify(config, null, 2)}\n`);
}
