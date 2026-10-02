import fs from "node:fs";

const config = JSON.parse(fs.readFileSync("config-m050-mixed-claude-xor-b.json", "utf8"));
config.experimentId = "m050-mixed-claude-xor-b-control-name";
config.outputPath = "experiments/smart-counter-2026-09-30/claude-fixed-toggle/mixed-field-xor-b-control-name.json";
config.runDirectory = "build/official-runs/smart-counter-2026-09-30/claude-fixed-toggle/mixed-field-xor-b-control-name";
config.candidate.name = "COD_m050_control";
config.seeds = [config.seeds[0]];
fs.writeFileSync("config-m050-mixed-claude-xor-b-control-name.json", `${JSON.stringify(config, null, 2)}\n`);
