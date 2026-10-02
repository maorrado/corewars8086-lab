import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = import.meta.dirname;
const base = JSON.parse(fs.readFileSync(path.join(root, "config-codex-goal-pair-ab-holdout-20260930.json"), "utf8"));
const candidateB = "build/codex-goal-20260930/stack-xor/b_xor";
const expectedB = "d162507e4cfa89deae0717b10e6c5896fe37e2af29f336771d9b96bffa86b360";
const actualB = crypto.createHash("sha256").update(fs.readFileSync(path.join(root, candidateB))).digest("hex");
if (actualB !== expectedB) throw new Error("XOR-SP B hash mismatch");
const config = structuredClone(base);
config.experimentId = "codex-goal-stackxor-b-holdout-20260930";
config.outputPath = "experiments/codex-goal-20260930/stack-xor/b-holdout.json";
config.runDirectory = "build/official-runs/codex-goal-20260930/stackxor-b-holdout";
config.candidate.warriors[1] = candidateB;
const output = path.join(root, "config-codex-goal-stackxor-b-holdout-20260930.json");
fs.writeFileSync(output, `${JSON.stringify(config, null, 2)}\n`);
console.log(`${config.cohorts.length * config.seeds.length * config.battles} battles; ${output}`);
