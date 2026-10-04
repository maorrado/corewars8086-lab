// Independently seeded, paired holdout for the preselected four-NOP neighbor.
// Freezes inputs only; battle execution is a separate explicit step.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { record, seedRange, overlaps, sha, equal, assert } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const mode = process.argv[2];
const frozen = path.join(here, 'nop4-holdout/frozen');
const outputRoot = path.join(repo, 'experiments/claude-e1p3-nop4-holdout-20261001');
const stressFile = path.join(repo, 'candidates/generated/claude-family-stress-20261001/frozen/manifest.json');
const stress = JSON.parse(fs.readFileSync(stressFile, 'utf8'));
const stressHash = sha(fs.readFileSync(stressFile));
equal(stressHash, fs.readFileSync(`${stressFile}.sha256`, 'utf8').trim(), 'stress manifest checksum');
const stressFiles = new Map(stress.files.map(item => [path.resolve(item.path), item]));
const oldHoldoutRandomness = JSON.parse(fs.readFileSync(path.join(here, 'holdout/frozen/randomness.json'), 'utf8'));
const screenManifestFile = path.join(repo, 'experiments/claude-e1p3-timing-screen-20261001/configs/screen-manifest.json');
const screenManifest = JSON.parse(fs.readFileSync(screenManifestFile, 'utf8'));
const local = {
  m049: ['A', 'B'].map(side => path.join(path.dirname(stressFile), 'binaries/m049', side)),
  m050: ['A', 'B'].map(side => path.join(path.dirname(stressFile), 'binaries/m050', side)),
  e1p3: ['e1p3A', 'e1p3B'].map(name => path.join(here, 'build', name)),
  nop4: ['e1p3A', 'e1p3B'].map(name => path.join(here, 'timing-builds/nop4', name)),
};
const arms = ['m049', 'm050', 'e1p3', 'nop4'];
const candidates = Object.fromEntries(arms.map(arm => [arm, local[arm]]));
const pool = stress.pool, zombies = stress.zombies;
function checked(file) {
  const actual = record(file), pinned = stressFiles.get(path.resolve(file));
  if (pinned) equal(actual, pinned, `input pin ${file}`);
  return actual;
}
const candidateFiles = Object.values(candidates).flat().map(checked);
assert(pool.length === 75 && new Set(pool.map(team => team.name)).size === 75, 'expected fixed 75-team pool');
assert(pool.filter(team => team.name.startsWith('A_')).length === 62 && pool.filter(team => team.name.startsWith('Y_')).length === 13,
  'expected 62 senior + 13 youth teams');
assert(zombies.length === 4, 'expected exactly four Zombies');
const poolFiles = pool.flatMap(team => team.warriors).map(checked), zombieFiles = zombies.map(zombie => checked(zombie.path));
const runtimeDir = path.join(repo, 'tools/engine-acceleration-20261001/runtime');
const runtimeFiles = ['research-batch.mjs', 'batch-format.mjs', 'SerialBatchMain.java'].map(file => checked(path.join(runtimeDir, file)))
  .concat(stress.researchRuntime.classes.map(item => checked(item.path)));
