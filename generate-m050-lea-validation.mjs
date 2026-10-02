import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const variants = [
  { id: "control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] },
  { id: "b_raw", warriors: ["build/chimera-lea-stack/lea_b_raw_a", "build/chimera-lea-stack/lea_b_raw_b"] },
  { id: "b_padcc", warriors: ["build/chimera-lea-stack/lea_b_padcc_a", "build/chimera-lea-stack/lea_b_padcc_b"] },
];

for (const variant of variants) {
  const experimentId = `m050-lea-${variant.id}-validate-r2`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 25;
  config.seeds = ["m050-lea-validate-101", "m050-lea-validate-102"];
  config.candidate = { name: `COD_lea_${variant.id}`, warriors: variant.warriors };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${variants.length} full LEA validation configs`);
