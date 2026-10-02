import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const experimentDir = path.join(repo, 'experiments/b01d-e1p4-validation-20261002');
const manifestPath = path.join(experimentDir, 'manifest.json');
const manifestHashFile = `${manifestPath}.sha256`;
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const manifestBytes = fs.readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes);
if (sha(manifestBytes) !== fs.readFileSync(manifestHashFile, 'utf8').trim()) throw new Error('frozen manifest hash mismatch');
if (manifest.status !== 'FROZEN_BEFORE_RUN') throw new Error(`unexpected manifest status ${manifest.status}`);
if (manifest.configs.length !== 64 || manifest.design.totalBattles !== 80000) throw new Error('frozen design dimensions mismatch');
const benchmark = path.join(repo, 'official-benchmark.mjs');
for (let index = 0; index < manifest.configs.length; index++) {
  const item = manifest.configs[index];
  if (sha(fs.readFileSync(item.path)) !== item.sha256) throw new Error(`config hash mismatch: ${item.path}`);
  const config = JSON.parse(fs.readFileSync(item.path, 'utf8'));
  if (fs.existsSync(config.outputPath) || fs.existsSync(config.runDirectory)) throw new Error(`refusing existing output for ${item.arm}/panel ${item.panel}`);
  console.log(`[${index + 1}/${manifest.configs.length}] begin ${item.arm} panel ${item.panel}`);
  const stdout = execFileSync(process.execPath, [benchmark, item.path], {
    cwd: repo,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const aggregate = stdout.match(/aggregate:.*$/m)?.[0];
  if (!aggregate) throw new Error(`missing aggregate for ${item.arm}/panel ${item.panel}`);
  const result = JSON.parse(fs.readFileSync(config.outputPath, 'utf8'));
  if (result.aggregate.battles !== item.battles) throw new Error(`wrong battle count ${item.arm}/panel ${item.panel}`);
  if (result.engineJar.sha256 !== manifest.engineJar.sha256) throw new Error(`engine hash mismatch ${item.arm}/panel ${item.panel}`);
  console.log(`[${index + 1}/${manifest.configs.length}] done ${item.arm} panel ${item.panel}; ${aggregate}`);
}
console.log('all frozen paired b01d evaluation runs completed');
