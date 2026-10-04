// Five-identical-copy density study. Entropy is drawn only by --freeze.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { arms, candidateNames, cloneNames, weights, schedule, seedRange, overlaps, sha, equal, assert } from './model.mjs';
import { record, text } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../..');
const mode = process.argv[2], freeze = path.join(here, 'frozen');
assert(['--preflight', '--freeze', '--verify'].includes(mode), 'usage: node generate.mjs --preflight|--freeze|--verify');
const resultRoot = path.join(repo, 'experiments/e1p3-five-copy-density-20261001');
const stressFile = path.join(repo, 'candidates/generated/claude-family-stress-20261001/frozen/manifest.json');
const stressBytes = fs.readFileSync(stressFile), stressHash = sha(stressBytes), stress = JSON.parse(stressBytes);
equal(stressHash, '323114545e1eb6970fed223508f073483de4dc7d92839c16f6cbc20a7d5e280f', 'reviewed family-stress input manifest');
equal(fs.readFileSync(`${stressFile}.sha256`, 'utf8').trim(), stressHash, 'family-stress checksum file');
const check = file => record(file);
const checkParent = file => {
  const expected = stress.files.find(x => path.resolve(x.path) === path.resolve(file));
  assert(expected, `parent stress manifest lacks ${file}`); equal(check(file), expected, 'parent frozen input'); return expected;
};
const e1Dir = path.join(repo, 'candidates/generated/claude-e1p3-check-20261001');
const xorDir = path.join(repo, 'candidates/generated/claude-e1p3-xorb-20261001');
const sourceManifests = [
  { path: path.join(e1Dir, 'build/manifest.json'), sha: null, label: 'exact e1p3 build' },
  { path: path.join(xorDir, 'build/manifest.json'), sha: null, label: 'exact e1p3-XORB build' },
  { path: path.join(e1Dir, 'holdout/frozen/manifest.json'), sha: '62d1a4b5dce3091883ab79269b985c58cf5ed8b905afc357712c7aed46df7a8f', label: 'e1p3 first holdout' },
  { path: path.join(e1Dir, 'nop4-holdout/frozen/manifest.json'), sha: '2cf7fcd97b59c1fa137684ae7d0603bbb96b8cce9c69096f34333a2e489d000b', label: 'e1p3 NOP4 holdout' },
  { path: path.join(e1Dir, 'third-holdout/frozen/manifest.json'), sha: 'd207610e068bbf2f418c36f5702e18a8ee22017db89c125f1319af3f62486d92', label: 'e1p3 third holdout' },
  { path: path.join(xorDir, 'frozen/manifest.json'), sha: '2bec0789b932f52ad0a06676fa882a94862030af73920d733c9254f7ef7d39b9', label: 'XORB screen' },
];
for (const item of sourceManifests) {
  item.bytes = fs.readFileSync(item.path); item.hash = sha(item.bytes);
  item.data = JSON.parse(item.bytes);
  if (item.sha) equal(item.hash, item.sha, item.label);
}
const parentBinary = (arm, side) => stress.frozenVariants[arm][side === 'A' ? 0 : 1];
const binaries = {
  m049: ['A', 'B'].map(s => parentBinary('m049', s)),
  m050: ['A', 'B'].map(s => parentBinary('m050', s)),
  e1p3: ['e1p3A', 'e1p3B'].map(s => path.join(e1Dir, 'build', s)),
  'e1p3-xorb': ['e1p3xorb-A', 'e1p3xorb-B'].map(s => path.join(xorDir, 'build', s)),
};
const expectedHashes = {
  m049: ['106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973', '7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77'],
  m050: ['0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44', '06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782'],
  e1p3: ['caced989dd55b98a749d5dc3a2d20d533e14013affb08b84572c9f76f1a05117', '99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b'],
  'e1p3-xorb': ['caced989dd55b98a749d5dc3a2d20d533e14013affb08b84572c9f76f1a05117', '96e7891154b509072ee6ba94d6a33059645a9310d6c6ed27bf0c74025cd6b604'],
};
for (const arm of arms) for (let i = 0; i < 2; i++) equal(check(binaries[arm][i]).sha256, expectedHashes[arm][i], `${arm} ${i ? 'B' : 'A'} binary`);
for (const [manifest, arm, sourcePaths] of [
  [sourceManifests[0].data, 'e1p3', ['e1p3-A.asm', 'e1p3-B.asm'].map(n => path.join(e1Dir, n))],
  [sourceManifests[1].data, 'e1p3-xorb', ['e1p3-xorb-A.asm', 'e1p3-xorb-B.asm'].map(n => path.join(xorDir, n))],
]) {
  equal(manifest.files.length, 2, `${arm} build manifest components`);
  for (let i = 0; i < 2; i++) {
    const item = manifest.files[i];
    equal(path.resolve(item.source), path.resolve(sourcePaths[i]), `${arm} component source path`);
    equal(record(sourcePaths[i]).sha256, item.sourceSha256, `${arm} source-to-binary provenance`);
    equal(path.resolve(item.binary), path.resolve(binaries[arm][i]), `${arm} output path`);
    equal(item.binarySha256, expectedHashes[arm][i], `${arm} assembly output hash`);
    equal(item.bytes, fs.statSync(binaries[arm][i]).size, `${arm} assembled length`);
  }
}
const pool = stress.pool, zombies = stress.zombies;
assert(pool.length === 75 && zombies.length === 4, 'expected fixed 75-team pool and four Zombies');
for (const t of pool) for (const p of t.warriors) checkParent(p);
for (const z of zombies) checkParent(z.path);
const runtimeFiles = [
  ...stress.researchRuntime.sources.map(x => x.path),
  ...stress.researchRuntime.classes.map(x => x.path),
];
for (const file of runtimeFiles) checkParent(file);
const researchRuntime = path.join(repo, 'tools/engine-acceleration-20261001/runtime');
for (const file of ['research-batch.mjs', 'batch-format.mjs', 'SerialBatchMain.java']) checkParent(path.join(researchRuntime, file));
const engine = stress.engine, java = stress.java;
checkParent(engine.path); checkParent(java.path);
const sourceFiles = [
  record(stressFile), record(`${stressFile}.sha256`),
  ...sourceManifests.map(x => record(x.path)),
  record(path.join(e1Dir, 'e1p3-A.asm')), record(path.join(e1Dir, 'e1p3-B.asm')),
  record(path.join(xorDir, 'e1p3-xorb-A.asm')), record(path.join(xorDir, 'e1p3-xorb-B.asm')),
  record(path.join(here, 'model.mjs')), record(path.join(here, 'self-test.mjs')),
  record(path.join(here, 'generate.mjs')), record(path.join(here, 'run.mjs')), record(path.join(here, 'analyze.mjs')),
  record(path.join(here, 'PROTOCOL.md')),
  ...runtimeFiles.map(record),
];
const priorRandomness = [
  path.join(e1Dir, 'holdout/frozen/randomness.json'),
  path.join(e1Dir, 'nop4-holdout/frozen/randomness.json'),
  path.join(e1Dir, 'third-holdout/frozen/randomness.json'),
  path.join(xorDir, 'frozen/randomness.json'),
].map(file => ({ path: file, value: JSON.parse(fs.readFileSync(file, 'utf8')), record: record(file) }));
const excludedRanges = [...new Map([
  ...stress.excludedRanges, ...stress.randomness.ranges,
  ...priorRandomness.flatMap(x => x.value.ranges),
].map(r => [JSON.stringify(r), r])).values()];
const design = { arms, publicEntrants: 75, exactIdenticalE1p3Clones: 5, opposingPool: 80,
  strata: [0, 1, 2, 3], cohortsPerStratum: 10, orientations: 2, battlesPerCohortOrientation: 10,
  configs: 320, battlesPerArm: 800, totalBattles: 3200, threads: 1, parallel: false, telemetry: false,
  engine: 'pinned original deterministic-v6 JAR, no overlays',
  metric: 'candidate team points per appearance; descriptive K=0 baseline and natural-hypergeometric five-clone density',
  limitation: 'fixed 2025 online-stage pool; hypothetical five identical e1p3 entrants, not a tournament forecast or universal counter-proof' };
