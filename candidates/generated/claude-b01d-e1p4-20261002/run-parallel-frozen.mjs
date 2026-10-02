import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const experimentDir = path.resolve(process.argv[2] ?? path.join(repo, 'experiments/b01d-e1p4-validation-20261002-parallel'));
const manifestPath = path.join(experimentDir, 'manifest.json');
const manifestBytes = fs.readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes);
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const shaFile = file => sha(fs.readFileSync(file));
if (sha(manifestBytes) !== fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim()) throw new Error('parallel manifest hash mismatch');
if (manifest.status !== 'FROZEN_BEFORE_PARALLEL_RUN') throw new Error('unexpected parallel manifest status');
if (manifest.execution.workers !== 2 || manifest.configs.length !== 64) throw new Error('unexpected worker/config count');
const benchmark = path.join(repo, 'official-benchmark.mjs');
const progressPath = path.join(experimentDir, 'progress.json');
if (fs.existsSync(progressPath)) throw new Error(`refusing existing progress file ${progressPath}`);
for (const item of manifest.configs) {
  if (shaFile(item.path) !== item.sha256) throw new Error(`config hash mismatch: ${item.path}`);
  const config = JSON.parse(fs.readFileSync(item.path, 'utf8'));
  if (fs.existsSync(config.outputPath) || fs.existsSync(config.runDirectory)) throw new Error(`refusing existing output ${item.arm}/p${item.panel}`);
}

let next = 0;
let completed = 0;
const records = [];
let stop = false;
const workerCount = manifest.execution.workers;
function launch(item, workerIndex) {
  const config = JSON.parse(fs.readFileSync(item.path, 'utf8'));
  const logPath = path.join(experimentDir, 'logs', `${item.experimentId}.log`);
  const log = fs.createWriteStream(logPath, { flags: 'wx' });
  return new Promise((resolve, reject) => {
    const started = new Date().toISOString();
    const begin = process.hrtime.bigint();
    const child = spawn(process.execPath, [benchmark, item.path], { cwd: repo, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let tailOut = '', tailErr = '';
    child.stdout.on('data', chunk => {
      log.write(chunk);
      tailOut = (tailOut + chunk.toString()).slice(-25000);
    });
    child.stderr.on('data', chunk => {
      log.write(chunk);
      tailErr = (tailErr + chunk.toString()).slice(-25000);
    });
    child.on('error', error => {
      log.end();
      reject(error);
    });
    child.on('close', code => {
      log.end();
      if (code !== 0) {
        reject(new Error(`worker ${workerIndex} failed ${item.experimentId} (exit ${code})\n${tailErr}\n${tailOut.slice(-6000)}`));
        return;
      }
      if (!fs.existsSync(config.outputPath)) {
        reject(new Error(`missing result after successful exit: ${config.outputPath}\n${tailOut.slice(-6000)}`));
        return;
      }
      const result = JSON.parse(fs.readFileSync(config.outputPath, 'utf8'));
      if (result.aggregate.battles !== item.battles || result.engineJar.sha256 !== manifest.engineJar.sha256) {
        reject(new Error(`wrong battle count or engine hash in ${item.experimentId}`));
        return;
      }
      const aggregate = tailOut.match(/aggregate:.*$/m)?.[0] ?? `aggregate=${result.aggregate.teamPerBattle}`;
      resolve({
        worker: workerIndex,
        arm: item.arm,
        panel: item.panel,
        startedAt: started,
        elapsedSeconds: Number(process.hrtime.bigint() - begin) / 1e9,
        outputPath: config.outputPath,
        outputSha256: shaFile(config.outputPath),
        candidateMean: result.aggregate.teamPerBattle,
        battles: result.aggregate.battles,
        aggregate,
        logPath,
      });
    });
  });
}
function saveProgress() {
  fs.writeFileSync(progressPath, `${JSON.stringify({
    status: stop ? 'FAILED' : completed === manifest.configs.length ? 'COMPLETE' : 'RUNNING',
    generatedAt: new Date().toISOString(),
    manifestSha256: sha(manifestBytes),
    completed,
    total: manifest.configs.length,
    records,
  }, null, 2)}\n`);
}
async function worker(workerIndex) {
  while (!stop) {
    const index = next++;
    if (index >= manifest.configs.length) return;
    const item = manifest.configs[index];
    console.log(`[worker ${workerIndex}] begin ${index + 1}/${manifest.configs.length} ${item.arm} panel ${item.panel}`);
    try {
      const record = await launch(item, workerIndex);
      records.push(record);
      completed++;
      saveProgress();
      console.log(`[worker ${workerIndex}] done ${completed}/${manifest.configs.length} ${item.arm} panel ${item.panel}; ${record.aggregate}; ${record.elapsedSeconds.toFixed(1)}s`);
    } catch (error) {
      stop = true;
      saveProgress();
      throw error;
    }
  }
}
try {
  await Promise.all(Array.from({ length: workerCount }, (_, i) => worker(i + 1)));
  saveProgress();
  console.log(`all ${manifest.configs.length} frozen two-worker runs completed`);
} catch (error) {
  stop = true;
  console.error(error.stack ?? error);
  process.exitCode = 1;
}
