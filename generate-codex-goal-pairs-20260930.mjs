import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = import.meta.dirname;
const template = JSON.parse(fs.readFileSync(path.join(root, "config-m050-control-all-field-holdout.json"), "utf8"));
const binary = {
  A: "build/m050-repro/ab_pad_a",
  B: "build/m050-repro/ab_pad_b",
};
const expected = {
  A: "0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44",
  B: "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782",
};
for (const member of ["A", "B"]) {
  const actual = crypto.createHash("sha256").update(fs.readFileSync(path.join(root, binary[member]))).digest("hex");
  if (actual !== expected[member]) throw new Error(`${member} hash mismatch: ${actual}`);
}
for (const pair of ["AB", "AA", "BA", "BB"]) {
  const config = structuredClone(template);
  config.experimentId = `codex-goal-pair-${pair.toLowerCase()}-tune-20260930`;
  config.outputPath = `experiments/codex-goal-20260930/pair/${pair.toLowerCase()}-tune.json`;
  config.runDirectory = `build/official-runs/codex-goal-20260930/pair-${pair.toLowerCase()}-tune`;
  config.battles = 10;
  config.seeds = ["codex-goal-pair-tune-20260930-s1", "codex-goal-pair-tune-20260930-s2"];
  config.candidate = { name: "COD_pair", warriors: [...pair].map((member) => binary[member]) };
  const output = path.join(root, `config-codex-goal-pair-${pair.toLowerCase()}-tune-20260930.json`);
  fs.writeFileSync(output, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`${pair}: ${config.cohorts.length * config.seeds.length * config.battles} battles; ${output}`);
}