const engine = checked(stress.engine.path), java = checked(stress.java.path);
const localFiles = [
  path.join(here, 'e1p3-A.asm'), path.join(here, 'e1p3-B.asm'), path.join(here, 'timing-sources/nop4/e1p3-A.asm'),
  path.join(here, 'timing-sources/nop4/e1p3-B.asm'), path.join(here, 'timing-builds/nop4/manifest.json'),
  path.join(here, 'generate-nop4-holdout.mjs'), screenManifestFile,
].map(file => record(file));
function shuffle(salt, items) {
  let counter = 0, bytes = Buffer.alloc(0), offset = 0;
  function bounded(bound) {
    const limit = Math.floor(0x100000000 / bound) * bound;
    let value;
    do {
      if (offset + 4 > bytes.length) {
        const block = Buffer.alloc(8); block.writeBigUInt64BE(BigInt(counter++));
        bytes = crypto.createHash('sha256').update(Buffer.from(salt, 'hex')).update(block).digest(); offset = 0;
      }
      value = bytes.readUInt32BE(offset); offset += 4;
    } while (value >= limit);
    return value % bound;
  }
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) { const j = bounded(i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
function panelsFor(randomness) {
  return randomness.panels.map((draw, index) => {
    const expected = `panel-${String(index + 1).padStart(2, '0')}`;
    equal(draw.id, expected, 'panel identity');
    const arranged = shuffle(draw.salt, pool);
    return { id: draw.id, salt: draw.salt, seeds: draw.seeds, cohorts: Array.from({ length: 25 }, (_, j) => ({
      id: `${draw.id}-cohort-${String(j + 1).padStart(2, '0')}`, opponents: arranged.slice(j * 3, j * 3 + 3),
    })) };
  });
}
function configsFor(panels) {
  return panels.flatMap(panel => arms.map(arm => {
    const id = `${panel.id}-${arm}`;
    return { id, panel: panel.id, arm, path: path.join(frozen, 'configs', `${id}.json`), config: {
      experimentId: `claude-e1p3-nop4-holdout-20261001-${id}`, java: java.path, jar: engine.path,
      outputPath: path.join(outputRoot, 'scores', `${id}.json`), runDirectory: path.join(outputRoot, 'runs', id),
      candidate: { name: 'COD_pair', warriors: candidates[arm] }, battles: 25, threads: 1, parallel: false, telemetry: false,
      seeds: panel.seeds, cohorts: panel.cohorts, zombies,
    } };
  }));
}
const design = { arms, finalist: 'nop4', teams: 75, composition: { senior: 62, youth: 13 }, panels: 8,
  cohortsPerPanel: 25, seedsPerPanel: 2, battlesPerBlock: 25, battlesPerArm: 10000, totalBattles: 40000,
  threads: 1, parallel: false, telemetry: false, engine: 'pinned deterministic v6 JAR; zero gameplay overlays',
  metric: 'team points per candidate appearance', independenceUnit: 'eight independently salted panel-level paired deltas',
  confidence: { candidateComparisons: 3, criticalValue: 3.5,
    note: 'Conservative predeclared familywise interval for nop4 vs m049, m050, and e1p3 across eight paired panel means.' },
  limitation: 'Fresh seeds and new cohort shuffles against the same fixed 75 published 2025 online-stage teams and four Zombies; not a final-roster or unseen-opponent test.' };
function rangesFor(randomness) { return randomness.panels.flatMap(panel => panel.seeds.map(seed => seedRange(seed, 25))); }
const excludedRanges = [...new Map([
  ...stress.excludedRanges, ...stress.randomness.ranges, ...oldHoldoutRandomness.ranges,
  ...rangesFor({ panels: Array.from({ length: 8 }, (_, index) => ({ seeds: JSON.parse(fs.readFileSync(
    path.join(repo, 'candidates/generated/claude-e1-confirmation-20261001/frozen', `panel-${String(index + 1).padStart(2, '0')}-m050.json`), 'utf8')).seeds })) }),
].map(range => [JSON.stringify(range), range])).values()];

if (!['--preflight', '--freeze', '--verify'].includes(mode))
  throw new Error('usage: node generate-nop4-holdout.mjs --preflight|--freeze|--verify');
if (mode === '--preflight') {
  console.log(JSON.stringify({ ...design, stressManifestSha256: stressHash,
    candidateHashes: Object.fromEntries(arms.map(arm => [arm, candidates[arm].map(file => record(file).sha256)])),
    excludedSeedRanges: excludedRanges.length }, null, 2));
  process.exit(0);
}
if (mode === '--verify') {
  const manifestFile = path.join(frozen, 'manifest.json');
  equal(sha(fs.readFileSync(manifestFile)), fs.readFileSync(`${manifestFile}.sha256`, 'utf8').trim(), 'manifest checksum');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  equal(manifest.design, design, 'frozen design');
  for (const file of manifest.files) equal(record(file.path), file, `frozen file ${file.path}`);
  const randomness = JSON.parse(fs.readFileSync(path.join(frozen, 'randomness.json'), 'utf8'));
  equal(manifest.randomness, randomness, 'randomness bytes'); equal(manifest.panels, panelsFor(randomness), 'panel reconstruction');
  equal(randomness.ranges, rangesFor(randomness), 'range arithmetic');
  for (let i = 0; i < randomness.ranges.length; i++) {
    assert(!excludedRanges.some(old => overlaps(old, randomness.ranges[i])), 'fresh holdout overlaps a prior seed range');
    assert(!randomness.ranges.slice(0, i).some(old => overlaps(old, randomness.ranges[i])), 'holdout seed ranges overlap');
  }
  for (const item of configsFor(manifest.panels)) equal(JSON.parse(fs.readFileSync(item.path, 'utf8')), item.config, 'frozen config');
  console.log(JSON.stringify({ status: 'INPUTS_VERIFIED', manifestSha256: sha(fs.readFileSync(manifestFile)), design }));
  process.exit(0);
}
assert(!fs.existsSync(frozen), 'refusing to overwrite an existing entropy freeze');
fs.mkdirSync(path.join(frozen, 'configs'), { recursive: true });
const randomness = { drawnAt: new Date().toISOString(), salt: crypto.randomBytes(32).toString('hex'),
  panels: Array.from({ length: 8 }, (_, index) => ({ id: `panel-${String(index + 1).padStart(2, '0')}`,
    salt: crypto.randomBytes(32).toString('hex'), seeds: Array.from({ length: 2 }, (_, j) =>
      `claude-nop4-holdout-20261001-p${index + 1}-s${j + 1}-${crypto.randomBytes(12).toString('hex')}`) })) };
randomness.ranges = rangesFor(randomness); randomness.excludedRanges = excludedRanges;
for (let i = 0; i < randomness.ranges.length; i++) {
  assert(!excludedRanges.some(old => overlaps(old, randomness.ranges[i])), 'new seed range overlaps prior evidence');
  assert(!randomness.ranges.slice(0, i).some(old => overlaps(old, randomness.ranges[i])), 'new seed ranges overlap');
}
const panels = panelsFor(randomness);
fs.writeFileSync(path.join(frozen, 'randomness-attempt.json'), `${JSON.stringify(randomness, null, 2)}\n`, { flag: 'wx' });
fs.writeFileSync(path.join(frozen, 'randomness.json'), `${JSON.stringify(randomness, null, 2)}\n`, { flag: 'wx' });
const configs = configsFor(panels);
for (const item of configs) fs.writeFileSync(item.path, `${JSON.stringify(item.config, null, 2)}\n`, { flag: 'wx' });
const files = [...new Map([...candidateFiles, ...poolFiles, ...zombieFiles, ...runtimeFiles, engine, java, ...localFiles,
  record(stressFile), record(path.join(here, 'generate-nop4-holdout.mjs')), record(path.join(here, 'generate-timing-neighbors.mjs')),
  record(path.join(here, 'analyze-timing-neighbors.mjs')), record(path.join(frozen, 'randomness-attempt.json')),
  record(path.join(frozen, 'randomness.json')), ...configs.map(item => record(item.path))].map(item => [item.path, item])).values()];
const manifest = { schemaVersion: 1, suite: 'claude-e1p3-nop4-fresh-holdout-20261001', frozenAt: new Date().toISOString(),
  design, stressManifest: record(stressFile), excludedRanges, randomness, panels,
  candidates: Object.fromEntries(arms.map(arm => [arm, candidates[arm].map(file => record(file))])), engine, java, files };
const manifestFile = path.join(frozen, 'manifest.json');
fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
fs.writeFileSync(`${manifestFile}.sha256`, `${sha(fs.readFileSync(manifestFile))}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: 'FROZEN_NOT_RUN', manifestSha256: sha(fs.readFileSync(manifestFile)), design, configs: configs.length }, null, 2));
