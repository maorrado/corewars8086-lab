import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const templatePath = process.argv[2];
const buildDirectory = process.argv[3];
const versions = process.argv.slice(4);
if (!templatePath || !buildDirectory || versions.length === 0) {
  throw new Error("usage: node official-sweep.mjs <template.json> <build-directory> <version-prefix> [...]");
}

const root = process.cwd();
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
const files = fs.readdirSync(buildDirectory).filter((name) => !name.endsWith(".lst") && name !== "manifest.json");
const summary = [];
for (const version of versions) {
  const warriors = files.filter((name) => name.startsWith(`${version}_`)).sort();
  if (warriors.length !== 2) throw new Error(`${version}: expected two binaries, found ${warriors.join(", ")}`);
  const config = structuredClone(template);
  const tag = process.env.SWEEP_TAG ?? "official-quick";
  if (process.env.SWEEP_BATTLES) config.battles = Number(process.env.SWEEP_BATTLES);
  if (process.env.SWEEP_SEEDS) config.seeds = process.env.SWEEP_SEEDS.split(",");
  config.experimentId = `${version}-${tag}`;
  config.outputPath = `experiments/${version}-${tag}.json`;
  config.runDirectory = `build/official-runs/${version}-${tag}`;
  config.candidate = {
    name: `COD_${version}`,
    warriors: warriors.map((name) => path.relative(root, path.resolve(buildDirectory, name)).replaceAll("\\", "/")),
  };
  const configDirectory = root;
  fs.mkdirSync(configDirectory, { recursive: true });
  const generatedConfig = path.join(configDirectory, `config-sweep-${version}.json`);
  fs.writeFileSync(generatedConfig, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  execFileSync(process.execPath, ["official-benchmark.mjs", generatedConfig], { stdio: "inherit" });
  const result = JSON.parse(fs.readFileSync(config.outputPath, "utf8"));
  summary.push({ version, warriors, ...result.aggregate });
}
const output = path.resolve("experiments", `sweep-${versions.join("-")}.json`);
fs.writeFileSync(output, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(`wrote ${output}`);
