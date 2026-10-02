import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const variants = [
  { id: "control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] },
  { id: "n040", warriors: ["build/chimera-adaptive-port/n040_a", "build/chimera-adaptive-port/n040_b"] },
  { id: "n041", warriors: ["build/chimera-adaptive-port/n041_a", "build/chimera-adaptive-port/n041_b"] },
];

for (const variant of variants) {
  const experimentId = `m050-adapt-${variant.id}-tune-r2`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 25;
  config.seeds = ["m050-adapt-validate-101", "m050-adapt-validate-102"];
  config.candidate = { name: `COD_adapt_${variant.id}`, warriors: variant.warriors };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${variants.length} adaptive validation configs`);
