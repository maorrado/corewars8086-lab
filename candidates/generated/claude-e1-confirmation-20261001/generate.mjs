// Input preflight and one-time freeze only. Never launches a process or reads battle outcomes.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assert, equal, sha, hashFile, read, text, record, check, seedRange, overlaps } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../..');
const frozen = path.join(here, 'frozen'), manifestFile = path.join(frozen, 'manifest.json');
const mode = process.argv[2], write = (file, value) => fs.writeFileSync(file, value, { flag: 'wx' });
assert(process.argv.length === 5 && ['--preflight', '--freeze', '--verify'].includes(mode) && process.argv[3] === '--inputs-sha256' && /^[a-f0-9]{64}$/i.test(process.argv[4]),
  'usage: node generate.mjs --preflight|--freeze|--verify --inputs-sha256 <root-reviewed-input-manifest-hash>');
const expectedInputHash = process.argv[4].toLowerCase();
const arms = ['m049', 'm050', 'c090', 'e1'];
const expectedHashes = {
  m049: ['106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973', '7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77'],
  m050: ['0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44', '06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782'],
  c090: ['e5a2681fe8a7d6a3af8cb5cedbe528f8629c39cb35fd12576b1d884612aa7a07', '99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b'],
  e1: ['9447b5add61d6f18bff2708adfd2038c3eb1a9008dd9cf03df5c046eff4a4349', '99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b'],
};
const design = { arms, candidateName: 'COD_pair', public2025Teams: 75, seniorTeams: 62, youthTeams: 13,
  independentPartitions: 8, cohortsPerPartition: 25, seedsPerPartition: 2, distinctSeedStrings: 16,
  battlesPerBlock: 25, battlesPerPartitionArm: 1250, battlesPerArm: 10000, totalBattles: 40000,
  configs: 32, threads: 1, parallel: false, telemetry: false,
  originalReplay: { partition: 'panel-01', arms, battlesPerArm: 1250, totalBattles: 5000, required: true } };
const decision = { metric: 'team points per battle, not battle-win percentage', candidates: ['c090', 'e1'], references: ['m049', 'm050'],
  primaryUnit: 'Eight independent randomized partition means; each averages its 25 cohorts and two distinct seed blocks.',
  confidence: 0.95, degreesOfFreedom: 7, criticalValue: 2.3646242510102993,
  contrasts: [['c090', 'm049'], ['c090', 'm050'], ['e1', 'm049'], ['e1', 'm050'], ['e1', 'c090']],
  gate: 'After every arm/partition and the four original-engine replays complete: candidate pooled delta > 0 AND partition-mean 95% interval lower bound > 0 against EACH exact control, plus exact original replay scores.',
  caveat: 'Nominal per-contrast 95% intervals, not simultaneous familywise confidence. Panel randomization inference on this fixed public pool, not universal superiority.',
  otherwise: 'If any control contrast has 95% upper bound < 0, report supported inferiority to at least one control on this pool; otherwise inconclusive. Negative observed mean alone is not supported inferiority. No universal inference, adaptive stopping, old-result pooling, automatic final replacement, or unrequested leader modifications.' };
