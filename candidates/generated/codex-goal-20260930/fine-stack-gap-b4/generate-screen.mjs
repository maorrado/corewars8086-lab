import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(here, "../les-bootstrap/control-screen.json");
const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
if (source.candidate.name !== "COD_pair" || source.battles !== 20 || source.threads !== 1 || source.cohorts.length !== 25 || source.seeds.length !== 1) {
  throw new Error("unexpected matched 2025 screen control");
}
const config = structuredClone(source);
config.experimentId = "codex-goal-fine-stack-gap-b4-field-screen-20260930";
config.outputPath = "../../../../experiments/codex-goal-20260930/fine-stack-gap-b4/field-screen.json";
config.runDirectory = "../../../../build/official-runs/codex-goal-20260930/fine-stack-gap-b4/field-screen";
config.candidate.warriors[1] = "../../../../build/codex-goal-20260930/fine-stack-gap-b4/B";
const output = path.join(here, "field-screen.json");
if (fs.existsSync(output) || fs.existsSync(path.resolve(here, config.outputPath)) || fs.existsSync(path.resolve(here, config.runDirectory))) {
  throw new Error("refusing to overwrite fine-gap screen artifacts");
}
fs.writeFileSync(output, `${JSON.stringify(config, null, 2)}\n`);
console.log(output);
