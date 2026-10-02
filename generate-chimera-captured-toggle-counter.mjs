import fs from "node:fs";

const source = fs.readFileSync("final/ChimeraA.asm", "utf8");
if (!source.includes("Chimera A (m050)")) throw new Error("unexpected ChimeraA source version");
const replacements = [
  ["    mov ax, 0A5F3h", "    mov ax, 0D531h"],
  ["    mov dx, 01F06h", "    mov dx, 02F29h"],
];
let patched = source;
for (const [before, after] of replacements) {
  if (patched.split(before).length !== 2) throw new Error(`expected one ${before}`);
  patched = patched.replace(before, after);
}
const dir = "candidates/generated/chimera-captured-toggle-counter";
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(`${dir}/ChimeraA.asm`, patched);

const smart = JSON.parse(fs.readFileSync("config-smart-counter-joint-smart.json", "utf8")).candidate;
const team = { name: "COD_Captured_Toggle_Counter", warriors: ["build/chimera-captured-toggle-counter/ChimeraA", "build/m050-repro/ab_pad_b"] };
const duel = JSON.parse(fs.readFileSync("config-smart-defense-duel-m050-control.json", "utf8"));
duel.experimentId = "captured-toggle-counter-duel";
duel.outputPath = "experiments/smart-counter-2026-09-30/defense/captured-toggle-counter-duel.json";
duel.runDirectory = "build/official-runs/smart-counter-2026-09-30/defense/captured-toggle-counter-duel";
duel.candidate = team;
duel.cohorts = [{ id: "vs-smart", opponents: [smart] }];
fs.writeFileSync("config-captured-toggle-counter-duel.json", `${JSON.stringify(duel, null, 2)}\n`);

const field = JSON.parse(fs.readFileSync("config-smart-defense-field-screen-m050-control.json", "utf8"));
field.experimentId = "captured-toggle-counter-field-screen";
field.outputPath = "experiments/smart-counter-2026-09-30/defense/captured-toggle-counter-field-screen.json";
field.runDirectory = "build/official-runs/smart-counter-2026-09-30/defense/captured-toggle-counter-field-screen";
field.candidate = team;
fs.writeFileSync("config-captured-toggle-counter-field-screen.json", `${JSON.stringify(field, null, 2)}\n`);
