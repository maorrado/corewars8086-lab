import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const experimentDir = path.join(repo, 'experiments/b01d-fiveway-crossyear-20261002');
const manifestPath = path.join(experimentDir, 'manifest.json');
const manifestBytes = fs.readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const shaFile = file => sha(fs.readFileSync(file));
if (sha(manifestBytes) !== fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim()) throw new Error('manifest SHA-256 mismatch');
if (manifest.status !== 'FROZEN_BEFORE_RUN' || manifest.execution.workers !== 2) throw new Error('unexpected frozen status/worker count');
if (manifest.configs.length !== 80 || manifest.design.totalBattles !== 176000) throw new Error('frozen dimensions changed');
if (shaFile(manifest.engineJar.path) !== manifest.engineJar.sha256) throw new Error('engine JAR changed');
const benchmark = path.join(repo, 'official-benchmark.mjs');
const progressPath = path.join(experimentDir, 'progress.json');
if (fs.existsSync(progressPath)) throw new Error(`refusing existing progress file ${progressPath}`);
for (const item of manifest.configs) {
  if (shaFile(item.path) !== item.sha256) throw new Error(`config hash mismatch: ${item.path}`);
  const config = JSON.parse(fs.readFileSync(item.path, 'utf8'));
  if (fs.existsSync(config.outputPath) || fs.existsSync(config.runDirectory)) throw new Error(`refusing existing output for ${item.arm}/p${item.panel}`);
}

let next = 0;
let completed = 0;
let failed = false;
const records = [];
const workerCount = manifest.execution.workers;

function runConfig(item, workerId) {
  const config = JSON.parse(fs.readFileSync(item.path, 'utf8'));
  const logPath = path.join(experimentDir, 'logs', `${item.experimentId ?? path.basename(item.path, '.json')}.log`);
  const log = fs.createWriteStream(logPath, { flags: 'wx' });
  return new Promise((resolve, reject) => {
    const startedAt = new Date().toISOString();
    const started = process.hrtime.bigint();
    const child = spawn(process.execPath, [benchmark, item.path], { cwd: repo, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdoutTail = '';
    let stderrTail = '';
    child.stdout.on('data', chunk => { log.write(chunk); stdoutTail = (stdoutTail + chunk.toString()).slice(-20000); });
    child.stderr.on('data', chunk => { log.write(chunk); stderrTail = (stderrTail + chunk.toString()).slice(-20000); });
    child.on('error', error => { log.end(); reject(error); });
    child.on('close', code => {
      log.end();
      if (code !== 0) return reject(new Error(`worker ${workerId} failed ${path.basename(item.path)} exit=${code}\n${stderrTail}\n${stdoutTail.slice(-4000)}`));
      if (!fs.existsSync(config.outputPath)) return reject(new Error(`missing result after successful exit: ${config.outputPath}`));
      const result = JSON.parse(fs.readFileSync(config.outputPath, 'utf8'));
      if (result.aggregate.battles !== item.battles || result.engineJar.sha256 !== manifest.engineJar.sha256) {
        return reject(new Error(`battle-count or engine-hash mismatch in ${path.basename(item.path)}`));
      }
      const aggregate = stdoutTail.match(/aggregate:.*$/m)?.[0] ?? `aggregate=${result.aggregate.teamPerBattle}`;
      resolve({
        worker: workerId,
        arm: item.arm,
        panel: item.panel,
        startedAt,
        elapsedSeconds: Number(process.hrtime.bigint() - started) / 1e9,
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
    status: failed ? 'FAILED' : completed === manifest.configs.length ? 'COMPLETE' : 'RUNNING',
    updatedAt: new Date().toISOString(),
    manifestSha256: sha(manifestBytes),
    completed,
    total: manifest.configs.length,
    records,
  }, null, 2)}\n`);
}

async function worker(workerId) {
  while (!failed) {
    const index = next++;
    if (index >= manifest.configs.length) return;
    const item = manifest.configs[index];
    console.log(`[worker ${workerId}] begin ${index + 1}/${manifest.configs.length} ${item.arm} panel ${item.panel}`);
    try {
      const record = await runConfig(item, workerId);
      records.push(record);
      completed++;
      saveProgress();
      console.log(`[worker ${workerId}] done ${completed}/${manifest.configs.length} ${item.arm} panel ${item.panel}; ${record.aggregate}; ${record.elapsedSeconds.toFixed(1)}s`);
    } catch (error) {
      failed = true;
      saveProgress();
      throw error;
    }
  }
}

try {
  await Promise.all(Array.from({ length: workerCount }, (_, i) => worker(i + 1)));
  saveProgress();
  console.log(`all ${manifest.configs.length} frozen five-way runs completed`);
} catch (error) {
  failed = true;
  console.error(error.stack ?? error);
  process.exitCode = 1;
}