if (mode !== '--verify') assert(!fs.existsSync(frozen), 'Refusing existing freeze, including interrupted entropy draw');
const sources = new Map(), add = file => { const item = record(file); sources.set(item.path, item); return item; };
const priorFile = path.join(root, 'candidates/generated/codex-goal-20261001/coverage-dwell/screen/manifest.json');
equal(add(priorFile).sha256, '89fc3f6af02bee8f5f90bd822c82cbb32622c0aa81d23485ff18f3eb014db541', 'latest frozen coverage-dwell inputs');
const previous = read(priorFile), known = new Map(previous.files.map(item => [item.path, item]));
const pool = previous.pool, zombies = previous.zombies;
assert(pool.length === 75 && new Set(pool.map(t => t.name)).size === 75, 'full 75-team roster');
equal(pool.map(t => t.name), pool.map(t => t.name).sort(), 'canonical roster ordering');
equal([pool.filter(t => t.name.startsWith('A_')).length, pool.filter(t => t.name.startsWith('Y_')).length], [62, 13], 'senior/youth counts');
assert(pool.every(t => t.warriors.length === 2) && zombies.length === 4, 'two-warrior teams and four Zombies');
for (const file of [...pool.flatMap(t => t.warriors), ...zombies.map(z => z.path)]) {
  assert(known.has(file), 'missing frozen roster provenance'); equal(add(file), known.get(file), 'frozen opponent/Zombie identity');
}
const { engine, java, runner, researchRuntime } = previous;
for (const item of [engine, java, runner, ...researchRuntime.sources, ...researchRuntime.classes]) { check(item); add(item.path); }
const helper = path.join(root, 'candidates/generated/codex-goal-20261001/bootstrap-holdout/protocol.mjs');
equal(add(helper), known.get(helper), 'reviewed helper identity');
const claudeRanges = ['gen-oct1-001', 'gen-oct1-002', 'hold-oct1-001', 'hold-oct1-002'].map(seed => seedRange(seed, 50));
const excludedRanges = [...new Map([...previous.randomness.excludedRanges, previous.randomness.range, ...claudeRanges].map(r => [JSON.stringify(r), r])).values()];
assert(previous.randomness.excludedRanges.length + 1 === 29 && excludedRanges.length === 33, '29 inherited plus four Claude seed ranges');
for (const r of excludedRanges) equal(r, seedRange(r.seed, r.lastWarSeed - r.firstWarSeed + 1), 'excluded engine-seed arithmetic');

// Bound to root's reviewed local source snapshot and independent assembly.
// The external Claude source is never a live battle input.
const inputFile = path.join(here, 'provenance.json');
equal(add(inputFile).sha256, expectedInputHash, 'explicit reviewed source/assembly provenance pin');
const input = read(inputFile);
const variants = input.variants;
equal(input.status, 'PASS', 'root source/assembly provenance status');
equal(Object.keys(variants), arms, 'exact four provenance arms');
assert(Array.isArray(input.files) && input.files.length > 0, 'missing source provenance files');
for (const item of input.files) { check(item); add(item.path); }
const inputRecords = new Map(input.files.map(item => [item.path, item]));
for (const arm of arms) {
  assert(variants[arm].length === 2 && variants[arm].every(path.isAbsolute), 'two absolute local contender paths');
  equal(variants[arm].map(hashFile), expectedHashes[arm], 'exact immutable arm hashes');
  for (const file of variants[arm]) equal(add(file), inputRecords.get(file), 'contender bound to provenance');
}
const snapshotFile = path.join(here, 'source-snapshot/manifest.json'), assemblyFile = path.join(here, 'assembly/manifest.json');
equal(add(snapshotFile), inputRecords.get(snapshotFile), 'root-reviewed source snapshot');
equal(add(assemblyFile), inputRecords.get(assemblyFile), 'independent assembly manifest');
const snapshot = read(snapshotFile), assembly = read(assemblyFile);
assert(Array.isArray(snapshot.sources) && snapshot.sources.length === 4, 'four snapshotted candidate sources');
const snapSources = new Map(snapshot.sources.map(item => [item.snapshot.path, item]));
for (const item of [...snapshot.sources, ...snapshot.binaries]) {
  check(item.snapshot); equal(add(item.snapshot.path), inputRecords.get(item.snapshot.path), 'local snapshot recorded');
  equal([item.input.bytes, item.input.sha256], [item.snapshot.bytes, item.snapshot.sha256], 'snapshot original identity');
}
assert(Array.isArray(assembly) && assembly.length === 4, 'four independently assembled candidate sources');
equal(new Set(assembly.map(item => item.output)).size, 4, 'distinct assembly outputs');
for (const file of [...variants.c090, ...variants.e1]) {
  const item = assembly.find(entry => path.resolve(entry.output) === file); assert(item, 'candidate lacks independent assembly');
  const source = path.resolve(item.input); assert(snapSources.has(source), 'assembly must use snapshotted source');
  equal(add(source).sha256, item.sourceSha256, 'assembly source identity');
  equal(hashFile(file), item.binarySha256, 'independent assembly binary identity');
  equal(fs.statSync(file).size, item.size, 'independent assembly size');
}

