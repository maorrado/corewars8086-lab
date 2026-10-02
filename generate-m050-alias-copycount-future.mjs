import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const template = JSON.parse(fs.readFileSync(path.join(root, "experiments", "post-m049-adversarial", "future-m049.json"), "utf8"));
const seeds = ["m050-ac-future-001", "m050-ac-future-002", "m050-ac-future-003"];
const variants = ["control", "copy7", "alias_c7", "alias_c8"];

for (const id of variants) {
  const experimentId = `m050-ac-${id}-future-r1`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = path.join(root, "experiments", "m050-search", `${experimentId}.json`);
  config.runDirectory = path.join(root, "build", "official-runs", "m050-search", experimentId);
  config.battles = 40;
  config.threads = 4;
  config.seeds = seeds;
  config.candidate = {
    name: `COD_${id}`,
    warriors: [
      path.join(root, "build", "chimera-alias-copycount", `${id}_a`),
      path.join(root, "build", "chimera-alias-copycount", `${id}_b`),
    ],
  };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${variants.length} paired future-pool configs`);
