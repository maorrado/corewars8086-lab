import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const tuneTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const futureTemplate = JSON.parse(fs.readFileSync(path.join(root, "config-m050-control-future.json"), "utf8"));
const variants = [
  { id: "control", warriors: ["build/final/ChimeraA", "build/final/ChimeraB"] },
  { id: "b_pad", warriors: ["build/chimera-zero-di-elision/b_pad_a", "build/chimera-zero-di-elision/b_pad_b"] },
  { id: "ab_pad", warriors: ["build/chimera-zero-di-elision/ab_pad_a", "build/chimera-zero-di-elision/ab_pad_b"] },
];

for (const variant of variants) {
  for (const [gate, template, battles, seeds] of [
    ["tune", tuneTemplate, 25, ["m050-zdi-validate-101", "m050-zdi-validate-102"]],
    ["future", futureTemplate, 40, ["m050-zdi-validate-future-201", "m050-zdi-validate-future-202", "m050-zdi-validate-future-203"]],
  ]) {
    const experimentId = `m050-zdi-${variant.id}-${gate}-validate-r2`;
    const config = structuredClone(template);
    config.experimentId = experimentId;
    config.outputPath = path.join(root, "experiments", "m050-search", `${experimentId}.json`);
    config.runDirectory = path.join(root, "build", "official-runs", "m050-search", experimentId);
    config.battles = battles;
    config.seeds = seeds;
    config.candidate = { name: `COD_zdi_${variant.id}`, warriors: variant.warriors.map((p) => path.join(root, p)) };
    fs.writeFileSync(path.join(root, `config-${experimentId}.json`), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  }
}

console.log(`generated ${variants.length * 2} zero-DI full validation configs`);
