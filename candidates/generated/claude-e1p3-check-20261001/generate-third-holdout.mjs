// Independently seeded third paired confirmation of the exact pasted e1p3.
// This freezes immutable inputs only; execution is a separate script.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { record, seedRange, overlaps, sha, equal, assert } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const root = path.join(repo, 'experiments/claude-e1p3-third-holdout-20261001');
const frozen = path.join(here, 'third-holdout/frozen');
const mode = process.argv[2];
assert(['--preflight', '--freeze', '--verify'].includes(mode), 'usage: node generate-third-holdout.mjs --preflight|--freeze|--verify');

const stressFile = path.join(repo, 'candidates/generated/claude-family-stress-20261001/frozen/manifest.json');
const stressBytes = fs.readFileSync(stressFile), stress = JSON.parse(stressBytes);
equal(sha(stressBytes), fs.readFileSync(`${stressFile}.sha256`, 'utf8').trim(), 'stress manifest checksum');
const stressByPath = new Map(stress.files.map(item => [path.resolve(item.path), item]));
const checked = file => {
  const actual = record(file), expected = stressByPath.get(path.resolve(file));
  if (expected) equal(actual, expected, `existing pinned input ${file}`);
  return actual;
};
const e1p3Dir = here;
const binaries = {
  m049: ['A', 'B'].map(side => path.join(path.dirname(stressFile), 'binaries/m049', side)),
  m050: ['A', 'B'].map(side => path.join(path.dirname(stressFile), 'binaries/m050', side)),
  e1p3: ['e1p3A', 'e1p3B'].map(name => path.join(e1p3Dir, 'build', name)),
};
const arms = ['m049', 'm050', 'e1p3'];
const pool = stress.pool, zombies = stress.zombies;
assert(pool.length === 75 && new Set(pool.map(t => t.name)).size === 75, 'expected fixed 75-team pool');
assert(pool.filter(t => t.name.startsWith('A_')).length === 62 && pool.filter(t => t.name.startsWith('Y_')).length === 13, 'expected 62 senior + 13 youth');
assert(zombies.length === 4, 'expected exactly four Zombies');
const candidateFiles = arms.flatMap(arm => binaries[arm].map(checked));
const poolFiles = pool.flatMap(team => team.warriors).map(checked), zombieFiles = zombies.map(z => checked(z.path));
const runtimeDir = path.join(repo, 'tools/engine-acceleration-20261001/runtime');
const runtimeFiles = ['research-batch.mjs', 'batch-format.mjs', 'SerialBatchMain.java']
  .map(name => checked(path.join(runtimeDir, name))).concat(stress.researchRuntime.classes.map(item => checked(item.path)));
const engine = checked(stress.engine.path), java = checked(stress.java.path);
const prior1File = path.join(here, 'holdout/frozen/randomness.json');
const prior2File = path.join(here, 'nop4-holdout/frozen/randomness.json');
const prior1 = JSON.parse(fs.readFileSync(prior1File, 'utf8'));
const prior2 = JSON.parse(fs.readFileSync(prior2File, 'utf8'));
const sourceRecords = [
  record(path.join(here, 'e1p3-A.asm')), record(path.join(here, 'e1p3-B.asm')),
  record(path.join(here, 'assemble-local.mjs')), record(path.join(here, 'generate-third-holdout.mjs')),
  record(prior1File), record(prior2File), record(stressFile),
];

