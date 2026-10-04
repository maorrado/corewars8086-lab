// Fresh, paired fourth e1p3 confirmation. Freeze inputs/seeds first; run separately.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assert, equal, overlaps, record, seedRange, sha } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const frozen = path.join(here, 'fourth-holdout/frozen');
const root = path.join(repo, 'experiments/claude-e1p3-fourth-holdout-20261001');
const mode = process.argv[2];
assert(['--preflight', '--freeze', '--verify'].includes(mode), 'usage: node generate-fourth-holdout.mjs --preflight|--freeze|--verify');

const stressFile = path.join(repo, 'candidates/generated/claude-family-stress-20261001/frozen/manifest.json');
const stressBytes = fs.readFileSync(stressFile), stress = JSON.parse(stressBytes);
equal(sha(stressBytes), fs.readFileSync(`${stressFile}.sha256`, 'utf8').trim(), 'family stress manifest checksum');
const stressFiles = new Map(stress.files.map(file => [path.resolve(file.path), file]));
const checked = file => {
  const actual = record(file), expected = stressFiles.get(path.resolve(file));
  if (expected) equal(actual, expected, `pinned prior input ${file}`);
  return actual;
};
const binaries = {
  m049: ['A', 'B'].map(side => path.join(path.dirname(stressFile), 'binaries/m049', side)),
  m050: ['A', 'B'].map(side => path.join(path.dirname(stressFile), 'binaries/m050', side)),
  e1p3: ['e1p3A', 'e1p3B'].map(name => path.join(here, 'build', name)),
};
const arms = ['m049', 'm050', 'e1p3'];
const pool = stress.pool, zombies = stress.zombies;
assert(pool.length === 75 && new Set(pool.map(team => team.name)).size === 75, 'expected exact fixed 75-team pool');
assert(pool.filter(team => team.name.startsWith('A_')).length === 62
  && pool.filter(team => team.name.startsWith('Y_')).length === 13, 'expected 62 senior + 13 youth');
assert(zombies.length === 4, 'expected exactly four Zombies');
const candidateFiles = arms.flatMap(arm => binaries[arm].map(checked));
const poolFiles = pool.flatMap(team => team.warriors).map(checked), zombieFiles = zombies.map(zombie => checked(zombie.path));
const runtimeDir = path.join(repo, 'tools/engine-acceleration-20261001/runtime');
const runtimeFiles = ['research-batch.mjs', 'batch-format.mjs', 'SerialBatchMain.java']
  .map(name => checked(path.join(runtimeDir, name))).concat(stress.researchRuntime.classes.map(item => checked(item.path)));
const engine = checked(stress.engine.path), java = checked(stress.java.path);

const priorRandomnessFiles = [
  path.join(here, 'holdout/frozen/randomness.json'),
  path.join(here, 'nop4-holdout/frozen/randomness.json'),
  path.join(here, 'third-holdout/frozen/randomness.json'),
  path.join(repo, 'candidates/generated/claude-e1-confirmation-20261001/frozen/randomness.json'),
  path.join(repo, 'candidates/generated/e1p3-five-copy-density-20261001/frozen/randomness.json'),
  path.join(repo, 'candidates/generated/claude-e1p3-xorb-20261001/frozen/randomness.json'),
];
const previous = priorRandomnessFiles.map(file => ({ file, bytes: fs.readFileSync(file), randomness: JSON.parse(fs.readFileSync(file, 'utf8')) }));
const ranges = value => [...(value.ranges ?? []), ...(value.excludedRanges ?? [])];
const excludedRanges = [...new Map([
  ...stress.excludedRanges,
  ...stress.randomness.ranges,
  ...previous.flatMap(item => ranges(item.randomness)),
].map(item => [JSON.stringify(item), item])).values()];
const sourceRecords = [
  record(path.join(here, 'e1p3-A.asm')), record(path.join(here, 'e1p3-B.asm')),
  record(path.join(here, 'build/manifest.json')), record(path.join(here, 'generate-fourth-holdout.mjs')),
  record(stressFile), ...previous.map(item => record(item.file)),
  record(path.join(repo, 'experiments/claude-e1p3-holdout-20261001/analysis.json')),
  record(path.join(repo, 'experiments/claude-e1p3-nop4-holdout-20261001/analysis.json')),
  record(path.join(repo, 'experiments/claude-e1p3-third-holdout-20261001/analysis.json')),
  record(path.join(repo, 'experiments/claude-e1p3-pooled-confirmations-20261001/analysis.json')),
];

