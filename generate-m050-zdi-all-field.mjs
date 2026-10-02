import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-all-template.json"), "utf8"));
const variants = [
  { id: "control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] },
  { id: "ab_pad", warriors: ["build/chimera-zero-di-elision/ab_pad_a", "build/chimera-zero-di-elision/ab_pad_b"] },
];

for (const variant of variants) {
  const experimentId = `m050-zdi-${variant.id}-all-field-h1`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 100;
  config.seeds = ["m050-zdi-all-301", "m050-zdi-all-302"];
  config.candidate = { name: `COD_zdi_${variant.id}`, warriors: variant.warriors };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log("generated control and zero-DI A+B 5,000-battle all-field holdouts");

for (const variant of variants) {
  const experimentId = `m050-zdi-${variant.id}-all-field-h2`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 100;
  config.seeds = ["m050-zdi-all-401", "m050-zdi-all-402", "m050-zdi-all-403", "m050-zdi-all-404"];
  config.candidate = { name: `COD_zdi_${variant.id}`, warriors: variant.warriors };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log("generated second 10,000-battle all-field replication");
