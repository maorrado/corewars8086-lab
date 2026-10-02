import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const sourceDir = path.join(repo, 'experiments/b01d-e1p4-validation-20261002');
const outDir = path.join(repo, 'experiments/b01d-e1p4-validation-20261002-parallel');
if (fs.existsSync(outDir)) throw new Error(`refusing to overwrite ${outDir}`);
const sourceManifestPath = path.join(sourceDir, 'manifest.json');
const sourceManifest = JSON.parse(fs.readFileSync(sourceManifestPath, 'utf8'));
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const shaFile = file => sha(fs.readFileSync(file));
if (shaFile(sourceManifestPath) !== fs.readFileSync(`${sourceManifestPath}.sha256`, 'utf8').trim()) throw new Error('source manifest hash mismatch');
if (sourceManifest.configs.length !== 64 || sourceManifest.design.totalBattles !== 80000) throw new Error('source frozen design dimensions changed');

const configsDir = path.join(outDir, 'configs');
fs.mkdirSync(configsDir, { recursive: true });
fs.mkdirSync(path.join(outDir, 'results'));
fs.mkdirSync(path.join(outDir, 'runs'));
fs.mkdirSync(path.join(outDir, 'logs'));
const configs = [];
for (const item of sourceManifest.configs) {
  const config = JSON.parse(fs.readFileSync(item.path, 'utf8'));
  const experimentId = `${config.experimentId}-parallel`;
  config.experimentId = experimentId;
  config.outputPath = path.join(outDir, 'results', `${experimentId}.json`);
  config.runDirectory = path.join(outDir, 'runs', experimentId);
  const outputPath = path.join(configsDir, `${experimentId}.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`, { flag: 'wx' });
  configs.push({ ...item, path: outputPath, sha256: shaFile(outputPath), experimentId });
}
const manifest = {
  ...sourceManifest,
  status: 'FROZEN_BEFORE_PARALLEL_RUN',
  sourceManifestPath,
  sourceManifestSha256: shaFile(sourceManifestPath),
  execution: {
    mode: 'original-deterministic-jar-two-config-workers',
    workers: 2,
    threadsPerBattleProcess: 4,
    originalEngineSemantics: true,
    note: 'Same 16 seeds/cohort partitions, exact candidate binaries, 50 battles per cohort and original deterministic JAR as the source frozen manifest. Only distinct output paths and config execution scheduling differ. Partial first-attempt results are excluded from analysis.',
  },
  configs,
};
const manifestPath = path.join(outDir, 'manifest.json');
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
fs.writeFileSync(`${manifestPath}.sha256`, `${shaFile(manifestPath)}\n`, { flag: 'wx' });
console.log(JSON.stringify({
  output: outDir,
  manifestSha256: shaFile(manifestPath),
  sourceManifestSha256: manifest.sourceManifestSha256,
  configs: configs.length,
  totalBattles: manifest.design.totalBattles,
  workers: manifest.execution.workers,
  engineJarSha256: manifest.engineJar.sha256,
}, null, 2));
