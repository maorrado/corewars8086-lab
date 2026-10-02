import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceDir = path.join(root, "candidates", "generated", "chimera-branchless-dual");
const baseA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const baseB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const targetedTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-m050-hard-control-targeted.json"), "utf8"));
const tuneTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));

function mutateA(id, anchorWord, diversify) {
  let source = baseA
    .replace(/; Chimera A \(m049\):[^\r\n]*/, `; Experimental m050 A: ${id}.`)
    .replace("mov bx, 00280h", "mov bx, 00207h")
    .replace("mov ax, 01FFFh", `mov ax, ${anchorWord}${diversify ? "\r\n    xor ah, bl" : ""}`);
  if (!source.includes("mov bx, 00207h")) throw new Error(`failed pointer rewrite for ${id}`);
  return source;
}

const variants = [
  { id: "ptr_control", anchorWord: "01FFFh", diversify: false },
  { id: "main_old", anchorWord: "01FFFh", diversify: true },
  { id: "main_new", anchorWord: "018FFh", diversify: true },
];

fs.mkdirSync(sourceDir, { recursive: true });
for (const variant of variants) {
  fs.writeFileSync(path.join(sourceDir, `${variant.id}_a.asm`), mutateA(variant.id, variant.anchorWord, variant.diversify), "utf8");
  fs.writeFileSync(path.join(sourceDir, `${variant.id}_b.asm`), baseB, "utf8");
  for (const [gate, template, battles, seeds] of [
    ["targeted", targetedTemplate, 40, ["m050-bdual-target-001", "m050-bdual-target-002"]],
    ["tune", tuneTemplate, 20, ["m050-bdual-tune-001", "m050-bdual-tune-002"]],
  ]) {
    const experimentId = `m050-bdual-${variant.id}-${gate}-r1`;
    const config = structuredClone(template);
    config.experimentId = experimentId;
    config.outputPath = `experiments/m050-search/${experimentId}.json`;
    config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
    config.battles = battles;
    config.seeds = seeds;
    config.candidate = {
      name: `COD_${variant.id}`,
      warriors: [
        `build/chimera-branchless-dual/${variant.id}_a`,
        `build/chimera-branchless-dual/${variant.id}_b`,
      ],
    };
    fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  }
}

for (const [gate, template, battles, seeds] of [
  ["targeted", targetedTemplate, 40, ["m050-bdual-target-001", "m050-bdual-target-002"]],
  ["tune", tuneTemplate, 20, ["m050-bdual-tune-001", "m050-bdual-tune-002"]],
]) {
  const experimentId = `m050-bdual-control-${gate}-r1`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = battles;
  config.seeds = seeds;
  config.candidate = { name: "COD_m049_control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${variants.length} branchless dual-anchor variants`);
