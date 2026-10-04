import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const experimentDir = path.join(root, "experiments", "b01d-fiveway-crossyear-20261002");
const sourceManifestPath = path.join(experimentDir, "manifest.json");
const continuationPath = path.join(experimentDir, "focused-b01d-e1p4-manifest.json");
const sourceProgressPath = path.join(experimentDir, "progress.json");
const expectedSourceManifestSha256 = "32ea3668f8cc3ca738221df14a79bb064ef74f2cefe05155cd28df19f9d8730c";
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

if (!fs.existsSync(sourceManifestPath)) throw new Error(`Missing source manifest: ${sourceManifestPath}`);
const sourceManifestSha256 = sha256(sourceManifestPath);
if (sourceManifestSha256 !== expectedSourceManifestSha256) throw new Error(`Source manifest changed: ${sourceManifestSha256}`);
const sourceManifest = readJson(sourceManifestPath);
if (sourceManifest.status !== "FROZEN_BEFORE_RUN") throw new Error(`Unexpected source manifest status: ${sourceManifest.status}`);

const arms = ["b01d", "e1p4"];
const configs = sourceManifest.configs
  .filter((record) => arms.includes(record.arm))
  .sort((a, b) => a.panel - b.panel || arms.indexOf(a.arm) - arms.indexOf(b.arm));
if (configs.length !== 32) throw new Error(`Expected 32 paired configs, found ${configs.length}`);

const completed = [];
const pending = [];
for (const record of configs) {
  const configPath = path.resolve(record.path);
  if (sha256(configPath) !== record.sha256) throw new Error(`Frozen config hash mismatch: ${configPath}`);
  const config = readJson(configPath);
  if (config.battles !== 50 || record.battles !== 2200 || config.cohorts.length !== 44) {
    throw new Error(`Unexpected battles/cohorts in ${configPath}`);
  }
  if (config.candidate.name !== `COD_${record.arm}`) throw new Error(`Candidate/config mismatch: ${configPath}`);
  if (sha256(config.jar) !== sourceManifest.engineJar.sha256) throw new Error(`Engine hash mismatch: ${config.jar}`);

  const item = {
    arm: record.arm,
    panel: record.panel,
    configPath,
    configSha256: record.sha256,
    outputPath: path.resolve(config.outputPath),
    seed: config.seeds[0],
    battles: record.battles,
    battlesPerCohort: config.battles,
  };
  if (record.panel <= 8) {
    if (!fs.existsSync(item.outputPath)) throw new Error(`Expected completed paired result missing: ${item.outputPath}`);
    const result = readJson(item.outputPath);
    if (result.configSha256 !== item.configSha256 || result.engineJar?.sha256 !== sourceManifest.engineJar.sha256) {
      throw new Error(`Completed result does not match frozen config/engine: ${item.outputPath}`);
    }
    if (result.aggregate?.battles !== 2200) throw new Error(`Unexpected completed battle count: ${item.outputPath}`);
    item.resultSha256 = sha256(item.outputPath);
    item.teamPerBattle = result.aggregate.teamPerBattle;
    completed.push(item);
  } else {
    if (fs.existsSync(item.outputPath)) throw new Error(`Unexpected pre-existing pending output; refusing overwrite: ${item.outputPath}`);
    pending.push(item);
  }
}

for (let panel = 1; panel <= 16; panel++) {
  const pair = configs.filter((item) => item.panel === panel);
  if (pair.length !== 2 || new Set(pair.map((item) => item.arm)).size !== 2) throw new Error(`Incomplete pair in panel ${panel}`);
}
if (completed.length !== 16 || pending.length !== 16) {
  throw new Error(`Expected 16 reusable completed and 16 pending configs; found ${completed.length}/${pending.length}`);
}

const sourceProgress = readJson(sourceProgressPath);
if (sourceProgress.status === "RUNNING") {
  sourceProgress.status = "INTERRUPTED_FOR_FOCUSED_CONTINUATION";
  sourceProgress.updatedAt = new Date().toISOString();
  sourceProgress.stopReason = "User-approved scope reduction after preserving completed results; unfinished non-pairwise arms were not resumed.";
  fs.writeFileSync(sourceProgressPath, `${JSON.stringify(sourceProgress, null, 2)}\n`, "utf8");
}

const body = {
  status: "FROZEN_FOCUSED_CONTINUATION",
  createdAt: new Date().toISOString(),
  objective: "Complete only the fresh paired b01d-vs-e1p4 comparison on the same 16 cross-year panels; reuse existing panels 1-8.",
  sourceManifestPath,
  sourceManifestSha256,
  engineJar: sourceManifest.engineJar,
  arms,
  panels: 16,
  battlesPerPanelPerArm: 2200,
  workers: 2,
  reusedCompleted: completed,
  pending,
};
const canonical = `${JSON.stringify(body, null, 2)}\n`;
const manifestSha256 = crypto.createHash("sha256").update(canonical).digest("hex");
fs.writeFileSync(continuationPath, `${JSON.stringify({ ...body, manifestSha256 }, null, 2)}\n`, "utf8");
console.log(`Focused manifest frozen: ${continuationPath}`);
console.log(`source=${sourceManifestSha256}; focused=${manifestSha256}; reused=${completed.length}; pending=${pending.length}`);
