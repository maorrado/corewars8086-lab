import fs from "node:fs";

const source = fs.readFileSync("final/ChimeraB.asm", "utf8");
if (!source.includes("Chimera B (m050)")) throw new Error("unexpected ChimeraB source version");
const substitutions = [
  ["    mov ax, 0F9EBh", "    mov ax, 0D531h"],
  ["    mov dx, 0CCCCh", "    mov dx, 02F29h"],
  ["    mov bx, 026FFh", "    mov bx, 0CCCCh"],
  ["    mov cx, 05D13h", "    mov cx, 0CCCCh"],
];
let antiSmart = source;
for (const [before, after] of substitutions) {
  if (antiSmart.split(before).length !== 2) throw new Error(`expected one ${before}`);
  antiSmart = antiSmart.replace(before, after);
}
const sourceDirectory = "candidates/generated/chimera-toggle-counter";
fs.mkdirSync(sourceDirectory, { recursive: true });
fs.writeFileSync(`${sourceDirectory}/ChimeraB.asm`, antiSmart);

const smart = JSON.parse(fs.readFileSync("config-smart-counter-joint-smart.json", "utf8")).candidate;
const duo = JSON.parse(fs.readFileSync("config-smart-duel-baseline.json", "utf8"));
duo.experimentId = "chimera-toggle-counter-duel";
duo.outputPath = "experiments/smart-counter-2026-09-30/defense/toggle-counter-duel.json";
duo.runDirectory = "build/official-runs/smart-counter-2026-09-30/defense/toggle-counter-duel";
duo.candidate = { name: "COD_Chimera_Toggle_Counter", warriors: ["build/m050-repro/ab_pad_a", "build/chimera-toggle-counter/ChimeraB"] };
duo.cohorts = [{ id: "vs-smart", opponents: [smart] }];
fs.writeFileSync("config-chimera-toggle-counter-duel.json", `${JSON.stringify(duo, null, 2)}\n`);

const field = JSON.parse(fs.readFileSync("config-smart-counter-field-m050.json", "utf8"));
field.experimentId = "chimera-toggle-counter-field-screen";
field.outputPath = "experiments/smart-counter-2026-09-30/defense/toggle-counter-field-screen.json";
field.runDirectory = "build/official-runs/smart-counter-2026-09-30/defense/toggle-counter-field-screen";
field.candidate = duo.candidate;
field.battles = 25;
field.cohorts = field.cohorts.slice(0, 10);
fs.writeFileSync("config-chimera-toggle-counter-field-screen.json", `${JSON.stringify(field, null, 2)}\n`);
