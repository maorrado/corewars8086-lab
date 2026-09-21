import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const buildDirectory = path.resolve(process.argv[2] ?? "build/chimera-extensions");
const versions = process.argv.slice(3);
if (versions.length === 0) throw new Error("usage: node screen-chimera-extensions.mjs <build-directory> <version> [...]");
const screenTag = process.env.SCREEN_TAG ?? "extension-screen";

const base = JSON.parse(fs.readFileSync("config-2025-tune-template.json", "utf8"));
const selectedCohorts = new Set([
  "tune-v1-01",
  "tune-v1-03",
  "tune-v1-06",
  "tune-v1-09",
  "tune-v1-10",
  "tune-v1-12",
  "tune-v1-15",
  "tune-v1-17",
]);
const files = fs.readdirSync(buildDirectory).filter((name) => !name.endsWith(".lst") && name !== "manifest.json");
const summary = [];

for (const version of versions) {
  const warriors = files.filter((name) => name.startsWith(`${version}_`)).sort();
  if (warriors.length !== 2) throw new Error(`${version}: expected two warriors, found ${warriors.join(", ")}`);
  const config = structuredClone(base);
  config.experimentId = `${version}-${screenTag}`;
  config.outputPath = `experiments/${config.experimentId}.json`;
  config.runDirectory = `build/official-runs/${config.experimentId}`;
  config.battles = Number(process.env.SCREEN_BATTLES ?? 25);
  config.seeds = [process.env.SCREEN_SEED ?? "extension-screen-001"];
  config.cohorts = config.cohorts.filter((cohort) => selectedCohorts.has(cohort.id));
  config.candidate = {
    name: `COD_${version}`,
    warriors: warriors.map((name) => path.relative(process.cwd(), path.join(buildDirectory, name)).replaceAll("\\", "/")),
  };
  const configPath = `config-screen-${version}.json`;
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  execFileSync(process.execPath, ["official-benchmark.mjs", configPath], { stdio: "inherit" });
  const result = JSON.parse(fs.readFileSync(config.outputPath, "utf8"));
  summary.push({ version, ...result.aggregate });
}

summary.sort((a, b) => b.teamPerBattle - a.teamPerBattle);
const output = `experiments/chimera-${screenTag}-summary.json`;
fs.writeFileSync(output, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify(summary, null, 2));
