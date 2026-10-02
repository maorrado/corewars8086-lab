import fs from "node:fs";

const template = JSON.parse(fs.readFileSync("config-m050-pointer-holdout-duel-control.json", "utf8"));
const claude = JSON.parse(fs.readFileSync("config-claude-fixed-toggle-field-claude.json", "utf8")).candidate;
const teams = {
  control: template.candidate,
  "xor-b": JSON.parse(fs.readFileSync("config-m050-pointer-holdout-duel-xor-b.json", "utf8")).candidate,
};
for (const [name, candidate] of Object.entries(teams)) {
  const config = structuredClone(template);
  config.experimentId = `m050-vs-claude-${name}`;
  config.outputPath = `experiments/smart-counter-2026-09-30/claude-fixed-toggle/defense-duel-${name}.json`;
  config.runDirectory = `build/official-runs/smart-counter-2026-09-30/claude-fixed-toggle/defense-duel-${name}`;
  config.candidate = candidate;
  config.cohorts = [{ id: "vs-claude", opponents: [claude] }];
  config.seeds = ["m050-claude-duel-20260930-a", "m050-claude-duel-20260930-b", "m050-claude-duel-20260930-c", "m050-claude-duel-20260930-d"];
  fs.writeFileSync(`config-m050-vs-claude-${name}.json`, `${JSON.stringify(config, null, 2)}\n`);
}
