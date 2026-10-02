import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const all = JSON.parse(fs.readFileSync(path.join(root, "config-2025-all-template.json"), "utf8"));
const tune = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const variants = [
  { id: "control", name: "COD_m049_control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] },
  { id: "lean", name: "COD_m050_lean_captured_branch", warriors: ["build/chimera-lean-split/lean_captured_branch_a", "build/final/ChimeraB"] },
];

function writeConfig(template, suite, variant, battles, seeds) {
  const experimentId = `m050-${variant.id}-${suite}`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = battles;
  config.seeds = seeds;
  config.candidate = { name: variant.name, warriors: variant.warriors };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

for (const variant of variants) {
  writeConfig(all, "lean-all-field-h1", variant, 50, [
    "m050-lean-h1-001",
    "m050-lean-h1-002",
  ]);
  writeConfig(tune, "lean-tune-fresh", variant, 30, [
    "m050-lean-tune-001",
    "m050-lean-tune-002",
  ]);
}

console.log("generated paired lean captured-anchor validation configs");
