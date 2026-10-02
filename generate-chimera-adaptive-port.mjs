import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceDir = path.join(root, "candidates", "generated", "chimera-adaptive-port");
const baseA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const baseB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const tuneTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));

const variants = [
  { id: "n040", mode: "xor", mask: 0x18, band: 0x48, mainPhase: 0x10, capturedPhase: 0x34 },
  { id: "n008", mode: "add", mask: 0x18, band: 0x38, mainPhase: 0x08, capturedPhase: 0x34 },
  { id: "n020", mode: "add", mask: 0x18, band: 0x48, mainPhase: 0x08, capturedPhase: 0x34 },
  { id: "n041", mode: "xor", mask: 0x1c, band: 0x48, mainPhase: 0x10, capturedPhase: 0x34 },
];

const h8 = (value) => `0${value.toString(16).toUpperCase().padStart(2, "0")}h`;
function block(band, phase, mask, mode) {
  return `    mov bl, ah\r
    mov al, ah\r
    xor ah, ah\r
    mov ch, ${h8(band)}\r
    div ch\r
    mul ch\r
    mov ah, al\r
    add ah, ${h8(phase)}\r
    and bl, ${h8(mask)}\r
    ${mode} ah, bl\r
    mov al, 0A2h`;
}

function port(variant) {
  let source = baseA
    .replace(/; Chimera A \(m049\):[^\r\n]*/, `; Experimental m050 A: m049 with ported adaptive ${variant.id} phase dispersion.`)
    .replace(
      /    mov al, ah\r?\n    xor ah, ah\r?\n    mov ch, 03Ch\r?\n    div ch\r?\n    mul ch\r?\n    mov ah, al\r?\n    add ah, 0(10|54)h\r?\n    mov al, 0A2h/g,
      (_match, phase) => block(
        variant.band,
        phase === "10" ? variant.mainPhase : variant.capturedPhase,
        variant.mask,
        variant.mode,
      ),
    );
  if (!source.includes(`${variant.mode} ah, bl`) || source.includes("add ah, 054h")) {
    throw new Error(`failed adaptive port ${variant.id}`);
  }
  return source;
}

fs.mkdirSync(sourceDir, { recursive: true });
for (const variant of variants) {
  fs.writeFileSync(path.join(sourceDir, `${variant.id}_a.asm`), port(variant), "utf8");
  fs.writeFileSync(path.join(sourceDir, `${variant.id}_b.asm`), baseB, "utf8");
  const experimentId = `m050-adapt-${variant.id}-tune-screen-r1`;
  const config = structuredClone(tuneTemplate);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 10;
  config.seeds = ["m050-adapt-port-001", "m050-adapt-port-002"];
  config.candidate = {
    name: `COD_adapt_${variant.id}`,
    warriors: [`build/chimera-adaptive-port/${variant.id}_a`, `build/chimera-adaptive-port/${variant.id}_b`],
  };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

const control = structuredClone(tuneTemplate);
control.experimentId = "m050-adapt-control-tune-screen-r1";
control.outputPath = "experiments/m050-search/m050-adapt-control-tune-screen-r1.json";
control.runDirectory = "build/official-runs/m050-search/m050-adapt-control-tune-screen-r1";
control.battles = 10;
control.seeds = ["m050-adapt-port-001", "m050-adapt-port-002"];
control.candidate = { name: "COD_m049_control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] };
fs.writeFileSync(path.join(root, "config-m050-adapt-control-tune-screen-r1.json"), `${JSON.stringify(control, null, 2)}\n`, "utf8");

console.log(`generated ${variants.length} adaptive m049 ports`);
