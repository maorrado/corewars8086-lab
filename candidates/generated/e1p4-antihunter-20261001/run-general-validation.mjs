import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const experimentDir = path.join(repo, 'experiments/e1p4-general-validation-20261001');
const manifestPath = path.join(experimentDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const expectedManifestHash = fs.readFileSync(path.join(experimentDir, 'manifest.json.sha256'), 'utf8').trim();
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
if (sha(fs.readFileSync(manifestPath)) !== expectedManifestHash) throw new Error('frozen manifest hash mismatch');
const benchmark = path.join(repo, 'official-benchmark.mjs');

for (let index = 0; index < manifest.configs.length; index++) {
  const config = manifest.configs[index];
  const configValue = JSON.parse(fs.readFileSync(config.path, 'utf8'));
  const resultPath = configValue.outputPath;
  if (fs.existsSync(resultPath)) throw new Error(`refusing existing result: ${resultPath}`);
  if (sha(fs.readFileSync(config.path)) !== config.sha256) throw new Error(`config hash mismatch: ${config.path}`);
  console.log(`[${index + 1}/${manifest.configs.length}] starting panel ${config.panel} / ${config.arm}`);
  const stdout = execFileSync(process.execPath, [benchmark, config.path], {
    cwd: repo,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const summary = stdout.match(/aggregate:.*$/m)?.[0];
  if (!summary) throw new Error(`missing aggregate line for ${config.arm} panel ${config.panel}`);
  const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  if (result.aggregate.battles !== config.battles) throw new Error(`wrong battle count: ${config.arm} panel ${config.panel}`);
  if (result.engineJar.sha256 !== manifest.engineJar.sha256) throw new Error(`engine hash mismatch: ${config.arm} panel ${config.panel}`);
  console.log(`[${index + 1}/${manifest.configs.length}] done panel ${config.panel} / ${config.arm}; ${summary}`);
}
console.log('all frozen general-field runs completed');
