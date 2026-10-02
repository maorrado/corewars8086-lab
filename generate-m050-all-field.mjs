import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-all-template.json"), "utf8"));
for (const variant of [
  { id: "control", name: "COD_m049_control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] },
  { id: "alias-a", name: "COD_m050_alias_a", warriors: ["build/chimera-anchor-alias/alias_a_a", "build/final/ChimeraB"] },
]) {
  const experimentId = `m050-${variant.id}-all-field-holdout`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 50;
  config.seeds = ["m050-all-field-001", "m050-all-field-002"];
  config.candidate = { name: variant.name, warriors: variant.warriors };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
console.log("generated paired all-2025 holdout configs");