function shuffle(salt, values) {
  let counter = 0, bytes = Buffer.alloc(0), offset = 0;
  const bounded = limit => {
    const max = Math.floor(0x100000000 / limit) * limit;
    let value;
    do {
      if (offset + 4 > bytes.length) {
        const block = Buffer.alloc(8); block.writeBigUInt64BE(BigInt(counter++));
        bytes = crypto.createHash('sha256').update(Buffer.from(salt, 'hex')).update(block).digest(); offset = 0;
      }
      value = bytes.readUInt32BE(offset); offset += 4;
    } while (value >= max);
    return value % limit;
  };
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) { const j = bounded(i + 1); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
function panelsFor(randomness) {
  return randomness.panels.map((draw, index) => {
    const id = `panel-${String(index + 1).padStart(2, '0')}`;
    equal(draw.id, id, 'panel identity');
    const arranged = shuffle(draw.salt, pool);
    return { id, salt: draw.salt, seeds: draw.seeds,
      cohorts: Array.from({ length: 25 }, (_, j) => ({ id: `${id}-cohort-${String(j + 1).padStart(2, '0')}`,
        opponents: arranged.slice(j * 3, j * 3 + 3) })) };
  });
}
function configsFor(panels) {
  return panels.flatMap(panel => arms.map(arm => {
    const id = `${panel.id}-${arm}`;
    return { id, path: path.join(frozen, 'configs', `${id}.json`), config: {
      experimentId: `claude-e1p3-fourth-holdout-20261001-${id}`, java: java.path, jar: engine.path,
      outputPath: path.join(root, 'unused-official-output', `${id}.json`),
      runDirectory: path.join(root, 'unused-official-runs', id),
      candidate: { name: 'COD_pair', warriors: binaries[arm] }, battles: 25, threads: 1, parallel: false,
      telemetry: false, seeds: panel.seeds, cohorts: panel.cohorts, zombies,
    } };
  }));
}
const design = { arms, finalist: 'e1p3', teams: 75, composition: { senior: 62, youth: 13 }, panels: 24,
  cohortsPerPanel: 25, seedsPerPanel: 2, battlesPerBlock: 25, battlesPerArm: 30000, totalBattles: 90000,
  threads: 1, parallel: false, telemetry: false, engine: 'pinned deterministic-v6 JAR; zero gameplay overlays',
  metric: 'team points per candidate appearance', independenceUnit: '24 independently salted panel-level paired deltas',
  confidence: { familywiseCoverage: 0.95, candidateComparisons: 2, criticalValue: 2.5,
    note: 'Conservative t critical (2.5 exceeds the two-sided Bonferroni 95% familywise critical for 24 panels and two comparisons).' },
  limitation: 'Fresh seeds and panel shuffles; same fixed 75 published 2025 online-stage teams and four Zombies. Does not measure unseen opponents or the official final roster.' };
const manifestFile = path.join(frozen, 'manifest.json');

if (mode === '--preflight') {
  console.log(JSON.stringify({ status: 'PREFLIGHT_NO_WRITES_NO_BATTLES', design,
    excludedRangeCount: excludedRanges.length, candidateHashes: Object.fromEntries(arms.map(arm => [arm, binaries[arm].map(file => record(file).sha256)])),
    sourcePathsVerified: sourceRecords.length }, null, 2)); process.exit(0);
}
if (mode === '--verify') {
  const manifestBytes = fs.readFileSync(manifestFile), manifest = JSON.parse(manifestBytes);
  equal(sha(manifestBytes), fs.readFileSync(`${manifestFile}.sha256`, 'utf8').trim(), 'fourth holdout manifest checksum');
  const randomness = JSON.parse(fs.readFileSync(path.join(frozen, 'randomness.json'), 'utf8'));
  equal(manifest.design, design, 'frozen design'); equal(manifest.randomness, randomness, 'frozen randomness');
  equal(manifest.panels, panelsFor(randomness), 'deterministic panel reconstruction');
  equal(randomness.ranges, randomness.panels.flatMap(panel => panel.seeds.map(seed => seedRange(seed, 25))), 'seed range arithmetic');
  for (const file of manifest.files) equal(record(file.path), file, `frozen input ${file.path}`);
  for (let i = 0; i < randomness.ranges.length; i++) {
    assert(!excludedRanges.some(old => overlaps(old, randomness.ranges[i])), 'fresh seed overlaps prior recorded evidence');
    assert(!randomness.ranges.slice(0, i).some(old => overlaps(old, randomness.ranges[i])), 'new seed ranges overlap each other');
  }
  for (const item of configsFor(manifest.panels)) equal(JSON.parse(fs.readFileSync(item.path, 'utf8')), item.config, `frozen config ${item.id}`);
  console.log(JSON.stringify({ status: 'INPUTS_VERIFIED_NO_RUNS', manifestSha256: sha(manifestBytes), design,
    excludedRanges: excludedRanges.length, seedRanges: randomness.ranges.length }, null, 2)); process.exit(0);
}

assert(!fs.existsSync(frozen) && !fs.existsSync(root), 'refusing to overwrite existing freeze or experiment');
fs.mkdirSync(path.join(frozen, 'configs'), { recursive: true });
const randomness = { drawnAt: new Date().toISOString(),
  provenance: 'One crypto-random draw before execution; 24 independent panel salts and 48 seed suffixes; no redraw based on outcomes.',
  salt: crypto.randomBytes(32).toString('hex'),
  panels: Array.from({ length: design.panels }, (_, i) => ({ id: `panel-${String(i + 1).padStart(2, '0')}`,
    salt: crypto.randomBytes(32).toString('hex'), seeds: Array.from({ length: design.seedsPerPanel }, (_, j) =>
      `e1p3-fourth-holdout-20261001-p${i + 1}-s${j + 1}-${crypto.randomBytes(12).toString('hex')}`) })) };
randomness.ranges = randomness.panels.flatMap(panel => panel.seeds.map(seed => seedRange(seed, 25)));
randomness.excludedRanges = excludedRanges;
for (let i = 0; i < randomness.ranges.length; i++) {
  assert(!excludedRanges.some(old => overlaps(old, randomness.ranges[i])), `fresh seed overlaps earlier evidence: ${randomness.ranges[i].seed}`);
  assert(!randomness.ranges.slice(0, i).some(old => overlaps(old, randomness.ranges[i])), 'fresh seed ranges overlap each other');
}
fs.writeFileSync(path.join(frozen, 'randomness-attempt.json'), `${JSON.stringify(randomness, null, 2)}\n`, { flag: 'wx' });
fs.writeFileSync(path.join(frozen, 'randomness.json'), `${JSON.stringify(randomness, null, 2)}\n`, { flag: 'wx' });
const panels = panelsFor(randomness), configs = configsFor(panels);
for (const item of configs) fs.writeFileSync(item.path, `${JSON.stringify(item.config, null, 2)}\n`, { flag: 'wx' });
const files = [...new Map([...candidateFiles, ...poolFiles, ...zombieFiles, ...runtimeFiles, engine, java, ...sourceRecords,
  record(path.join(frozen, 'randomness-attempt.json')), record(path.join(frozen, 'randomness.json')),
  ...configs.map(item => record(item.path))].map(item => [item.path, item])).values()];
const manifest = { schemaVersion: 1, suite: 'claude-e1p3-fourth-fresh-holdout-20261001', frozenAt: new Date().toISOString(),
  design, previousEvidence: sourceRecords.slice(-4), excludedRanges, randomness, panels,
  candidates: Object.fromEntries(arms.map(arm => [arm, binaries[arm].map(file => record(file))])), engine, java, runtimeFiles, files };
fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
const manifestSha = sha(fs.readFileSync(manifestFile));
fs.writeFileSync(`${manifestFile}.sha256`, `${manifestSha}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: 'FROZEN_NOT_RUN', manifestSha256: manifestSha,
  configs: configs.length, battles: design.totalBattles, seedRanges: randomness.ranges.length, excludedRanges: excludedRanges.length }, null, 2));
