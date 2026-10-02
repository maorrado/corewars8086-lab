import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const templatePath = path.join(root, "experiments", "post-m049-adversarial", "future-m049.json");
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
const seeds = ["m050-alias-future-001", "m050-alias-future-002", "m050-alias-future-003"];

for (const variant of [
  { id: "control", name: "COD_m049_control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] },
  { id: "alias-a", name: "COD_m050_alias_a", warriors: ["build/chimera-anchor-alias/alias_a_a", "build/final/ChimeraB"] },
]) {
  const experimentId = `m050-${variant.id}-future`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = path.join(root, "experiments", "m050-search", `${experimentId}.json`);
  config.runDirectory = path.join(root, "build", "official-runs", "m050-search", experimentId);
  config.battles = 40;
  config.threads = 4;
  config.seeds = seeds;
  config.candidate = {
    name: variant.name,
    warriors: variant.warriors.map((warrior) => path.resolve(root, warrior)),
  };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log("generated paired alias-A future-pool configs");
