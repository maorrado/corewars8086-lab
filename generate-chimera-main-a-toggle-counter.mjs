import fs from "node:fs";

let code = fs.readFileSync("final/ChimeraA.asm", "utf8");
if (!code.includes("Chimera A (m050)")) throw new Error("unexpected ChimeraA source version");
const edits = [
  ["    mov ax, 0F9EBh", "    mov ax, 0D531h"],
  ["    mov dx, 0CCCCh", "    mov dx, 02F29h"],
  ["    mov bx, 026FFh", "    mov bx, 0CCCCh"],
  ["    mov cx, 05D13h", "    mov cx, 0CCCCh"],
];
for (const [before, after] of edits) {
  if (code.split(before).length !== 2) throw new Error(`expected one ${before}`);
  code = code.replace(before, after);
}
const dir = "candidates/generated/chimera-main-a-toggle-counter";
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(`${dir}/ChimeraA.asm`, code);
const smart = JSON.parse(fs.readFileSync("config-smart-counter-joint-smart.json", "utf8")).candidate;
const team = { name: "COD_Main_A_Toggle_Counter", warriors: ["build/chimera-main-a-toggle-counter/ChimeraA", "build/m050-repro/ab_pad_b"] };
const duel = JSON.parse(fs.readFileSync("config-smart-defense-duel-m050-control.json", "utf8"));
duel.experimentId = "main-a-toggle-counter-duel";
duel.outputPath = "experiments/smart-counter-2026-09-30/defense/main-a-toggle-counter-duel.json";
duel.runDirectory = "build/official-runs/smart-counter-2026-09-30/defense/main-a-toggle-counter-duel";
duel.candidate = team;
duel.cohorts = [{ id: "vs-smart", opponents: [smart] }];
fs.writeFileSync("config-main-a-toggle-counter-duel.json", `${JSON.stringify(duel, null, 2)}\n`);
const field = JSON.parse(fs.readFileSync("config-smart-defense-field-screen-m050-control.json", "utf8"));
field.experimentId = "main-a-toggle-counter-field-screen";
field.outputPath = "experiments/smart-counter-2026-09-30/defense/main-a-toggle-counter-field-screen.json";
field.runDirectory = "build/official-runs/smart-counter-2026-09-30/defense/main-a-toggle-counter-field-screen";
field.candidate = team;
fs.writeFileSync("config-main-a-toggle-counter-field-screen.json", `${JSON.stringify(field, null, 2)}\n`);
