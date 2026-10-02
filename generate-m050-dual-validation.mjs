import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const all = JSON.parse(fs.readFileSync(path.join(root, "config-2025-all-template.json"), "utf8"));
const tune = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const variants = [
  { id: "control", name: "COD_m049_control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] },
  { id: "dual", name: "COD_m050_dual_main_new", warriors: ["build/chimera-dual-anchor/dual_main_new_a", "build/final/ChimeraB"] },
  { id: "padded", name: "COD_m050_alias_padded", warriors: ["build/chimera-padded-alias/alias_padded_a", "build/final/ChimeraB"] },
  { id: "simple", name: "COD_m050_alias_simple", warriors: ["build/chimera-anchor-alias/alias_a_a", "build/final/ChimeraB"] },
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
  writeConfig(all, "dual-all-field-r2", variant, 50, [
    "m050-dual-r2-001",
    "m050-dual-r2-002",
    "m050-dual-r2-003",
    "m050-dual-r2-004",
  ]);
  writeConfig(tune, "dual-tune-fresh", variant, 30, [
    "m050-dual-tune-001",
    "m050-dual-tune-002",
  ]);
}

console.log("generated paired dual-anchor validation configs");
