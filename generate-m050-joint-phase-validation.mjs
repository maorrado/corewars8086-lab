import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const variants = ["b34_z54", "b39_z5c", "b39_z4c", "b2a_z4c", "b2a_z64"];

for (const id of variants) {
  const experimentId = `m050-jphase-${id}-tune-r2`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/joint-phases/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 25;
  config.seeds = ["m050-jphase-tune-101", "m050-jphase-tune-102"];
  config.candidate = {
    name: `COD_${id}`,
    warriors: [
      `build/chimera-joint-phases/${id}_a`,
      `build/chimera-joint-phases/${id}_b`,
    ],
  };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${variants.length} joint-phase validation configs`);
