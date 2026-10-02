import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const variants = [
  { id: "control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] },
  { id: "mC0_ab_pad", warriors: ["build/chimera-mask-quantizer/mC0_ab_pad_a", "build/chimera-mask-quantizer/mC0_ab_pad_b"] },
  { id: "mE0_b_pad", warriors: ["build/chimera-mask-quantizer/mE0_b_pad_a", "build/chimera-mask-quantizer/mE0_b_pad_b"] },
  { id: "mE0_ab_pad", warriors: ["build/chimera-mask-quantizer/mE0_ab_pad_a", "build/chimera-mask-quantizer/mE0_ab_pad_b"] },
  { id: "mF0_a_pad", warriors: ["build/chimera-mask-quantizer/mF0_a_pad_a", "build/chimera-mask-quantizer/mF0_a_pad_b"] },
];

for (const variant of variants) {
  const experimentId = `m050-mask-${variant.id}-validate-r2`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = `experiments/m050-search/${experimentId}.json`;
  config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
  config.battles = 25;
  config.seeds = ["m050-mask-validate-101", "m050-mask-validate-102"];
  config.candidate = { name: `COD_mask_${variant.id}`, warriors: variant.warriors };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${variants.length} full mask-quantizer validation configs`);
