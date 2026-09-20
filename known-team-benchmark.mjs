import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const requested = process.argv.slice(2);
if (requested.length === 0) throw new Error("usage: node known-team-benchmark.mjs <team-name> [...]");

const meta = JSON.parse(fs.readFileSync("config-2025-meta.json", "utf8"));
const base = JSON.parse(fs.readFileSync("config-official-v004-quick.json", "utf8"));
for (const name of requested) {
  const candidate = meta.teams.find((team) => team.name === name);
  if (!candidate) throw new Error(`unknown team ${name}`);
  const opponents = meta.teams.filter((team) => team.name !== name).slice(0, 9);
  const config = structuredClone(base);
  config.experimentId = `known-${name}`;
  config.outputPath = `experiments/known-${name}.json`;
  config.runDirectory = `build/official-runs/known-${name}`;
  config.candidate = candidate;
  config.cohorts = [0, 1, 2].map((index) => ({
    id: `known-pool-${index + 1}`,
    opponents: opponents.slice(index * 3, index * 3 + 3),
  }));
  const generatedConfig = path.resolve(`config-known-${name}.json`);
  fs.writeFileSync(generatedConfig, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  execFileSync(process.execPath, ["official-benchmark.mjs", generatedConfig], { stdio: "inherit" });
}
