import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const experimentDir = path.join(root, "experiments", "b01d-fiveway-crossyear-20261002");
const manifestPath = path.join(experimentDir, "focused-b01d-e1p4-manifest.json");
const progressPath = path.join(experimentDir, "focused-b01d-e1p4-progress.json");
const configRunner = path.join(root, "official-benchmark.mjs");
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

const manifest = readJson(manifestPath);
const { manifestSha256, ...body } = manifest;
if (crypto.createHash("sha256").update(`${JSON.stringify(body, null, 2)}\n`).digest("hex") !== manifestSha256) {
  throw new Error("Focused continuation manifest hash mismatch");
}
if (manifest.status !== "FROZEN_FOCUSED_CONTINUATION" || manifest.pending.length !== 16 || manifest.workers !== 2) {
  throw new Error("Unexpected focused continuation manifest");
}
if (sha256(manifest.sourceManifestPath) !== manifest.sourceManifestSha256) throw new Error("Parent frozen manifest changed");

const complete = [...manifest.reusedCompleted];
let nextIndex = 0;
let failed = false;
const writeProgress = (status, error = null) => {
  const progress = {
    status,
    updatedAt: new Date().toISOString(),
    focusedManifestSha256: manifestSha256,
    sourceManifestSha256: manifest.sourceManifestSha256,
    reusedCompleted: manifest.reusedCompleted.length,
    pendingTotal: manifest.pending.length,
    pendingCompleted: complete.length - manifest.reusedCompleted.length,
    totalPairedConfigsComplete: complete.length,
    totalPairedConfigs: 32,
    results: complete.slice().sort((a, b) => a.panel - b.panel || a.arm.localeCompare(b.arm)),
    error,
  };
  fs.writeFileSync(progressPath, `${JSON.stringify(progress, null, 2)}\n`, "utf8");
};

function runConfig(item) {
  return new Promise((resolve, reject) => {
    const config = readJson(item.configPath);
    if (sha256(item.configPath) !== item.configSha256) return reject(new Error(`Config hash mismatch: ${item.configPath}`));
    if (fs.existsSync(item.outputPath)) return reject(new Error(`Refusing to overwrite existing result: ${item.outputPath}`));
    const child = spawn(process.execPath, [configRunner, item.configPath], { cwd: root, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code !== 0) return reject(new Error(`Config failed (exit=${code}, signal=${signal}): ${item.configPath}`));
      if (!fs.existsSync(item.outputPath)) return reject(new Error(`Config exited successfully without result: ${item.outputPath}`));
      const result = readJson(item.outputPath);
      if (result.configSha256 !== item.configSha256 || result.engineJar?.sha256 !== manifest.engineJar.sha256) {
        return reject(new Error(`Result verification failed: ${item.outputPath}`));
      }
      if (result.aggregate?.battles !== item.battles) return reject(new Error(`Battle-count mismatch: ${item.outputPath}`));
      resolve({ ...item, resultSha256: sha256(item.outputPath), teamPerBattle: result.aggregate.teamPerBattle });
    });
  });
}

async function worker(id) {
  while (!failed) {
    const item = manifest.pending[nextIndex++];
    if (!item) return;
    console.log(`[focused worker ${id}] panel ${item.panel} ${item.arm}`);
    try {
      const result = await runConfig(item);
      complete.push(result);
      writeProgress("RUNNING");
      console.log(`[focused worker ${id}] complete ${complete.length}/32; team=${result.teamPerBattle.toFixed(6)}`);
    } catch (error) {
      failed = true;
      writeProgress("FAILED", String(error?.stack ?? error));
      rejectAll(error);
      return;
    }
  }
}

let rejectWorkers;
const workerFailure = new Promise((_, reject) => { rejectWorkers = reject; });
function rejectAll(error) { rejectWorkers(error); }

writeProgress("RUNNING");
await Promise.race([
  Promise.all(Array.from({ length: manifest.workers }, (_, index) => worker(index + 1))),
  workerFailure,
]);
if (!failed) {
  writeProgress("COMPLETE");
  console.log(`Focused paired continuation complete: ${progressPath}`);
}
