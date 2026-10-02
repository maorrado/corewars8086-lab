import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const all = JSON.parse(fs.readFileSync(path.join(root, "config-2025-all-template.json"), "utf8"));
const tune = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const variants = [
  { id: "control", name: "COD_m049_control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] },
  { id: "hls", name: "COD_m050_alias_hls_counter", warriors: ["build/chimera-alias-hls-counter/alias_hls_counter_a", "build/final/ChimeraB"] },
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
  writeConfig(all, "hls-all-field-h1", variant, 50, [
    "m050-hls-h1-001",
    "m050-hls-h1-002",
    "m050-hls-h1-003",
    "m050-hls-h1-004",
  ]);
  writeConfig(tune, "hls-tune-h1", variant, 30, [
    "m050-hls-tune-h1-001",
    "m050-hls-tune-h1-002",
  ]);
}

console.log("generated paired split-anchor HLS-counter validation configs");
