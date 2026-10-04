// Exploratory, paired screen for composing e1p3 with the previously measured
// one-byte B-worker XOR defense. No entropy freeze or battle execution until
// explicit --freeze, and no promotion from this screen.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { record, seedRange, overlaps, sha, equal, assert } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../..');
const mode = process.argv[2], freeze = path.join(here, 'frozen');
const root = path.join(repo, 'experiments/e1p3-xorb-screen-20261001');
assert(['--preflight', '--freeze', '--verify'].includes(mode), 'usage: node generate-screen.mjs --preflight|--freeze|--verify');
const stressFile = path.join(repo, 'candidates/generated/claude-family-stress-20261001/frozen/manifest.json');
const stressBytes = fs.readFileSync(stressFile), stress = JSON.parse(stressBytes);
equal(sha(stressBytes), fs.readFileSync(`${stressFile}.sha256`, 'utf8').trim(), 'stress manifest checksum');
const e1dir = path.join(repo, 'candidates/generated/claude-e1p3-check-20261001');
const e1hold = JSON.parse(fs.readFileSync(path.join(e1dir, 'holdout/frozen/randomness.json')));
const nop4hold = JSON.parse(fs.readFileSync(path.join(e1dir, 'nop4-holdout/frozen/randomness.json')));
const thirdhold = JSON.parse(fs.readFileSync(path.join(e1dir, 'third-holdout/frozen/randomness.json')));
const stressByPath = new Map(stress.files.map(item => [path.resolve(item.path), item]));
const check = file => {
  const actual = record(file), expected = stressByPath.get(path.resolve(file));
  if (expected) equal(actual, expected, `prior input ${file}`);
  return actual;
};
const binaries = {
  e1p3: ['e1p3A', 'e1p3B'].map(n => path.join(e1dir, 'build', n)),
  'e1p3-xorb': ['e1p3xorb-A', 'e1p3xorb-B'].map(n => path.join(here, 'build', n)),
  m050: ['A', 'B'].map(n => path.join(path.dirname(stressFile), 'binaries/m050', n)),
  'm050-xorb': ['A', 'B'].map(n => path.join(repo, 'build/m050-pointer-operator/xor-b', n)),
};
const arms = ['m050', 'm050-xorb', 'e1p3', 'e1p3-xorb'];
const pool = stress.pool, zombies = stress.zombies;
assert(pool.length === 75 && new Set(pool.map(t => t.name)).size === 75, '75 unique public pairs required');
assert(zombies.length === 4, 'exactly four pinned Zombies required');
const runtimeDir = path.join(repo, 'tools/engine-acceleration-20261001/runtime');
const runtimeFiles = ['research-batch.mjs', 'batch-format.mjs', 'SerialBatchMain.java']
  .map(n => check(path.join(runtimeDir, n))).concat(stress.researchRuntime.classes.map(c => check(c.path)));
const fixedToggle = ['A', 'B'].map(side => path.join(path.dirname(stressFile), 'binaries/fixed-toggle', side));
const engine = check(stress.engine.path), java = check(stress.java.path);
const sourceRecords = [
  record(path.join(here, 'e1p3-xorb-A.asm')), record(path.join(here, 'e1p3-xorb-B.asm')),
  record(path.join(here, 'build/manifest.json')),
  record(path.join(repo, 'candidates/generated/m050-pointer-operator/xor-b/A.asm')),
  record(path.join(repo, 'candidates/generated/m050-pointer-operator/xor-b/B.asm')),
  record(path.join(repo, 'build/m050-pointer-operator/xor-b/manifest.json')),
  record(path.join(repo, 'candidates/generated/claude-family-stress-20261001/frozen/manifest.json')),
  record(path.join(e1dir, 'holdout/frozen/manifest.json')),
  record(path.join(e1dir, 'nop4-holdout/frozen/manifest.json')),
  record(path.join(e1dir, 'third-holdout/frozen/manifest.json')),
  record(path.join(here, 'generate-screen.mjs')), record(path.join(here, 'run-screen.mjs')),
  record(path.join(here, 'analyze-screen.mjs')),
];
const priorRanges = [...stress.excludedRanges, ...stress.randomness.ranges,
  ...e1hold.ranges, ...nop4hold.ranges, ...thirdhold.ranges];
