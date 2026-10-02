import fs from "node:fs";
import path from "node:path";

const root = import.meta.dirname;
const original = JSON.parse(fs.readFileSync(path.join(root, "config-codex-goal-stackxor-b-holdout-20260930.json"), "utf8"));
const config = structuredClone(original);
config.experimentId = "codex-goal-stackxor-b-diagnostic-20260930";
config.outputPath = "experiments/codex-goal-20260930/diagnostic/stackxor-b-one-cohort.json";
config.runDirectory = "build/official-runs/codex-goal-20260930/diagnostic/stackxor-b-one-cohort";
config.threads = 1;
config.seeds = ["codex-goal-pair-holdout-20260930-7292"];
config.cohorts = original.cohorts.filter((cohort) => cohort.id === "goal-fresh-18");
if (config.cohorts.length !== 1) throw new Error("diagnostic cohort missing");
const output = path.join(root, "config-codex-goal-stackxor-b-diagnostic-20260930.json");
fs.writeFileSync(output, `${JSON.stringify(config, null, 2)}\n`);
console.log(output);
