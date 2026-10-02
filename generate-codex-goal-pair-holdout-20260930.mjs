import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = import.meta.dirname;
const template = JSON.parse(fs.readFileSync(path.join(root, "config-codex-goal-pair-ab-tune-20260930.json"), "utf8"));
const teams = template.cohorts.flatMap((cohort) => cohort.opponents);
if (teams.length !== 75 || new Set(teams.map((team) => team.name)).size !== 75) throw new Error("expected 75 unique 2025 teams");

// Fisher–Yates with an explicit local seed, independent of battle RNG.
let state = 0x3092026;
const random = () => {
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  return (state >>> 0) / 0x100000000;
};
for (let index = teams.length - 1; index > 0; index--) {
  const other = Math.floor(random() * (index + 1));
  [teams[index], teams[other]] = [teams[other], teams[index]];
}
const cohorts = Array.from({ length: 25 }, (_, index) => ({
  id: `goal-fresh-${String(index + 1).padStart(2, "0")}`,
  opponents: teams.slice(3 * index, 3 * index + 3),
}));
const binary = {
  A: "build/m050-repro/ab_pad_a",
  B: "build/m050-repro/ab_pad_b",
};
const expected = {
  A: "0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44",
  B: "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782",
};
for (const part of ["A", "B"]) {
  const actual = crypto.createHash("sha256").update(fs.readFileSync(path.join(root, binary[part]))).digest("hex");
  if (actual !== expected[part]) throw new Error(`${part} hash mismatch`);
}
for (const pair of ["AB", "BA"]) {
  const config = structuredClone(template);
  config.experimentId = `codex-goal-pair-${pair.toLowerCase()}-holdout-20260930`;
  config.outputPath = `experiments/codex-goal-20260930/pair/${pair.toLowerCase()}-holdout.json`;
  config.runDirectory = `build/official-runs/codex-goal-20260930/pair-${pair.toLowerCase()}-holdout`;
  config.battles = 50;
  config.seeds = ["codex-goal-pair-holdout-20260930-7291", "codex-goal-pair-holdout-20260930-7292"];
  config.cohorts = structuredClone(cohorts);
  config.candidate = { name: "COD_pair", warriors: [...pair].map((part) => binary[part]) };
  const output = path.join(root, `config-codex-goal-pair-${pair.toLowerCase()}-holdout-20260930.json`);
  fs.writeFileSync(output, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`${pair}: ${config.cohorts.length * config.seeds.length * config.battles} fresh battles; ${output}`);
}
