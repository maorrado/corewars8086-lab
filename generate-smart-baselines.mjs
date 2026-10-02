import fs from "node:fs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const write = (name, config) => fs.writeFileSync(`config-${name}.json`, `${JSON.stringify(config, null, 2)}\n`);
const teams = {
  smart: { name: "COD_Smart", warriors: ["build/smart-counter-2026-09-30/SmartA", "build/smart-counter-2026-09-30/SmartB"] },
  m049: { name: "COD_m049", warriors: ["C:/Users/ronyr/.codex/worktrees/smart-fighter/corewars8086-lab/build/final/ChimeraA", "C:/Users/ronyr/.codex/worktrees/smart-fighter/corewars8086-lab/build/final/ChimeraB"] },
  m050: { name: "COD_m050", warriors: ["build/m050-repro/ab_pad_a", "build/m050-repro/ab_pad_b"] },
};
const joint = read("config-good-test-joint.json");
for (const key of ["smart", "m049", "m050"]) {
  const config = structuredClone(joint);
  config.experimentId = `smart-counter-joint-${key}`;
  config.outputPath = `experiments/smart-counter-2026-09-30/${config.experimentId}.json`;
  config.runDirectory = `build/official-runs/smart-counter-2026-09-30/${config.experimentId}`;
  config.candidate = teams[key];
  config.seeds = ["smart-joint-fresh-a", "smart-joint-fresh-b", "smart-joint-fresh-c", "smart-joint-fresh-d"];
  config.cohorts = [{ id: "champions-and-newbest", opponents: Object.entries(teams).filter(([name]) => name !== key).map(([, team]) => team).concat([joint.cohorts[0].opponents[2]]) }];
  write(config.experimentId, config);
}
const field = read("config-good-test-good_test-primary.json");
for (const key of ["smart", "m049", "m050"]) {
  const config = structuredClone(field);
  config.experimentId = `smart-counter-field-${key}`;
  config.outputPath = `experiments/smart-counter-2026-09-30/${config.experimentId}.json`;
  config.runDirectory = `build/official-runs/smart-counter-2026-09-30/${config.experimentId}`;
  config.candidate = teams[key];
  config.battles = 50;
  config.seeds = ["smart-field-fresh-a", "smart-field-fresh-b"];
  write(config.experimentId, config);
}
