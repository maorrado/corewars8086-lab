import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repo = process.cwd();
const study = path.join(repo, "experiments", "good-test-v4-check-20261002");
const inputA = "C:/Users/ronyr/Downloads/Good_Test_V4_1";
const inputB = "C:/Users/ronyr/Downloads/Good_Test_V4_2";

for (let panel = 1; panel <= 4; panel += 1) {
  const panelId = String(panel).padStart(2, "0");
  const sourceConfig = path.join(
    repo,
    "experiments",
    "b01d-e1p4-validation-20261002-parallel",
    "configs",
    `b01d-e1p4-p${panelId}-b01d-parallel.json`,
  );
  const config = JSON.parse(fs.readFileSync(sourceConfig, "utf8"));
  config.experimentId = `good-test-v4-p${panelId}-20261002`;
  config.candidate = {
    name: "COD_Good_Test_V4",
    warriors: [inputA, inputB],
  };
  config.outputPath = path.join(study, "results", `${config.experimentId}.json`);
  config.runDirectory = path.join(repo, "build", "official-runs", path.basename(study), `p${panelId}`);
  const configPath = path.join(study, "configs", `${config.experimentId}.json`);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`\n=== Running ${config.experimentId}; 25 matched 2025 cohorts, ${config.battles} battles each ===`);
  const result = spawnSync(process.execPath, [path.join(repo, "official-benchmark.mjs"), configPath], {
    cwd: repo,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${config.experimentId} exited with ${result.status}`);
}
