import fs from "node:fs";

const template = JSON.parse(fs.readFileSync("config-m050-pointer-holdout-field-control.json", "utf8"));
const claude = JSON.parse(fs.readFileSync("config-claude-fixed-toggle-field-claude.json", "utf8")).candidate;
const teams = {
  control: template.candidate,
  "xor-b": JSON.parse(fs.readFileSync("config-m050-pointer-holdout-field-xor-b.json", "utf8")).candidate,
};
for (const [name, candidate] of Object.entries(teams)) {
  const config = structuredClone(template);
  config.experimentId = `m050-mixed-claude-recheck-${name}`;
  config.outputPath = `experiments/smart-counter-2026-09-30/claude-fixed-toggle/mixed-recheck-${name}.json`;
  config.runDirectory = `build/official-runs/smart-counter-2026-09-30/claude-fixed-toggle/mixed-recheck-${name}`;
  config.candidate = candidate;
  config.cohorts = config.cohorts.map((cohort, index) => {
    const opponents = [...cohort.opponents];
    if (opponents.length !== 3) throw new Error(`expected four-team cohort in ${cohort.id}`);
    opponents[(index + 1) % 3] = claude;
    return { ...cohort, id: `claude-recheck-${cohort.id}`, opponents };
  });
  config.seeds = ["m050-mixed-claude-recheck-20260930-a", "m050-mixed-claude-recheck-20260930-b"];
  fs.writeFileSync(`config-m050-mixed-claude-recheck-${name}.json`, `${JSON.stringify(config, null, 2)}\n`);
}
