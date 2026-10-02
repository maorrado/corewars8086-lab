import fs from "node:fs";

for (const name of ["claude", "m050"]) {
  const template = JSON.parse(fs.readFileSync(`config-claude-fixed-toggle-field-${name}.json`, "utf8"));
  const config = structuredClone(template);
  config.experimentId = `claude-fixed-toggle-recheck-${name}`;
  config.outputPath = `experiments/smart-counter-2026-09-30/claude-fixed-toggle/recheck-${name}.json`;
  config.runDirectory = `build/official-runs/smart-counter-2026-09-30/claude-fixed-toggle/recheck-${name}`;
  config.seeds = ["claude-fixed-toggle-recheck-20260930-a", "claude-fixed-toggle-recheck-20260930-b"];
  fs.writeFileSync(`config-claude-fixed-toggle-recheck-${name}.json`, `${JSON.stringify(config, null, 2)}\n`);
}
