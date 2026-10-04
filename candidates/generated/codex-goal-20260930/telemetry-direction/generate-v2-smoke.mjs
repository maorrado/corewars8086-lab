import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const base = JSON.parse(fs.readFileSync(path.join(here, "direct-copy-smoke.json"), "utf8"));
if (base.candidate.name !== "COD_pair" || base.battles !== 20 || base.cohorts.length !== 1) throw new Error("unexpected v1 smoke protocol");
const variant = structuredClone(base);
variant.experimentId = "codex-goal-direct-copy-v2-smoke-20260930";
variant.outputPath = "../../../../experiments/codex-goal-20260930/telemetry-direction/direct-copy-v2-smoke.json";
variant.runDirectory = "../../../../build/official-runs/codex-goal-20260930/telemetry-direction/direct-copy-v2-smoke";
variant.candidate.warriors = [
  "../../../../build/codex-goal-20260930-telemetry-direction-v2/direct-copy-v2-a",
  "../../../../build/codex-goal-20260930-telemetry-direction-v2/direct-copy-v2-b",
];
const destination = path.join(here, "direct-copy-v2-smoke.json");
if (fs.existsSync(destination) || fs.existsSync(path.resolve(here, variant.outputPath)) || fs.existsSync(path.resolve(here, variant.runDirectory))) {
  throw new Error("refusing to overwrite v2 artifacts");
}
fs.writeFileSync(destination, `${JSON.stringify(variant, null, 2)}\n`);
console.log(destination);
