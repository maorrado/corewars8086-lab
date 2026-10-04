import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const experimentDir = process.argv[2]
  ? path.resolve(repo, process.argv[2])
  : path.join(repo, 'experiments/e1p4-general-confirmation-20261002');
const manifestPath = path.join(experimentDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
if (sha(fs.readFileSync(manifestPath)) !== fs.readFileSync(path.join(experimentDir, 'manifest.json.sha256'), 'utf8').trim()) throw new Error('manifest hash mismatch');
const benchmark = path.join(repo, 'official-benchmark.mjs');
for (let i = 0; i < manifest.configs.length; i++) {
  const record = manifest.configs[i];
  const bytes = fs.readFileSync(record.path);
  if (sha(bytes) !== record.sha256) throw new Error(`config hash mismatch: ${record.path}`);
  const config = JSON.parse(bytes);
  if (fs.existsSync(config.outputPath)) throw new Error(`refusing existing result: ${config.outputPath}`);
  console.log(`[${i + 1}/${manifest.configs.length}] starting panel ${record.panel}/${manifest.design.panels}, ${record.arm}`);
  const stdout = execFileSync(process.execPath, [benchmark, record.path], { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const summary = stdout.match(/aggregate:.*$/m)?.[0];
  if (!summary) throw new Error(`missing aggregate for panel ${record.panel}/${record.arm}`);
  const result = JSON.parse(fs.readFileSync(config.outputPath, 'utf8'));
  if (result.aggregate.battles !== record.battles) throw new Error(`battle count mismatch for panel ${record.panel}/${record.arm}`);
  if (result.engineJar.sha256 !== manifest.engineJar.sha256) throw new Error(`engine mismatch for panel ${record.panel}/${record.arm}`);
  console.log(`[${i + 1}/${manifest.configs.length}] done panel ${record.panel}/${record.arm}; ${summary}`);
}
console.log('all confirmatory runs completed');
