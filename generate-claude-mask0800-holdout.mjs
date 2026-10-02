import fs from "node:fs";

const fieldTemplate = JSON.parse(fs.readFileSync("config-claude-fixed-toggle-field-claude.json", "utf8"));
const duelTemplate = JSON.parse(fs.readFileSync("config-claude-fixed-toggle-duel-claude.json", "utf8"));
const teams = {
  mask0800: { name: "COD_claude_mask_0800", warriors: ["build/claude-toggle-mask-sweep/0800/A", "build/claude-toggle-mask-sweep/0800/B"] },
  mask2000: fieldTemplate.candidate,
  m050: JSON.parse(fs.readFileSync("config-claude-fixed-toggle-field-m050.json", "utf8")).candidate,
};
for (const [name, candidate] of Object.entries(teams)) {
  for (const [kind, template] of [["field", fieldTemplate], ["duel", duelTemplate]]) {
    if (kind === "duel" && name === "m050") continue;
    const config = structuredClone(template);
    config.experimentId = `claude-mask0800-holdout-${kind}-${name}`;
    config.outputPath = `experiments/smart-counter-2026-09-30/claude-toggle-mask/holdout-${kind}-${name}.json`;
    config.runDirectory = `build/official-runs/smart-counter-2026-09-30/claude-toggle-mask/holdout-${kind}-${name}`;
    config.candidate = candidate;
    config.seeds = kind === "field"
      ? ["claude-mask0800-field-20260930-a", "claude-mask0800-field-20260930-b"]
      : ["claude-mask0800-duel-20260930-a", "claude-mask0800-duel-20260930-b", "claude-mask0800-duel-20260930-c", "claude-mask0800-duel-20260930-d"];
    fs.writeFileSync(`config-claude-mask0800-holdout-${kind}-${name}.json`, `${JSON.stringify(config, null, 2)}\n`);
  }
}
