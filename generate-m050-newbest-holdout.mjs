import fs from "node:fs";

const template = JSON.parse(fs.readFileSync("config-good-test-newbest-control.json", "utf8"));
const teams = {
  control: JSON.parse(fs.readFileSync("config-m050-pointer-holdout-field-control.json", "utf8")).candidate,
  "xor-b": JSON.parse(fs.readFileSync("config-m050-pointer-holdout-field-xor-b.json", "utf8")).candidate,
};
for (const [name, candidate] of Object.entries(teams)) {
  const config = structuredClone(template);
  config.experimentId = `m050-newbest-holdout-${name}`;
  config.outputPath = `experiments/smart-counter-2026-09-30/newbest-holdout/${name}.json`;
  config.runDirectory = `build/official-runs/smart-counter-2026-09-30/newbest-holdout/${name}`;
  config.candidate = candidate;
  config.seeds = ["m050-newbest-20260930-a", "m050-newbest-20260930-b", "m050-newbest-20260930-c", "m050-newbest-20260930-d"];
  fs.writeFileSync(`config-m050-newbest-holdout-${name}.json`, `${JSON.stringify(config, null, 2)}\n`);
}