const cohortIds = [0, 1, 2, 3].flatMap(k => Array.from({ length: design.cohortsPerStratum }, (_, i) => `k${k}-${String(i + 1).padStart(2, '0')}`));
const rangesFor = r => cohortIds.map(id => ({ cohortId: id, ...seedRange(r.seeds[id], 10) }));
function configsFor(randomness, cohorts) {
  const cloneTeam = { name: null, warriors: ['A', 'B'].map((_, i) => path.join(freeze, 'binaries/e1p3', i ? 'B' : 'A')) };
  const frozenArms = Object.fromEntries(arms.map(a => [a, ['A', 'B'].map((_, i) => path.join(freeze, 'binaries', a, i ? 'B' : 'A'))]));
  return cohorts.flatMap(c => arms.flatMap(arm => candidateNames.map((candidateName, orientation) => {
    const id = `${c.id}-${arm}-o${orientation + 1}`;
    const opponents = c.opponents.map(x => x.kind === 'e1p3'
      ? { name: x.name, warriors: cloneTeam.warriors }
      : pool.find(t => t.name === x.name));
    assert(opponents.length === 3 && new Set([candidateName, ...opponents.map(x => x.name)]).size === 4, '4 distinct teams per battle');
    return { id, cohortId: c.id, k: c.k, arm, orientation, path: path.join(freeze, 'configs', `${id}.json`),
      config: { experimentId: `e1p3-five-copy-density-20261001-${id}`, java: java.path, jar: engine.path,
        outputPath: path.join(resultRoot, 'unused-official-output', `${id}.json`),
        runDirectory: path.join(resultRoot, 'unused-official-runs', id),
        candidate: { name: candidateName, warriors: frozenArms[arm] }, battles: 10, threads: 1, parallel: false, telemetry: false,
        seeds: [randomness.seeds[c.id]], zombies,
        cohorts: [{ id: c.id, opponents }],
      } };
  })));
}
function checkRandomness(randomness) {
  const ranges = rangesFor(randomness); equal(randomness.ranges, ranges, 'fresh seed ranges');
  for (const [i, r] of ranges.entries()) {
    assert(r.lastWarSeed <= 2147483647, 'seed range crosses Java signed int max');
    assert(!excludedRanges.some(old => overlaps(old, r)), `seed reused from prior study: ${r.seed}`);
    assert(!ranges.slice(0, i).some(old => overlaps(old, r)), `new seed collision: ${r.seed}`);
  }
  return ranges;
}
const manifestPath = path.join(freeze, 'manifest.json');

