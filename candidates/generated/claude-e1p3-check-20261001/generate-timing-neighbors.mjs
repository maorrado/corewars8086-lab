import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const frozen = path.join(repo, 'candidates/generated/claude-e1-confirmation-20261001/frozen');
const baseA = path.join(here, 'e1p3-A.asm');
const baseB = path.join(here, 'e1p3-B.asm');
const buildRoot = path.join(here, 'timing-builds');
const sourceRoot = path.join(here, 'timing-sources');
const configRoot = path.join(repo, 'experiments/claude-e1p3-timing-screen-20261001/configs');
const screenManifest = path.join(configRoot, 'screen-manifest.json');
const frozenHash = 'e1e25fbe3ad90726f3894cfd23438c4f2954b96ae1f13d1d55a9125910ecc596';
const variants = [{ id: 'nop2', nops: 2 }, { id: 'nop4', nops: 4 }];
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });

if (process.argv[2] === '--verify') {
  const manifestBytes = fs.readFileSync(screenManifest);
  const manifest = JSON.parse(manifestBytes);
  if (manifest.frozenSuiteManifestSha256 !== frozenHash) throw new Error('wrong base screen manifest');
  for (const item of manifest.configs) {
    if (sha(fs.readFileSync(item.path)) !== item.sha256) throw new Error(`config source changed: ${item.path}`);
  }
  for (const item of manifest.sources) {
    if (sha(fs.readFileSync(item.path)) !== item.sha256) throw new Error(`variant source changed: ${item.path}`);
  }
  for (const item of manifest.binaries) {
    if (fs.statSync(item.path).size !== item.bytes || sha(fs.readFileSync(item.path)) !== item.sha256)
      throw new Error(`variant binary changed: ${item.path}`);
  }
  console.log(JSON.stringify({ status: 'VERIFIED_NO_RUNS', manifestSha256: sha(manifestBytes),
    configs: manifest.configs.length, variants: manifest.variants }));
  process.exit(0);
}

if (!fs.existsSync(baseA) || !fs.existsSync(baseB)) throw new Error('missing frozen e1p3 sources');
if (sha(fs.readFileSync(path.join(frozen, 'manifest.json'))) !== frozenHash) throw new Error('base screen manifest changed');
for (const target of [sourceRoot, configRoot, buildRoot]) if (fs.existsSync(target)) throw new Error(`refusing to overwrite ${target}`);

fs.mkdirSync(sourceRoot, { recursive: true });
fs.mkdirSync(configRoot, { recursive: true });
const sourceRecords = [], binaryRecords = [], configRecords = [];
for (const variant of variants) {
  const folder = path.join(sourceRoot, variant.id);
  fs.mkdirSync(folder, { recursive: true });
  const originalA = fs.readFileSync(baseA, 'utf8');
  const anchor = '    nop\n    nop\n    nop\n\nphoenix_pointer_ready:';
  if (originalA.split(anchor).length - 1 !== 1) throw new Error('expected exact three-NOP timing anchor');
  const replacement = `${'    nop\n'.repeat(variant.nops)}\nphoenix_pointer_ready:`;
  const sources = [originalA.replace(anchor, replacement), fs.readFileSync(baseB, 'utf8')];
  for (let index = 0; index < 2; index++) {
    const name = index === 0 ? 'e1p3-A.asm' : 'e1p3-B.asm';
    const file = path.join(folder, name);
    fs.writeFileSync(file, sources[index], { flag: 'wx' });
    sourceRecords.push({ variant: variant.id, path: file, bytes: Buffer.byteLength(sources[index]), sha256: sha(sources[index]) });
  }
  const binaryFolder = path.join(buildRoot, variant.id);
  execFileSync(process.execPath, [path.join(here, 'assemble-local.mjs'), binaryFolder,
    path.join(folder, 'e1p3-A.asm'), path.join(folder, 'e1p3-B.asm')], { stdio: 'inherit', windowsHide: true });
  for (let index = 0; index < 2; index++) {
    const binary = path.join(binaryFolder, index === 0 ? 'e1p3A' : 'e1p3B');
    binaryRecords.push({ variant: variant.id, path: binary, bytes: fs.statSync(binary).size, sha256: sha(fs.readFileSync(binary)) });
  }
  for (let panel = 1; panel <= 8; panel++) {
    const panelId = String(panel).padStart(2, '0');
    const input = path.join(frozen, `panel-${panelId}-m050.json`);
    const inputBytes = fs.readFileSync(input);
    const config = JSON.parse(inputBytes);
    config.experimentId = `claude-e1p3-timing-screen-20261001-${variant.id}-panel-${panelId}`;
    config.candidate.warriors = [path.join(buildRoot, variant.id, 'e1p3A'), path.join(buildRoot, variant.id, 'e1p3B')];
    config.outputPath = path.join(repo, `experiments/claude-e1p3-timing-screen-20261001/results/${variant.id}/panel-${panelId}.json`);
    config.runDirectory = path.join(repo, `experiments/claude-e1p3-timing-screen-20261001/runs/${variant.id}/panel-${panelId}`);
    const target = path.join(configRoot, `${variant.id}-panel-${panelId}.json`);
    const bytes = Buffer.from(`${JSON.stringify(config, null, 2)}\n`);
    fs.writeFileSync(target, bytes, { flag: 'wx' });
    configRecords.push({ variant: variant.id, panel: panelId, path: target, bytes: bytes.length,
      sha256: sha(bytes), sourcePanel: input, sourcePanelSha256: sha(inputBytes), seeds: config.seeds,
      cohorts: config.cohorts.length, battles: config.battles,
      physicalWars: config.seeds.length * config.cohorts.length * config.battles });
  }
}
const manifest = { protocol: 'Exploratory timing-neighbor screen only. Reuses the already-seen frozen eight-panel 2025 online-stage screen; no inference/holdout claim. Only A bootstrap NOP count changes; B is byte-identical to e1p3 B.',
  frozenSuiteManifestSha256: frozenHash,
  variants: variants.map(({ id, nops }) => ({ id, nops })), sources: sourceRecords, binaries: binaryRecords, configs: configRecords };
writeJson(screenManifest, manifest);
console.log(JSON.stringify({ status: 'GENERATED', variants: manifest.variants, configs: configRecords.length,
  physicalWars: configRecords.reduce((sum, item) => sum + item.physicalWars, 0), screenManifest }, null, 2));
