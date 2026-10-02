import fs from "node:fs";

const candidate = {
  name: "COD_smartA_add_m050B",
  warriors: ["build/smart-step-operators/add-a/A", "build/m050-repro/ab_pad_b"],
};
for (const [kind, templatePath] of [
  ["duel", "config-smart-defense-duel-m050-control.json"],
  ["field", "config-smart-defense-field-screen-m050-control.json"],
]) {
  const config = JSON.parse(fs.readFileSync(templatePath, "utf8"));
  config.experimentId = `smart-reverse-hybrid-${kind}`;
  config.outputPath = `experiments/smart-counter-2026-09-30/reverse-hybrid/${kind}.json`;
  config.runDirectory = `build/official-runs/smart-counter-2026-09-30/reverse-hybrid/${kind}`;
  config.candidate = candidate;
  fs.writeFileSync(`config-smart-reverse-hybrid-${kind}.json`, `${JSON.stringify(config, null, 2)}\n`);
}