const excludedRanges = [...new Map(priorRanges.map(r => [JSON.stringify(r), r])).values()];
const design = { scenarios: ['field', 'fixed-toggle-present'], arms, teams: 75, cohorts: 25,
  seedsPerScenario: 2, battlesPerCohortSeed: 10, battlesPerArmScenario: 500, totalBattles: 4000,
  engine: 'exact pinned deterministic v6 JAR; no gameplay overlays', threads: 1, parallel: false, telemetry: false,
  uncertaintyUnit: '25 cohort deltas averaged over two shared seed blocks; exploratory only',
  scope: 'Screen e1p3 XOR-B composition for broad-field and one-fixed-toggle matchups; no promotion without fresh holdout.' };
function shuffle(salt, values) {
  let counter = 0, bytes = Buffer.alloc(0), offset = 0;
  const bounded = bound => {
    const limit = Math.floor(0x100000000 / bound) * bound;
    let x;
    do {
      if (offset + 4 > bytes.length) { const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(counter++));
        bytes = crypto.createHash('sha256').update(Buffer.from(salt, 'hex')).update(b).digest(); offset = 0; }
      x = bytes.readUInt32BE(offset); offset += 4;
    } while (x >= limit);
    return x % bound;
  };
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) { const j = bounded(i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
function schedules(randomness) {
  const field = shuffle(randomness.salts.field, pool);
  const mixed = shuffle(randomness.salts.mixed, pool);
  return {
    field: Array.from({ length: 25 }, (_, i) => ({ id: `field-${String(i + 1).padStart(2, '0')}`,
      opponents: field.slice(i * 3, i * 3 + 3) })),
    'fixed-toggle-present': Array.from({ length: 25 }, (_, i) => ({ id: `counter-${String(i + 1).padStart(2, '0')}`,
      opponents: [...mixed.slice(i * 2, i * 2 + 2), { name: 'Claude_fixed_toggle', warriors: fixedToggle }] })),
  };
}
function configsFor(randomness) {
  const sch = schedules(randomness), configs = [];
  for (const scenario of design.scenarios) for (const arm of arms) {
    const id = `${scenario}-${arm}`;
    configs.push({ id, path: path.join(freeze, 'configs', `${id}.json`), config: {
      experimentId: `e1p3-xorb-screen-20261001-${id}`, java: java.path, jar: engine.path,
      outputPath: path.join(root, 'unused-official-output', `${id}.json`),
      runDirectory: path.join(root, 'unused-official-runs', id),
      candidate: { name: 'COD_pair', warriors: binaries[arm] }, battles: 10, threads: 1, parallel: false, telemetry: false,
      seeds: randomness.seeds[scenario], zombies,
      cohorts: sch[scenario].map(c => ({ id: c.id, opponents: c.opponents })),
    } });
  }
  return configs;
}
function rangesFor(r) { return Object.entries(r.seeds).flatMap(([scenario, seeds]) => seeds.map(seed => ({ scenario, ...seedRange(seed, 10) }))); }
function recordsFor() {
  const candidateFiles = arms.flatMap(arm => binaries[arm].map(check));
  const poolFiles = pool.flatMap(t => t.warriors).map(check), zombieFiles = zombies.map(z => check(z.path));
  const toggles = fixedToggle.map(check);
  return { candidateFiles, poolFiles, zombieFiles, toggles };
}
const manifestFile = path.join(freeze, 'manifest.json');
if (mode === '--preflight') {
  const f = recordsFor();
  console.log(JSON.stringify({ status: 'PREFLIGHT_ONLY', design,
    candidateHashes: Object.fromEntries(arms.map(a => [a, binaries[a].map(p => record(p).sha256)])),
    fixedToggleHashes: fixedToggle.map(p => record(p).sha256), excludedSeedRanges: excludedRanges.length,
    frozenInputs: f.candidateFiles.length + f.poolFiles.length + f.zombieFiles.length + f.toggles.length + runtimeFiles.length }, null, 2));
  process.exit(0);
}
if (mode === '--verify') {
  const manifestBytes = fs.readFileSync(manifestFile);
  equal(sha(manifestBytes), fs.readFileSync(`${manifestFile}.sha256`, 'utf8').trim(), 'manifest checksum');
  const m = JSON.parse(manifestBytes), randomness = JSON.parse(fs.readFileSync(path.join(freeze, 'randomness.json'), 'utf8'));
  equal(m.design, design, 'design'); equal(m.randomness, randomness, 'randomness');
  equal(m.schedules, schedules(randomness), 'cohort schedules'); equal(randomness.ranges, rangesFor(randomness), 'seed ranges');
  for (const item of m.files) equal(record(item.path), item, `frozen input ${item.path}`);
  for (const c of configsFor(randomness)) equal(JSON.parse(fs.readFileSync(c.path, 'utf8')), c.config, `frozen config ${c.id}`);
  for (const r of randomness.ranges) assert(!excludedRanges.some(old => overlaps(old, r)), `overlap: ${r.seed}`);
  console.log(JSON.stringify({ status: 'INPUTS_VERIFIED', manifestSha256: sha(manifestBytes), design }));
  process.exit(0);
}
assert(!fs.existsSync(freeze), 'refusing prior entropy freeze');
assert(!fs.existsSync(root), 'refusing prior result directory');
const sources = recordsFor();
fs.mkdirSync(path.join(freeze, 'configs'), { recursive: true });
const randomness = { drawnAt: new Date().toISOString(), salts: { field: crypto.randomBytes(32).toString('hex'), mixed: crypto.randomBytes(32).toString('hex') },
  seeds: Object.fromEntries(design.scenarios.map(s => [s, Array.from({ length: 2 }, (_, i) =>
    `e1p3-xorb-screen-20261001-${s}-s${i + 1}-${crypto.randomBytes(12).toString('hex')}`)])) };
randomness.ranges = rangesFor(randomness); randomness.excludedRanges = excludedRanges;
for (let i = 0; i < randomness.ranges.length; i++) {
  assert(!excludedRanges.some(old => overlaps(old, randomness.ranges[i])), 'new screen seed overlaps prior study');
  assert(!randomness.ranges.slice(0, i).some(old => overlaps(old, randomness.ranges[i])), 'screen seeds overlap each other');
}
fs.writeFileSync(path.join(freeze, 'randomness-attempt.json'), `${JSON.stringify(randomness, null, 2)}\n`, { flag: 'wx' });
fs.writeFileSync(path.join(freeze, 'randomness.json'), `${JSON.stringify(randomness, null, 2)}\n`, { flag: 'wx' });
const generated = configsFor(randomness);
for (const item of generated) fs.writeFileSync(item.path, `${JSON.stringify(item.config, null, 2)}\n`, { flag: 'wx' });
const files = [...new Map([...sources.candidateFiles, ...sources.poolFiles, ...sources.zombieFiles, ...sources.toggles,
  ...runtimeFiles, engine, java, ...sourceRecords, record(stressFile), record(path.join(freeze, 'randomness-attempt.json')),
  record(path.join(freeze, 'randomness.json')), ...generated.map(c => record(c.path))]
  .map(item => [item.path, item])).values()];
const manifest = { schemaVersion: 1, suite: 'e1p3-xorb-paired-screen-20261001', frozenAt: new Date().toISOString(),
  design, candidates: Object.fromEntries(arms.map(a => [a, binaries[a].map(p => record(p))])), fixedToggle: fixedToggle.map(p => record(p)),
  stressManifest: record(stressFile), excludedRanges, randomness, schedules: schedules(randomness), engine, java, runtimeFiles, files };
fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
const manifestSha = sha(fs.readFileSync(manifestFile));
fs.writeFileSync(`${manifestFile}.sha256`, `${manifestSha}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: 'FROZEN_NOT_RUN', manifestSha256: manifestSha, configs: generated.length,
  totalBattles: design.totalBattles, seedRanges: randomness.ranges.length }, null, 2));
