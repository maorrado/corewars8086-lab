import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const ids = ["n006", "n008", "n020", "n021", "n040", "n041"];

for (const id of ids) {
  const experimentId = `m050-adapt-original-${id}-tune-r2`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 25;
  config.seeds = ["m050-adapt-validate-101", "m050-adapt-validate-102"];
  config.candidate = {
    name: `COD_adapt_original_${id}`,
    warriors: [`build/chimera-adaptive/${id}_a`, "build/final/ChimeraB"],
  };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${ids.length} original adaptive-A validation configs`);
