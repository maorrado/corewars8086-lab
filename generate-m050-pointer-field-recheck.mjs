import fs from "node:fs";

for (const name of ["control", "xor-b"]) {
  const template = JSON.parse(fs.readFileSync(`config-m050-pointer-holdout-field-${name}.json`, "utf8"));
  const config = structuredClone(template);
  config.experimentId = `m050-pointer-field-recheck-${name}`;
  config.outputPath = `experiments/smart-counter-2026-09-30/pointer-operator/field-recheck-${name}.json`;
  config.runDirectory = `build/official-runs/smart-counter-2026-09-30/pointer-operator/field-recheck-${name}`;
  config.seeds = ["m050-pointer-field-recheck-20260930-a", "m050-pointer-field-recheck-20260930-b"];
  fs.writeFileSync(`config-m050-pointer-field-recheck-${name}.json`, `${JSON.stringify(config, null, 2)}\n`);
}
