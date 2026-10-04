import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../../../");
const original = JSON.parse(fs.readFileSync(path.join(repo, "config-codex-goal-pair-ab-holdout-20260930.json"), "utf8"));
if (original.candidate.name !== "COD_pair" || original.cohorts.length !== 25 || original.seeds.length !== 2 || original.battles !== 50) {
  throw new Error("unexpected m050 control protocol");
}
const teams = original.cohorts.flatMap((cohort) => cohort.opponents);
if (teams.length !== 75 || new Set(teams.map((team) => team.name)).size !== 75) {
  throw new Error("expected exactly 75 unique online 2025 teams");
}
const rank = (team) => crypto.createHash("sha256").update(`b-cl8-fresh-holdout-v3:${team.name}`).digest("hex");
const shuffled = [...teams].sort((a, b) => rank(a).localeCompare(rank(b)));
const cohorts = Array.from({ length: 25 }, (_, index) => ({
  id: `b-cl8-fresh-v3-${String(index + 1).padStart(2, "0")}`,
  opponents: structuredClone(shuffled.slice(3 * index, 3 * index + 3)),
}));
const seeds = ["b-cl8-fresh-gamma-20260930", "b-cl8-fresh-delta-20260930"];
const rebase = (file) => path.isAbsolute(file) ? file : path.relative(here, path.resolve(repo, file));
const arms = [
  { id: "control", warriors: ["build/m050-repro/ab_pad_a", "build/m050-repro/ab_pad_b"] },
  { id: "variant", warriors: ["build/m050-repro/ab_pad_a", "build/codex-goal-20260930/independent-b-exact-worker-copy/B"] },
];
for (const arm of arms) {
  const config = structuredClone(original);
  config.experimentId = `codex-goal-independent-b-cl8-${arm.id}-fresh-holdout-v3-20260930`;
  config.outputPath = rebase(`experiments/codex-goal-20260930/independent-b-exact-worker-copy/${arm.id}-holdout-v3.json`);
  config.runDirectory = rebase(`build/official-runs/codex-goal-20260930/independent-b-exact-worker-copy/${arm.id}-holdout-v3`);
  config.threads = 1;
  config.seeds = seeds;
  config.cohorts = structuredClone(cohorts);
  config.candidate.name = "COD_pair";
  config.candidate.warriors = arm.warriors.map(rebase);
  for (const cohort of config.cohorts) {
    for (const opponent of cohort.opponents) opponent.warriors = opponent.warriors.map(rebase);
  }
  for (const zombie of config.zombies) zombie.path = rebase(zombie.path);
  config.java = rebase(original.java ?? "tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe");
  config.jar = rebase(original.jar ?? "repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar");
  const destination = path.join(here, `holdout-${arm.id}-v3.json`);
  if (fs.existsSync(destination) || fs.existsSync(path.resolve(here, config.outputPath)) || fs.existsSync(path.resolve(here, config.runDirectory))) {
    throw new Error(`refusing to overwrite ${arm.id} holdout artifacts`);
  }
  fs.writeFileSync(destination, `${JSON.stringify(config, null, 2)}\n`);
  console.log(JSON.stringify({ destination, arm: arm.id, name: config.candidate.name, battles: 25 * 2 * 50, seeds }));
}
