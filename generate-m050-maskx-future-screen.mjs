import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const template = JSON.parse(fs.readFileSync(path.join(root, "config-m050-control-future.json"), "utf8"));
const variants = [
  { id: "control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] },
  { id: "aF8", warriors: ["build/chimera-mask-extended/aF8_a", "build/chimera-mask-extended/aF8_b"] },
  { id: "aC0_bF0", warriors: ["build/chimera-mask-extended/aC0_bF0_a", "build/chimera-mask-extended/aC0_bF0_b"] },
  { id: "abF8", warriors: ["build/chimera-mask-extended/abF8_a", "build/chimera-mask-extended/abF8_b"] },
  { id: "aE0_bF0", warriors: ["build/chimera-mask-extended/aE0_bF0_a", "build/chimera-mask-extended/aE0_bF0_b"] },
  { id: "aF0_bFE", warriors: ["build/chimera-mask-extended/aF0_bFE_a", "build/chimera-mask-extended/aF0_bFE_b"] },
  { id: "a80", warriors: ["build/chimera-mask-extended/a80_a", "build/chimera-mask-extended/a80_b"] },
];

for (const variant of variants) {
  const experimentId = `m050-maskx-${variant.id}-future-screen-r1`;
  const config = structuredClone(template);
  config.experimentId = experimentId;
  config.outputPath = path.join(root, "experiments", "m050-search", `${experimentId}.json`);
  config.runDirectory = path.join(root, "build", "official-runs", "m050-search", experimentId);
  config.battles = 20;
  config.seeds = ["m050-maskx-future-011", "m050-maskx-future-012"];
  config.candidate = { name: `COD_maskx_${variant.id}`, warriors: variant.warriors.map((p) => path.join(root, p)) };
  fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log(`generated ${variants.length} maskx future-screen configs`);