function shuffle(salt) {
  assert(/^[a-f0-9]{64}$/.test(salt), 'invalid partition salt');
  let counter = 0, bytes = Buffer.alloc(0), offset = 0;
  function bounded(bound) {
    const limit = Math.floor(0x100000000 / bound) * bound;
    let value;
    do {
      if (offset + 4 > bytes.length) {
        const count = Buffer.alloc(8); count.writeBigUInt64BE(BigInt(counter++));
        bytes = crypto.createHash('sha256').update(Buffer.from(salt, 'hex')).update(count).digest(); offset = 0;
      }
      value = bytes.readUInt32BE(offset); offset += 4;
    } while (value >= limit);
    return value % bound;
  }
  const result = [...pool];
  for (let i = result.length - 1; i > 0; i--) { const j = bounded(i + 1); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
function panelsFor(randomness) {
  assert(randomness.panels.length === 8, 'eight partition draws');
  return randomness.panels.map((draw, i) => {
    const id = `panel-${String(i + 1).padStart(2, '0')}`; equal(draw.id, id, 'fixed partition IDs');
    assert(draw.seeds.length === 2, 'two distinct assigned seeds per partition');
    const teams = shuffle(draw.salt);
    return { id, salt: draw.salt, seeds: draw.seeds, cohorts: Array.from({ length: 25 }, (_, j) => ({
      id: `${id}-cohort-${String(j + 1).padStart(2, '0')}`, opponents: teams.slice(j * 3, j * 3 + 3) })) };
  });
}
function verifyDraw(randomness) {
  equal(randomness.excludedRanges, excludedRanges, 'complete exclusion history');
  const seeds = randomness.panels.flatMap(p => p.seeds), salts = randomness.panels.map(p => p.salt);
  assert(seeds.length === 16 && new Set(seeds).size === 16 && new Set(salts).size === 8, 'distinct seeds and partition salts');
  const ranges = seeds.map(seed => seedRange(seed, 25)); equal(randomness.ranges, ranges, 'actual 25-war seed ranges');
  for (let i = 0; i < ranges.length; i++) {
    assert(!excludedRanges.some(r => overlaps(r, ranges[i])), 'overlap with old seed range');
    assert(!ranges.slice(0, i).some(r => overlaps(r, ranges[i])), 'overlap between new seed ranges');
  }
}
function configsFor(panels) {
  return panels.flatMap(panel => arms.map(arm => {
    const id = `${panel.id}-${arm}`;
    return { id, panel: panel.id, arm, path: path.join(frozen, `${id}.json`), config: {
      experimentId: `claude-e1-confirmation-20261001-${id}`, java: java.path, jar: engine.path,
      outputPath: path.join(frozen, 'original-results', `${id}.json`), runDirectory: path.join(frozen, 'original-runs', id),
      candidate: { name: 'COD_pair', warriors: ['A', 'B'].map(side => path.join(frozen, 'binaries', arm, side)) },
      battles: 25, threads: 1, parallel: false, telemetry: false, seeds: panel.seeds, cohorts: panel.cohorts, zombies,
    } };
  }));
}
for (const file of ['generate.mjs', 'analyze.mjs', 'PROTOCOL.md']) add(path.join(here, file));
const files = [...sources.values()]; files.forEach(check);
if (mode === '--preflight') {
  console.log(JSON.stringify({ status: 'PREFLIGHT_ONLY', entropyDrawn: false, expectedInputHash, excludedRanges: excludedRanges.length, design })); process.exit(0);
}
if (mode === '--verify') {
  equal(hashFile(manifestFile), fs.readFileSync(`${manifestFile}.sha256`, 'utf8').trim(), 'freeze checksum');
  const manifest = read(manifestFile); manifest.files.forEach(check);
  equal(manifest.design, design, 'fixed confirmation design'); equal(manifest.decision, decision, 'fixed statistical plan');
  equal(manifest.inputs, { expectedSha256: expectedInputHash, artifact: record(inputFile), result: input }, 'source provenance binding');
  verifyDraw(manifest.randomness); equal(manifest.panels, panelsFor(manifest.randomness), 'fresh partitions reconstructed');
  equal(manifest.pool, pool, 'same full public roster'); equal(manifest.zombies, zombies, 'same Zombies');
  for (const item of configsFor(manifest.panels)) equal(read(item.path), item.config, 'exact panel/arm config');
  for (const arm of arms) for (let i = 0; i < 2; i++) equal(hashFile(path.join(frozen, 'binaries', arm, i === 0 ? 'A' : 'B')), expectedHashes[arm][i], 'frozen contender');
  console.log(JSON.stringify({ status: 'INPUTS_VERIFIED', manifestSha256: hashFile(manifestFile), design })); process.exit(0);
}
fs.mkdirSync(frozen); // Exclusive claim before any entropy draw; no retries/redraw.
const randomness = { drawnAt: new Date().toISOString(), excludedRanges,
  algorithm: 'Independent 32-byte salts; SHA256(salt||uint64be counter), rejection-sampled unbiased Fisher-Yates over sorted full75 roster.',
  panels: Array.from({ length: 8 }, (_, i) => ({ id: `panel-${String(i + 1).padStart(2, '0')}`,
    salt: crypto.randomBytes(32).toString('hex'), seeds: Array.from({ length: 2 }, (_, j) =>
      `e1-confirm-20261001-p${i + 1}-s${j + 1}-${crypto.randomBytes(12).toString('hex')}`) })) };
randomness.ranges = randomness.panels.flatMap(p => p.seeds).map(seed => seedRange(seed, 25));
write(path.join(frozen, 'randomness.json'), text(randomness));
verifyDraw(randomness); // Failed attempts remain recorded and cannot be overwritten.
const panels = panelsFor(randomness), copies = [];
for (const arm of arms) {
  const dir = path.join(frozen, 'binaries', arm); fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < 2; i++) {
    const target = path.join(dir, i === 0 ? 'A' : 'B'); fs.copyFileSync(variants[arm][i], target, fs.constants.COPYFILE_EXCL);
    equal(hashFile(target), expectedHashes[arm][i], 'exact contender copy'); copies.push(record(target));
  }
}
const configs = configsFor(panels); for (const item of configs) write(item.path, text(item.config)); files.forEach(check);
const manifest = { schemaVersion: 1, suite: 'claude-e1-confirmation-20261001', frozenAt: new Date().toISOString(), design, decision,
  inputs: { expectedSha256: expectedInputHash, artifact: record(inputFile), result: input }, expectedHashes,
  pool, zombies, randomness, panels, engine, java, runner, researchRuntime,
  configs: configs.map(item => ({ id: item.id, panel: item.panel, arm: item.arm, ...record(item.path), battles: 1250 })),
  files: [...files, ...copies, record(path.join(frozen, 'randomness.json')), ...configs.map(item => record(item.path))] };
const serialized = text(manifest); write(manifestFile, serialized); write(`${manifestFile}.sha256`, `${sha(serialized)}\n`);
console.log(JSON.stringify({ status: 'FROZEN_NO_RUNS_LAUNCHED', manifest: manifestFile, sha256: sha(serialized), design }));
