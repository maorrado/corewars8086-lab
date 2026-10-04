import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const stress = path.join(repo, 'candidates/generated/claude-family-stress-20261001/frozen');
const root = path.join(repo, 'experiments/m050-xorb-family-stress-20261001');
const configRoot = path.join(root, 'configs');
if (fs.existsSync(root)) throw new Error(`refusing to overwrite ${root}`);
const identity = file => ({ path: file, bytes: fs.statSync(file).size,
  sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') });
const xorbA = path.join(repo, 'build/m050-pointer-operator/xor-b/A');
const xorbB = path.join(repo, 'build/m050-pointer-operator/xor-b/B');
const baselineA = path.join(stress, 'binaries/m050/A');
const baselineB = path.join(stress, 'binaries/m050/B');
if (identity(xorbA).sha256 !== identity(baselineA).sha256) throw new Error('XOR-B A is not byte-identical to frozen m050 A');
const oldB = fs.readFileSync(baselineB), newB = fs.readFileSync(xorbB);
if (oldB.length !== newB.length) throw new Error('XOR-B B changed binary length');
const diff = [];
for (let i = 0; i < oldB.length; i++) if (oldB[i] !== newB[i]) diff.push({ offset: i, before: oldB[i], after: newB[i] });
if (diff.length !== 1 || diff[0].offset !== 0x69 || diff[0].before !== 0x29 || diff[0].after !== 0x31)
  throw new Error(`XOR-B is not the previously tested one-byte intervention: ${JSON.stringify(diff)}`);

const sourceConfigRoot = path.join(stress, 'configs');
const sourceConfigs = fs.readdirSync(sourceConfigRoot).filter(name => /^population-k[0-3]-\d+-m050-o[12]\.json$/.test(name)).sort();
if (sourceConfigs.length !== 160) throw new Error(`expected 160 frozen m050 population configs, found ${sourceConfigs.length}`);
fs.mkdirSync(configRoot, { recursive: true });
const entries = [];
for (const name of sourceConfigs) {
  const source = path.join(sourceConfigRoot, name);
  const config = JSON.parse(fs.readFileSync(source, 'utf8'));
  config.candidate.warriors = [xorbA, xorbB];
  const stem = name.replace('-m050-', '-xorb-');
  config.outputPath = path.join(root, 'results', stem.replace('.json', '.json'));
  config.runDirectory = path.join(root, 'runs', stem.replace('.json', ''));
  const target = path.join(configRoot, stem);
  fs.writeFileSync(target, `${JSON.stringify(config, null, 2)}\n`, { flag: 'wx' });
  entries.push({ source, sourceSha256: identity(source).sha256, config: target,
    configSha256: identity(target).sha256, id: stem, cohortId: config.cohorts[0].id,
    orientation: /-o2\.json$/.test(name) ? 2 : 1, k: Number(name.match(/population-k([0-3])/)[1]),
    seed: config.seeds[0], battles: config.battles });
}
const baseManifest = path.join(stress, 'manifest.json');
const manifest = { status: 'GENERATED_NOT_RUN', purpose: 'paired extension arm only; same frozen family-stress cohorts, K strata, seeds, Zombies, opponents and name orientations as the original m050 arm',
  stressManifestSha256: identity(baseManifest).sha256, xorb: { A: identity(xorbA), B: identity(xorbB), m050BChanges: diff },
  unit: '160 configs x 10 battles = 1,600; reuse existing frozen m050 outcomes as matched control, not independent evidence',
  configs: entries };
fs.writeFileSync(path.join(root, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ configs: entries.length, physicalWars: entries.reduce((sum, x) => sum + x.battles, 0), output: root }, null, 2));
