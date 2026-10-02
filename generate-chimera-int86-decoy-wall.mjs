import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceDir = path.join(root, "candidates", "generated", "chimera-int86-decoy-wall");
const baseA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const baseB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const tuneTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const targetTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-m050-hard-control-targeted.json"), "utf8"));

function addWall(source, dual, label) {
  const oldBlock = `    mov ax, 0F9EBh\r
    mov dx, 0CCCCh\r
    mov bx, 026FFh\r
    mov cx, 05D13h\r
    std\r
    int 087h`;
  const secondWall = dual
    ? `\r
    mov dx, 01FFFh\r
    int 086h\r
    mov dx, 0CCCCh`
    : "";
  const newBlock = `    mov ax, 01FFFh\r
    mov dx, 0CCCCh\r
    std\r
    int 086h${secondWall}\r
    mov ax, 0F9EBh\r
    mov bx, 026FFh\r
    mov cx, 05D13h\r
    int 087h`;
  const result = source
    .replace(/; Chimera ([AB]) \(m049\):[^\r\n]*/, `; Experimental m050 $1: ${label} INT86 decoy wall before INT87.`)
    .replace(oldBlock, newBlock);
  if (result === source || !result.includes("int 086h")) throw new Error(`failed to add ${label}`);
  return result;
}

const variants = [
  { id: "wall_a", wallA: true, wallB: false, dual: false },
  { id: "wall_b", wallA: false, wallB: true, dual: false },
  { id: "wall_ab", wallA: true, wallB: true, dual: false },
  { id: "dual_b", wallA: false, wallB: true, dual: true },
  { id: "dual_ab", wallA: true, wallB: true, dual: true },
];

fs.mkdirSync(sourceDir, { recursive: true });
for (const variant of variants) {
  fs.writeFileSync(path.join(sourceDir, `${variant.id}_a.asm`), variant.wallA ? addWall(baseA, variant.dual, variant.id) : baseA, "utf8");
  fs.writeFileSync(path.join(sourceDir, `${variant.id}_b.asm`), variant.wallB ? addWall(baseB, variant.dual, variant.id) : baseB, "utf8");
  for (const [gate, template, battles, seeds] of [
    ["targeted", targetTemplate, 20, ["m050-wall-target-001", "m050-wall-target-002"]],
    ["tune", tuneTemplate, 10, ["m050-wall-tune-001", "m050-wall-tune-002"]],
  ]) {
    const experimentId = `m050-wall-${variant.id}-${gate}-r1`;
    const config = structuredClone(template);
    config.experimentId = experimentId;
    config.outputPath = `experiments/m050-search/${experimentId}.json`;
    config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
    config.battles = battles;
    config.seeds = seeds;
    config.candidate = {
      name: `COD_wall_${variant.id}`,
      warriors: [`build/chimera-int86-decoy-wall/${variant.id}_a`, `build/chimera-int86-decoy-wall/${variant.id}_b`],
    };
    fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  }
}

for (const [gate, template, battles, seeds] of [
  ["targeted", targetTemplate, 20, ["m050-wall-target-001", "m050-wall-target-002"]],
  ["tune", tuneTemplate, 10, ["m050-wall-tune-001", "m050-wall-tune-002"]],
]) {
  const experimentId = `m050-wall-control-${gate}-r1`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = battles;
  config.seeds = seeds;
  config.candidate = { name: "COD_m049_control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${variants.length} INT86 decoy-wall variants`);
