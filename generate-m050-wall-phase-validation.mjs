import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceDir = path.join(root, "candidates", "generated", "chimera-phase-control");
const baseA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const baseB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));

fs.mkdirSync(sourceDir, { recursive: true });
for (const phase of ["3C", "40"]) {
  const source = baseB
    .replace(/; Chimera B \(m049\):[^\r\n]*/, `; Experimental m050 B: no wall, phase ${phase}h control.`)
    .replace("    add ah, 034h", `    add ah, 0${phase}h`);
  fs.writeFileSync(path.join(sourceDir, `p${phase}_a.asm`), baseA, "utf8");
  fs.writeFileSync(path.join(sourceDir, `p${phase}_b.asm`), source, "utf8");
}

const variants = [
  { id: "control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] },
  { id: "plain_p3C", warriors: ["build/chimera-phase-control/p3C_a", "build/chimera-phase-control/p3C_b"] },
  { id: "plain_p40", warriors: ["build/chimera-phase-control/p40_a", "build/chimera-phase-control/p40_b"] },
  { id: "pre_p3C", warriors: ["build/chimera-wall-phase-sweep/pre_p3C_a", "build/chimera-wall-phase-sweep/pre_p3C_b"] },
  { id: "pre_p40", warriors: ["build/chimera-wall-phase-sweep/pre_p40_a", "build/chimera-wall-phase-sweep/pre_p40_b"] },
  { id: "post_p40", warriors: ["build/chimera-wall-phase-sweep/post_p40_a", "build/chimera-wall-phase-sweep/post_p40_b"] },
];

for (const variant of variants) {
  const experimentId = `m050-wall-phase-${variant.id}-validate-r2`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 25;
  config.seeds = ["m050-wall-phase-validate-101", "m050-wall-phase-validate-102"];
  config.candidate = { name: `COD_${variant.id}`, warriors: variant.warriors };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${variants.length} full wall/phase validation configs`);
