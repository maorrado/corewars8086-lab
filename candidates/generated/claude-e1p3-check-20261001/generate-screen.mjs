import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const frozen = path.join(repo, 'candidates/generated/claude-e1-confirmation-20261001/frozen');
const binaries = path.join(here, 'build');
const output = path.join(repo, 'experiments/claude-e1p3-screen-20261001/configs');
if (!fs.existsSync(path.join(binaries, 'e1p3A')) || !fs.existsSync(path.join(binaries, 'e1p3B')))
  throw new Error('assemble and verify e1p3A/e1p3B before generating benchmark configs');
if (fs.existsSync(output)) throw new Error(`refusing to overwrite ${output}`);
fs.mkdirSync(output, { recursive: true });

const result = [];
for (let panel = 1; panel <= 8; panel++) {
  const id = String(panel).padStart(2, '0');
  const sourcePath = path.join(frozen, `panel-${id}-m050.json`);
  const config = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  config.candidate.warriors = [path.join(binaries, 'e1p3A'), path.join(binaries, 'e1p3B')];
  config.outputPath = path.join(repo, `experiments/claude-e1p3-screen-20261001/results/panel-${id}.json`);
  config.runDirectory = path.join(repo, `experiments/claude-e1p3-screen-20261001/runs/panel-${id}`);
  const target = path.join(output, `panel-${id}-e1p3.json`);
  fs.writeFileSync(target, `${JSON.stringify(config, null, 2)}\n`, { flag: 'wx' });
  result.push({ panel: id, source: sourcePath, config: target, seeds: config.seeds, battles: config.battles,
    cohorts: config.cohorts.length, physicalWars: config.seeds.length * config.cohorts.length * config.battles });
}
fs.writeFileSync(path.join(output, 'screen-manifest.json'), `${JSON.stringify({
  protocol: 'paired reuse of the already-frozen eight-panel 2025 online-stage screen; exploratory only, not a fresh holdout',
  frozenSuiteManifestSha256: 'e1e25fbe3ad90726f3894cfd23438c4f2954b96ae1f13d1d55a9125910ecc596',
  candidateSources: ['e1p3-A.asm', 'e1p3-B.asm'], results: result,
}, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ panels: result.length, physicalWars: result.reduce((sum, x) => sum + x.physicalWars, 0), output }, null, 2));