if (mode === '--preflight') {
  console.log(text({ status: 'PREFLIGHT_NO_ENTROPY_NO_BATTLES', design, weights,
    binaryHashes: Object.fromEntries(arms.map(a => [a, binaries[a].map(f => record(f).sha256)])),
    publicTeams: pool.length, zombies: zombies.length, excludedSeedRanges: excludedRanges.length })); process.exit(0);
}
if (mode === '--verify') {
  const bytes = fs.readFileSync(manifestPath), m = JSON.parse(bytes), randomness = JSON.parse(fs.readFileSync(path.join(freeze, 'randomness.json'), 'utf8'));
  equal(sha(bytes), fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim(), 'manifest checksum');
  equal(m.design, design, 'frozen design'); equal(m.randomness, randomness, 'frozen entropy');
  equal(m.weights, weights, 'natural hypergeometric weights'); equal(m.excludedRanges, excludedRanges, 'prior seed registry');
  for (const f of m.files) equal(record(f.path), f, `input hash: ${f.path}`);
  const cohorts = schedule(pool, randomness.salt, design.cohortsPerStratum), configs = configsFor(randomness, cohorts);
  equal(m.cohorts, cohorts, 'reconstructed schedule'); equal(randomness.ranges, checkRandomness(randomness), 'seed checks');
  for (const c of configs) equal(JSON.parse(fs.readFileSync(c.path, 'utf8')), c.config, `config ${c.id}`);
  equal(m.configs, configs.map(({ config, path: p, ...x }) => ({ ...x, ...record(p) })), 'config records');
  console.log(text({ status: 'INPUTS_VERIFIED_NO_RUNS', manifestSha256: sha(bytes), design })); process.exit(0);
}

