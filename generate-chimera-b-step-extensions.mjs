import fs from "node:fs";

const original = fs.readFileSync("final/ChimeraB.asm", "utf8").replaceAll("\r\n", "\n");
if (!original.includes("Chimera B (m050)")) throw new Error("unexpected final ChimeraB version");
const variants = ["xor", "add", "sub"];
const sourceDir = "candidates/generated/chimera-b-step-extensions";
fs.mkdirSync(sourceDir, { recursive: true });
const smart = JSON.parse(fs.readFileSync("config-smart-counter-joint-smart.json", "utf8")).candidate;
const duelTemplate = JSON.parse(fs.readFileSync("config-smart-defense-duel-m050-control.json", "utf8"));
const fieldTemplate = JSON.parse(fs.readFileSync("config-smart-defense-field-screen-m050-control.json", "utf8"));
for (const operator of variants) {
  let code = original;
  const edits = [
    ["    mov cx, 9\n    rep movsw", "    mov cx, 10\n    rep movsw"],
    ["    mov cl, 9", "    mov cl, 10"],
    ["    sub sp, dx\n    sub [bx], bp", `    sub sp, dx\n    ${operator} bp, dx\n    sub [bx], bp`],
  ];
  for (const [before, after] of edits) {
    if (code.split(before).length !== 2) throw new Error(`expected one ${before} in ${operator}`);
    code = code.replace(before, after);
  }
  fs.writeFileSync(`${sourceDir}/ChimeraB-${operator}.asm`, code);
  const team = { name: `COD_m050_B_${operator}`, warriors: ["build/m050-repro/ab_pad_a", `build/chimera-b-step-extensions/ChimeraB-${operator}`] };
  const duel = structuredClone(duelTemplate);
  duel.experimentId = `m050-b-extension-duel-${operator}`;
  duel.outputPath = `experiments/smart-counter-2026-09-30/defense/extension-duel-${operator}.json`;
  duel.runDirectory = `build/official-runs/smart-counter-2026-09-30/defense/extension-duel-${operator}`;
  duel.candidate = team;
  duel.cohorts = [{ id: "vs-smart", opponents: [smart] }];
  duel.battles = 125;
  fs.writeFileSync(`config-m050-b-extension-duel-${operator}.json`, `${JSON.stringify(duel, null, 2)}\n`);
  const field = structuredClone(fieldTemplate);
  field.experimentId = `m050-b-extension-field-${operator}`;
  field.outputPath = `experiments/smart-counter-2026-09-30/defense/extension-field-${operator}.json`;
  field.runDirectory = `build/official-runs/smart-counter-2026-09-30/defense/extension-field-${operator}`;
  field.candidate = team;
  fs.writeFileSync(`config-m050-b-extension-field-${operator}.json`, `${JSON.stringify(field, null, 2)}\n`);
}
