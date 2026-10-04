import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../../../");
const base = JSON.parse(fs.readFileSync(path.join(repo, "config-codex-goal-pair-ab-holdout-20260930.json"), "utf8"));
if (base.candidate.name !== "COD_pair" || base.cohorts.length !== 25 || base.cohorts.flatMap((x) => x.opponents).length !== 75) {
  throw new Error("unexpected 2025 field template");
}
const rebase = (file) => path.isAbsolute(file) ? file : path.relative(here, path.resolve(repo, file));
const arms = [
  ["control", "build/m050-repro/ab_pad_a", "build/m050-repro/ab_pad_b"],
  ["les-a", "build/codex-goal-20260930/les-bootstrap/ChimeraA-les", "build/m050-repro/ab_pad_b"],
  ["les-b", "build/m050-repro/ab_pad_a", "build/codex-goal-20260930/les-bootstrap/ChimeraB-les"],
  ["les-both", "build/codex-goal-20260930/les-bootstrap/ChimeraA-les", "build/codex-goal-20260930/les-bootstrap/ChimeraB-les"],
];
for (const [arm, a, b] of arms) {
  const config = structuredClone(base);
  config.experimentId = `codex-goal-les-bootstrap-${arm}-screen-20260930`;
  config.outputPath = rebase(`experiments/codex-goal-20260930/les-bootstrap/${arm}-screen.json`);
  config.runDirectory = rebase(`build/official-runs/codex-goal-20260930/les-bootstrap/${arm}-screen`);
  config.battles = 20;
  config.threads = 1;
  config.seeds = ["les-bootstrap-screen-s1-20260930"];
  config.candidate.name = "COD_pair";
  config.candidate.warriors = [a, b].map(rebase);
  for (const cohort of config.cohorts) {
    for (const opponent of cohort.opponents) opponent.warriors = opponent.warriors.map(rebase);
  }
  for (const zombie of config.zombies) zombie.path = rebase(zombie.path);
  config.java = rebase(base.java ?? "tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe");
  config.jar = rebase(base.jar ?? "repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar");
  const destination = path.join(here, `${arm}-screen.json`);
  if (fs.existsSync(destination) || fs.existsSync(path.resolve(here, config.outputPath)) || fs.existsSync(path.resolve(here, config.runDirectory))) {
    throw new Error(`refusing to overwrite artifacts for ${arm}`);
  }
  fs.writeFileSync(destination, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`${arm}: ${destination}`);
}
