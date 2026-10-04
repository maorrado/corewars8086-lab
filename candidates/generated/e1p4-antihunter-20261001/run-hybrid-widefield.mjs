import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const experimentDir = process.argv[2] ? path.resolve(repo, process.argv[2]) : path.join(repo, 'experiments/e1p3-e1p4-hybrid-widefield-20261002');
const manifestPath = path.join(experimentDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
if (sha(fs.readFileSync(manifestPath)) !== fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim()) throw new Error('manifest hash mismatch');
if (sha(fs.readFileSync(manifest.engineJar.path)) !== manifest.engineJar.sha256) throw new Error('engine JAR hash mismatch');
for (const [arm, warriors] of Object.entries(manifest.candidates)) for (const warrior of warriors) {
  if (sha(fs.readFileSync(warrior.path)) !== warrior.sha256) throw new Error(`${arm} binary changed: ${warrior.path}`);
}
for (let index = 0; index < manifest.configs.length; index++) {
  const record = manifest.configs[index];
  if (sha(fs.readFileSync(record.path)) !== record.sha256) throw new Error(`config hash mismatch: ${record.path}`);
  const config = JSON.parse(fs.readFileSync(record.path, 'utf8'));
  if (fs.existsSync(config.outputPath)) throw new Error(`refusing existing result: ${config.outputPath}`);
  console.log(`[${index + 1}/${manifest.configs.length}] start panel ${record.panel}/${manifest.design.panels} ${record.arm}`);
  const stdout = execFileSync(process.execPath, [path.join(repo, 'official-benchmark.mjs'), record.path], { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const summary = stdout.match(/aggregate:.*$/m)?.[0];
  if (!summary) throw new Error(`missing aggregate: ${record.path}`);
  const result = JSON.parse(fs.readFileSync(config.outputPath, 'utf8'));
  if (result.aggregate.battles !== record.battles || result.engineJar.sha256 !== manifest.engineJar.sha256) throw new Error(`result validation failed: ${record.path}`);
  console.log(`[${index + 1}/${manifest.configs.length}] done ${summary}`);
}
console.log('all hybrid widefield runs completed');