assert(!fs.existsSync(freeze) && !fs.existsSync(resultRoot), 'refusing an existing freeze or experiment directory');
fs.mkdirSync(path.join(freeze, 'configs'), { recursive: true });
const randomness = { drawnAt: new Date().toISOString(), provenance: 'One post-review crypto draw; no outcomes read and no redraw.',
  salt: crypto.randomBytes(32).toString('hex'),
  seeds: Object.fromEntries(cohortIds.map(id => [id, `e1p3-five-density-20261001-${id}-${crypto.randomBytes(12).toString('hex')}`])) };
randomness.ranges = rangesFor(randomness); checkRandomness(randomness);
fs.writeFileSync(path.join(freeze, 'randomness-attempt.json'), text(randomness), { flag: 'wx' });
fs.writeFileSync(path.join(freeze, 'randomness.json'), text(randomness), { flag: 'wx' });
  const cohorts = schedule(pool, randomness.salt, design.cohortsPerStratum), configs = configsFor(randomness, cohorts);
for (const c of configs) fs.writeFileSync(c.path, text(c.config), { flag: 'wx' });

const binariesFrozen = Object.fromEntries(arms.map(a => [a, ['A', 'B'].map(s => path.join(freeze, 'binaries', a, s))]));
for (const [arm, paths] of Object.entries(binariesFrozen)) for (let i = 0; i < 2; i++) {
  fs.mkdirSync(path.dirname(paths[i]), { recursive: true }); fs.copyFileSync(binaries[arm][i], paths[i], fs.constants.COPYFILE_EXCL);
  equal(record(paths[i]).sha256, expectedHashes[arm][i], `copied binary ${arm}/${i}`);
}
const files = [...new Map([...sourceFiles, ...priorRandomness.map(x => x.record),
  ...pool.flatMap(t => t.warriors.map(checkParent)), ...zombies.map(z => checkParent(z.path)),
  ...Object.values(binariesFrozen).flat().map(record), record(path.join(freeze, 'randomness-attempt.json')),
  record(path.join(freeze, 'randomness.json')), ...configs.map(c => record(c.path))]
  .map(f => [f.path, f])).values()];
const metadata = configs.map(({ config, path: p, ...x }) => ({ ...x, ...record(p) }));
const manifest = { schemaVersion: 1, suite: 'e1p3-five-copy-density-20261001', frozenAt: new Date().toISOString(),
  design, weights, stressManifest: record(stressFile), priorRandomness: priorRandomness.map(x => x.record),
  excludedRanges, randomness, cohorts, binaries: Object.fromEntries(arms.map(a => [a, binaries[a].map(record)])),
  pool, clones: cloneNames.map(name => ({ name, variant: 'exact-e1p3', binaryHashes: expectedHashes.e1p3 })),
  zombies, engine, java, configs: metadata, files };
const manifestBytes = text(manifest); fs.writeFileSync(manifestPath, manifestBytes, { flag: 'wx' });
const manifestHash = sha(Buffer.from(manifestBytes)); fs.writeFileSync(`${manifestPath}.sha256`, `${manifestHash}\n`, { flag: 'wx' });
console.log(text({ status: 'FROZEN_NOT_RUN', manifest: manifestPath, manifestSha256: manifestHash,
  cohorts: cohorts.length, configs: configs.length, totalBattles: design.totalBattles, excludedSeedRanges: excludedRanges.length }));
