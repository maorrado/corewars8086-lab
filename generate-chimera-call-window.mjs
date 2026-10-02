import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceDir = path.join(root, "candidates", "generated", "chimera-call-window");
const baseA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const baseB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const tuneTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const targetedTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-m050-hard-control-targeted.json"), "utf8"));

function closeWindow(source, label) {
  let result = source
    .replace(/; Chimera ([AB]) \(m049\):[^\r\n]*/, `; Experimental m050 $1: anchor write immediately followed by CALL (${label}).`)
    .replaceAll("    stosw\r\n    dec di\r\n    call far [bx]", "    stosw\r\n    call far [bx]")
    .replace("worker:\r\n    movsw", "worker:\r\n    dec di\r\n    movsw");
  if ((result.match(/\n    dec di\r?\n/g) ?? []).length !== 1) throw new Error(`unexpected DEC DI count for ${label}`);
  return result;
}

const variants = [
  { id: "move_a", moveA: true, moveB: false },
  { id: "move_b", moveA: false, moveB: true },
  { id: "move_ab", moveA: true, moveB: true },
];

fs.mkdirSync(sourceDir, { recursive: true });
for (const variant of variants) {
  fs.writeFileSync(path.join(sourceDir, `${variant.id}_a.asm`), variant.moveA ? closeWindow(baseA, variant.id) : baseA, "utf8");
  fs.writeFileSync(path.join(sourceDir, `${variant.id}_b.asm`), variant.moveB ? closeWindow(baseB, variant.id) : baseB, "utf8");
  for (const [gate, template, battles, seeds] of [
    ["targeted", targetedTemplate, 40, ["m050-window-target-001", "m050-window-target-002"]],
    ["tune", tuneTemplate, 20, ["m050-window-tune-001", "m050-window-tune-002"]],
  ]) {
    const experimentId = `m050-window-${variant.id}-${gate}-r1`;
    const config = structuredClone(template);
    config.experimentId = experimentId;
    config.outputPath = `experiments/m050-search/${experimentId}.json`;
    config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
    config.battles = battles;
    config.seeds = seeds;
    config.candidate = {
      name: `COD_${variant.id}`,
      warriors: [
        `build/chimera-call-window/${variant.id}_a`,
        `build/chimera-call-window/${variant.id}_b`,
      ],
    };
    fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  }
}

for (const [gate, template, battles, seeds] of [
  ["targeted", targetedTemplate, 40, ["m050-window-target-001", "m050-window-target-002"]],
  ["tune", tuneTemplate, 20, ["m050-window-tune-001", "m050-window-tune-002"]],
]) {
  const experimentId = `m050-window-control-${gate}-r1`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = battles;
  config.seeds = seeds;
  config.candidate = { name: "COD_m049_control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${variants.length} call-window variants`);
