import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const futureBase = JSON.parse(fs.readFileSync(path.join(root, "config-m050-control-future.json"), "utf8"));
const allBase = JSON.parse(fs.readFileSync(path.join(root, "config-2025-all-template.json"), "utf8"));
const variants = [
  { id: "control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] },
  { id: "mC0_ab_pad", warriors: ["build/chimera-mask-quantizer/mC0_ab_pad_a", "build/chimera-mask-quantizer/mC0_ab_pad_b"] },
  { id: "mE0_b_pad", warriors: ["build/chimera-mask-quantizer/mE0_b_pad_a", "build/chimera-mask-quantizer/mE0_b_pad_b"] },
  { id: "mE0_ab_pad", warriors: ["build/chimera-mask-quantizer/mE0_ab_pad_a", "build/chimera-mask-quantizer/mE0_ab_pad_b"] },
  { id: "mF0_a_pad", warriors: ["build/chimera-mask-quantizer/mF0_a_pad_a", "build/chimera-mask-quantizer/mF0_a_pad_b"] },
];

for (const variant of variants) {
  {
    const experimentId = `m050-mask-${variant.id}-future-h1`;
    const config = structuredClone(futureBase);
    config.experimentId = experimentId;
    config.outputPath = path.join(root, "experiments", "m050-search", `${experimentId}.json`);
    config.runDirectory = path.join(root, "build", "official-runs", "m050-search", experimentId);
    config.battles = 40;
    config.seeds = ["m050-mask-future-201", "m050-mask-future-202", "m050-mask-future-203"];
    config.candidate = { name: `COD_mask_${variant.id}`, warriors: variant.warriors.map((p) => path.join(root, p)) };
    fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  }
  {
    const experimentId = `m050-mask-${variant.id}-all-field-h1`;
    const config = structuredClone(allBase);
    config.experimentId = experimentId;
    config.outputPath = `experiments/m050-search/${experimentId}.json`;
    config.runDirectory = `build/official-runs/m050-search/${experimentId}`;
    config.battles = 100;
    config.seeds = ["m050-mask-all-301", "m050-mask-all-302"];
    config.candidate = { name: `COD_mask_${variant.id}`, warriors: variant.warriors };
    fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  }
}

console.log("generated future and 5,000-battle all-field holdouts for control and F0-A candidate");
