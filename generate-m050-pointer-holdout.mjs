import fs from "node:fs";

const fieldTemplate = JSON.parse(fs.readFileSync("config-m050-a-step-holdout-field-control.json", "utf8"));
const duelTemplate = JSON.parse(fs.readFileSync("config-m050-a-step-holdout-duel-control.json", "utf8"));
const teams = {
  control: fieldTemplate.candidate,
  "xor-b": { name: "COD_ptr_xor_b", warriors: ["build/m050-pointer-operator/xor-b/A", "build/m050-pointer-operator/xor-b/B"] },
};
for (const [name, team] of Object.entries(teams)) {
  for (const [kind, template] of [["field", fieldTemplate], ["duel", duelTemplate]]) {
    const config = structuredClone(template);
    config.experimentId = `m050-pointer-holdout-${kind}-${name}`;
    config.outputPath = `experiments/smart-counter-2026-09-30/pointer-operator/holdout-${kind}-${name}.json`;
    config.runDirectory = `build/official-runs/smart-counter-2026-09-30/pointer-operator/holdout-${kind}-${name}`;
    config.candidate = team;
    config.seeds = kind === "field"
      ? ["m050-pointer-field-20260930-a", "m050-pointer-field-20260930-b"]
      : ["m050-pointer-duel-20260930-a", "m050-pointer-duel-20260930-b", "m050-pointer-duel-20260930-c", "m050-pointer-duel-20260930-d"];
    fs.writeFileSync(`config-m050-pointer-holdout-${kind}-${name}.json`, `${JSON.stringify(config, null, 2)}\n`);
  }
}
