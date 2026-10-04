import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../../../");
const controlPath = path.join(repo, "candidates", "generated", "codex-goal-20260930", "independent-b-exact-worker-copy", "screen-control.json");
const configPath = path.join(here, "screen-variant.json");
const outputPath = path.join(repo, "experiments", "codex-goal-20260930", "independent-a-worker-cl8", "variant-screen.json");
const runDirectory = path.join(repo, "build", "official-runs", "codex-goal-20260930", "independent-a-worker-cl8", "variant-screen");
const candidateA = path.join(repo, "build", "codex-goal-20260930", "independent-a-worker-cl8", "A");
const expectedA = "f6e812ec070fa025c73244f14c52832d492d6ffc6c77d732b1ef6e77381bff01";
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const control = JSON.parse(fs.readFileSync(controlPath, "utf8"));
if (sha256(candidateA) !== expectedA || control.candidate.name !== "COD_pair" || control.cohorts.length !== 25 ||
    control.battles !== 20 || control.seeds.length !== 1 || control.candidate.warriors.length !== 2) {
  throw new Error("A binary or matched control config is unexpected");
}
const config = {
  ...control,
  experimentId: "codex-goal-independent-a-worker-cl8-variant-screen-20260930",
  outputPath,
  runDirectory,
  candidate: { ...control.candidate, warriors: [candidateA, control.candidate.warriors[1]] },
};
if (fs.existsSync(configPath) || fs.existsSync(outputPath) || fs.existsSync(runDirectory)) {
  throw new Error("refusing to overwrite existing A screen artifacts");
}
fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, { flag: "wx" });
console.log(`A-worker CL=8 screen config: ${configPath}`);