function shuffle(salt, values) {
  let counter = 0, bytes = Buffer.alloc(0), offset = 0;
  const bounded = bound => {
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
  };
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) { const j = bounded(i + 1); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
function panelsFor(randomness) {
  return randomness.panels.map((draw, i) => {
    equal(draw.id, `panel-${String(i + 1).padStart(2, '0')}`, 'panel id');
    const arranged = shuffle(draw.salt, pool);
    return { id: draw.id, salt: draw.salt, seeds: draw.seeds,
      cohorts: Array.from({ length: 25 }, (_, j) => ({ id: `${draw.id}-cohort-${String(j + 1).padStart(2, '0')}`,
        opponents: arranged.slice(j * 3, j * 3 + 3) })) };
  });
}
function configsFor(panels) {
  return panels.flatMap(panel => arms.map(arm => {
    const id = `${panel.id}-${arm}`;
    return { id, path: path.join(frozen, 'configs', `${id}.json`), config: {
      experimentId: `claude-e1p3-third-holdout-20261001-${id}`, java: java.path, jar: engine.path,
      outputPath: path.join(root, 'unused-official-output', `${id}.json`),
      runDirectory: path.join(root, 'unused-official-runs', id),
      candidate: { name: 'COD_pair', warriors: binaries[arm] }, battles: 25, threads: 1, parallel: false,
      telemetry: false, seeds: panel.seeds, cohorts: panel.cohorts, zombies,
    } };
  }));
}
const design = { arms, finalist: 'e1p3', teams: 75, composition: { senior: 62, youth: 13 }, panels: 8,
  cohortsPerPanel: 25, seedsPerPanel: 2, battlesPerBlock: 25, battlesPerArm: 10000, totalBattles: 30000,
  threads: 1, parallel: false, telemetry: false, engine: 'pinned deterministic v6 JAR; zero gameplay overlays',
  metric: 'team points per candidate appearance', independenceUnit: 'eight independently salted panel-level paired deltas',
  confidence: { candidateComparisons: 2, criticalValue: 3,
    note: 'Predeclared conservative Bonferroni 95% familywise t intervals for e1p3 vs m049 and m050.' },
  limitation: 'Fresh seeds and cohort shuffles against the same fixed 75 published 2025 online-stage teams and four Zombies; not a final-roster or unseen-opponent test.' };

const manifestFile = path.join(frozen, 'manifest.json');
if (mode === '--preflight') {
  console.log(JSON.stringify({ status: 'PREFLIGHT_ONLY', design, stressManifestSha256: sha(stressBytes),
    priorHoldoutManifestSha256: [
      fs.readFileSync(path.join(here, 'holdout/frozen/manifest.json.sha256'), 'utf8').trim(),
      fs.readFileSync(path.join(here, 'nop4-holdout/frozen/manifest.json.sha256'), 'utf8').trim(),
    ], candidateHashes: Object.fromEntries(arms.map(arm => [arm, binaries[arm].map(f => record(f).sha256)])),
    excludedRangeCount: stress.excludedRanges.length + stress.randomness.ranges.length + prior1.ranges.length + prior2.ranges.length }, null, 2));
  process.exit(0);
}
const excludedRanges = [...new Map([...stress.excludedRanges, ...stress.randomness.ranges, ...prior1.ranges, ...prior2.ranges]
  .map(r => [JSON.stringify(r), r])).values()];
function rangesFor(randomness) { return randomness.panels.flatMap(p => p.seeds.map(seed => seedRange(seed, 25))); }
if (mode === '--verify') {
  const bytes = fs.readFileSync(manifestFile);
  equal(sha(bytes), fs.readFileSync(`${manifestFile}.sha256`, 'utf8').trim(), 'third holdout manifest checksum');
  const manifest = JSON.parse(bytes), randomness = JSON.parse(fs.readFileSync(path.join(frozen, 'randomness.json'), 'utf8'));
  equal(manifest.design, design, 'frozen design'); equal(manifest.randomness, randomness, 'randomness record');
  equal(manifest.panels, panelsFor(randomness), 'panel reconstruction'); equal(randomness.ranges, rangesFor(randomness), 'seed arithmetic');
  for (const item of manifest.files) equal(record(item.path), item, `frozen input ${item.path}`);
  for (let i = 0; i < randomness.ranges.length; i++) {
    assert(!excludedRanges.some(old => overlaps(old, randomness.ranges[i])), 'seed overlaps previous evidence');
    assert(!randomness.ranges.slice(0, i).some(old => overlaps(old, randomness.ranges[i])), 'new seeds overlap each other');
  }
  for (const item of configsFor(manifest.panels)) equal(JSON.parse(fs.readFileSync(item.path, 'utf8')), item.config, 'frozen config');
  console.log(JSON.stringify({ status: 'INPUTS_VERIFIED', manifestSha256: sha(bytes), design }));
  process.exit(0);
}

assert(!fs.existsSync(frozen), 'refusing to overwrite an existing freeze');
assert(!fs.existsSync(root), 'refusing to overwrite an existing experiment directory');
fs.mkdirSync(path.join(frozen, 'configs'), { recursive: true });
const randomness = { drawnAt: new Date().toISOString(), salt: crypto.randomBytes(32).toString('hex'),
  panels: Array.from({ length: 8 }, (_, i) => ({ id: `panel-${String(i + 1).padStart(2, '0')}`,
    salt: crypto.randomBytes(32).toString('hex'), seeds: Array.from({ length: 2 }, (_, j) =>
      `e1p3-third-holdout-20261001-p${i + 1}-s${j + 1}-${crypto.randomBytes(12).toString('hex')}`) })) };
randomness.ranges = rangesFor(randomness); randomness.excludedRanges = excludedRanges;
for (let i = 0; i < randomness.ranges.length; i++) {
  assert(!excludedRanges.some(old => overlaps(old, randomness.ranges[i])), `seed overlaps earlier run: ${randomness.ranges[i].seed}`);
  assert(!randomness.ranges.slice(0, i).some(old => overlaps(old, randomness.ranges[i])), 'generated seed ranges overlap');
}
fs.writeFileSync(path.join(frozen, 'randomness-attempt.json'), `${JSON.stringify(randomness, null, 2)}\n`, { flag: 'wx' });
fs.writeFileSync(path.join(frozen, 'randomness.json'), `${JSON.stringify(randomness, null, 2)}\n`, { flag: 'wx' });
const panels = panelsFor(randomness), configs = configsFor(panels);
for (const item of configs) fs.writeFileSync(item.path, `${JSON.stringify(item.config, null, 2)}\n`, { flag: 'wx' });
const files = [...new Map([...candidateFiles, ...poolFiles, ...zombieFiles, ...runtimeFiles, engine, java, ...sourceRecords,
  record(path.join(here, 'build/manifest.json')), record(path.join(frozen, 'randomness-attempt.json')),
  record(path.join(frozen, 'randomness.json')), ...configs.map(item => record(item.path))]
  .map(item => [item.path, item])).values()];
const manifest = { schemaVersion: 1, suite: 'claude-e1p3-third-independent-holdout-20261001', frozenAt: new Date().toISOString(),
  design, stressManifest: record(stressFile), previousHoldouts: [record(path.join(here, 'holdout/frozen/manifest.json')),
    record(path.join(here, 'nop4-holdout/frozen/manifest.json'))], excludedRanges, randomness, panels,
  candidates: Object.fromEntries(arms.map(arm => [arm, binaries[arm].map(file => record(file))])), engine, java, runtimeFiles, files };
fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
const manifestSha = sha(fs.readFileSync(manifestFile));
fs.writeFileSync(`${manifestFile}.sha256`, `${manifestSha}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: 'FROZEN_NOT_RUN', manifestSha256: manifestSha, configs: configs.length,
  battles: design.totalBattles, seedRanges: randomness.ranges.length }, null, 2));
