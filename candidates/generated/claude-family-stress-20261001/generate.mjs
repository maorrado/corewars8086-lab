// Authoring/freezing only. Never reads battle outcomes or launches a process.
// Do not invoke --freeze until the root has reviewed this protocol and completed
// the separate general-strength confirmation requested before this stress study.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { arms, clones, candidateNames, design, analysisPlan, weights, assert, equal, sha,
  populationIds, populationSchedule, duelSchedule, seedRange, validateRandomness } from './model.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../..');
const frozen = path.join(here, 'frozen'), manifestFile = path.join(frozen, 'manifest.json');
const mode = process.argv[2];
assert(process.argv.length === 5 && ['--preflight', '--freeze', '--verify'].includes(mode) &&
  process.argv[3] === '--general-sha256' && /^[a-f0-9]{64}$/.test(process.argv[4]),
  'usage: node generate.mjs --preflight|--freeze|--verify --general-sha256 <reviewed general study input manifest SHA256>');
const generalHash = process.argv[4];
if (mode !== '--verify') assert(!fs.existsSync(frozen), 'refusing existing freeze or interrupted entropy draw');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const text = value => `${JSON.stringify(value, null, 2)}\n`;
const hash = file => sha(fs.readFileSync(file));
const record = file => ({ path: path.resolve(file), bytes: fs.statSync(file).size, sha256: hash(file) });
const check = item => equal(record(item.path), item, `changed pinned input: ${item.path}`);
const write = (file, value) => fs.writeFileSync(file, value, { flag: 'wx' });
const files = new Map(), add = file => { const r = record(file); files.set(r.path, r); return r; };
const expectedHashes = {
  m049: ['106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973', '7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77'],
  m050: ['0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44', '06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782'],
  c090: ['e5a2681fe8a7d6a3af8cb5cedbe528f8629c39cb35fd12576b1d884612aa7a07', '99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b'],
  e1: ['9447b5add61d6f18bff2708adfd2038c3eb1a9008dd9cf03df5c046eff4a4349', '99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b'],
  synthesis: ['3875482b4d57a8d29f474215ed9dd41249bc17c46b1a662c4906554b5d859b9c', '99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b'],
  'fixed-toggle': ['bea990bbf2c60cb4c39d80dd5b533f83a1eb62f1ad202020c6d4e93cbebc2747', '9761054288100948cfcf3610c8d989f16eba68f0f501b90c21b7de9ead380c8f'],
};

const generalFile = path.join(root, 'candidates/generated/claude-e1-confirmation-20261001/frozen/manifest.json');
equal(add(generalFile).sha256, generalHash, 'explicit root-reviewed general-study manifest pin');
const general = read(generalFile);
equal(general.suite, 'claude-e1-confirmation-20261001', 'general study identity');
equal(general.design.arms, arms, 'general study arms');
const provenanceFile = path.join(root, 'candidates/generated/claude-e1-confirmation-20261001/provenance.json');
equal(add(provenanceFile).sha256, 'f882f42bea0e77a6328580843a417d48e08e1668f1055da5accf5ed6974acddf', 'explicit root-reviewed source provenance');
equal(general.inputs.artifact, record(provenanceFile), 'general study bound to same reviewed provenance');
const provenance = read(provenanceFile);
equal(provenance.status, 'PASS', 'source assembly and recurrence provenance');
for (const r of provenance.files) { check(r); add(r.path); }
const known = new Map(general.files.map(item => [item.path, item]));
const sourcePool = general.pool, sourceZombies = general.zombies;
equal(sourcePool.length, 75, '75 public online-stage entrants');
equal(new Set(sourcePool.map(t => t.name)).size, 75, '75 unique public names');
equal([sourcePool.filter(t => t.name.startsWith('A_')).length, sourcePool.filter(t => t.name.startsWith('Y_')).length], [62, 13], 'public categories');
equal(sourceZombies.length, 4, 'four online-stage Zombies');
assert(sourcePool.every(t => /^[A-Za-z0-9_-]+$/.test(t.name) && t.warriors.length === 2), 'safe public pair names');
assert(sourceZombies.every(z => /^[A-Za-z0-9_-]+$/.test(z.name)), 'safe Zombie names without file extensions');
for (const file of [...sourcePool.flatMap(t => t.warriors), ...sourceZombies.map(z => z.path)]) {
  assert(known.has(file), 'public input absent from general manifest'); equal(add(file), known.get(file), 'public frozen identity');
}
const { engine, java, runner, researchRuntime } = general;
equal(engine.sha256, '31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d', 'original deterministic engine');
equal(runner.sha256, '6618a0d865be0b87389056e09a972fcef88f43d4d2e9f2a9f48bfc8a7ba2d786', 'original runner');
for (const r of [engine, java, runner, ...researchRuntime.sources, ...researchRuntime.classes]) { check(r); add(r.path); }
const variants = { ...provenance.variants, synthesis: ['SubmittedA', 'SubmittedB'].map(side =>
  path.join(root, 'build/claude-synthesis-audit-20260930', side)),
  'fixed-toggle': ['A', 'B'].map(side => path.join(root, 'build/claude-fixed-toggle-2026-09-30', side)) };
const toggleAssemblyFile = path.join(root, 'build/claude-fixed-toggle-2026-09-30/manifest.json');
equal(add(toggleAssemblyFile).sha256, 'c8b5064e21ebe723b66cd200f16229dca615c311d788e4901964b5e1dbbe1c47', 'fixed-toggle assembly identity');
const toggleAssembly = read(toggleAssemblyFile);
equal(toggleAssembly.length, 2, 'two fixed-toggle components');
for (const [i, entry] of toggleAssembly.entries()) {
  equal(path.resolve(entry.output), variants['fixed-toggle'][i], 'fixed-toggle output path');
  equal(add(path.resolve(entry.input)).sha256, entry.sourceSha256, 'fixed-toggle source identity');
  equal(add(path.resolve(entry.output)).sha256, entry.binarySha256, 'fixed-toggle assembled binary');
  equal(entry.binarySha256, expectedHashes['fixed-toggle'][i], 'fixed-toggle expected hash');
  equal(fs.statSync(entry.output).size, [193, 121][i], 'fixed-toggle exact size');
}
for (const [variant, paths] of Object.entries(variants)) {
  equal(paths.length, 2, 'two warriors per pair');
  equal(paths.map(file => add(file).sha256), expectedHashes[variant], `${variant} exact binaries`);
}
// All 33 older ranges and all 16 new general-confirmation ranges are inherited.
// Any new experiment frozen before this one must be added to the parent registry
// before freezing here; no tool can discover unrecorded external seed usage.
equal(general.randomness.ranges.length, 16, 'all 16 general-study ranges');
const excludedRanges = [...new Map([...general.randomness.excludedRanges, ...general.randomness.ranges]
  .map(r => [JSON.stringify(r), r])).values()];
for (const r of excludedRanges) equal(r, seedRange(r.seed, r.lastWarSeed - r.firstWarSeed + 1), 'canonical exclusion range');
assert(excludedRanges.length >= 49, 'expected complete preceding range registry');
for (const file of ['model.mjs', 'generate.mjs', 'analyze.mjs', 'self-test.mjs', 'PROTOCOL.md']) add(path.join(here, file));
const sourceFiles = [...files.values()]; sourceFiles.forEach(check);

const pool = sourcePool.map(t => ({ name: t.name, warriors: [1, 2].map(i => path.join(frozen, 'public', `${t.name}${i}`)) }));
const zombies = sourceZombies.map(z => ({ name: z.name, path: path.join(frozen, 'zombies', z.name) }));
const frozenVariants = Object.fromEntries(Object.keys(variants).map(v => [v, ['A', 'B'].map(side => path.join(frozen, 'binaries', v, side))]));
function makeConfigs(randomness, schedule) {
  const configBase = { java: java.path, jar: engine.path, threads: 1, parallel: false, telemetry: false, zombies };
  const population = schedule.flatMap(c => arms.flatMap(arm => candidateNames.map((name, orientation) => {
    const id = `population-${c.id}-${arm}-o${orientation + 1}`;
    const opponents = [...c.publicOpponents, ...c.familyOpponents.map(t => ({ name: t.name, warriors: frozenVariants[t.variant] }))];
    assert(opponents.length === 3 && new Set([name, ...opponents.map(t => t.name)]).size === 4, 'exactly four distinct scoring groups');
    return { id, kind: 'population', arm, k: c.k, cohortId: c.id, orientation,
      candidateName: name, path: path.join(frozen, 'configs', `${id}.json`), executions: 10,
      config: { ...configBase, experimentId: `claude-family-stress-20261001-${id}`,
        outputPath: path.join(frozen, 'original-results', `${id}.json`), runDirectory: path.join(frozen, 'original-runs', id),
        candidate: { name, warriors: frozenVariants[arm] }, battles: 10, seeds: [randomness.population[c.id]],
        cohorts: [{ id: c.id, opponents }] } };
  })));
  const duelModel = duelSchedule();
  const duels = duelModel.physical.map(d => ({ id: d.id, kind: 'duel', mapping: d.mapping,
    path: path.join(frozen, 'configs', `${d.id}.json`), executions: 200,
    config: { ...configBase, experimentId: `claude-family-stress-20261001-${d.id}`,
      outputPath: path.join(frozen, 'original-results', `${d.id}.json`), runDirectory: path.join(frozen, 'original-runs', d.id),
      candidate: { name: 'DUEL_A', warriors: frozenVariants[d.mapping.DUEL_A] }, battles: 25, seeds: randomness.duel,
      cohorts: [{ id: d.id, opponents: [{ name: 'DUEL_B', warriors: frozenVariants[d.mapping.DUEL_B] }] }] } }));
  equal(population.reduce((s, c) => s + c.executions, 0), 6400, 'population budget');
  equal(duels.reduce((s, c) => s + c.executions, 0), 5600, 'deduplicated duel budget');
  return { configs: [...population, ...duels], logicalDuels: duelModel.logical };
}

if (mode === '--preflight') {
  console.log(text({ status: 'PREFLIGHT_NO_ENTROPY_NO_WRITES_NO_RUNS', design, weights, generalHash,
    excludedRanges: excludedRanges.length, sourceFileCount: sourceFiles.length })); process.exit(0);
}
if (mode === '--verify') {
  equal(hash(manifestFile), fs.readFileSync(`${manifestFile}.sha256`, 'utf8').trim(), 'stress manifest checksum');
  const m = read(manifestFile); m.files.forEach(check);
  equal(m.design, design, 'unchanged design'); equal(m.weights, weights, 'unchanged hypergeometric weights');
  equal(m.analysisPlan, analysisPlan, 'unchanged analysis plan');
  equal(m.generalManifest, record(generalFile), 'same general-study source');
  equal(m.excludedRanges, excludedRanges, 'complete excluded-range registry');
  equal(m.randomness.ranges, validateRandomness(m.randomness, excludedRanges), 'fresh range arithmetic');
  const schedule = populationSchedule(pool, m.randomness.salt); equal(m.schedule, schedule, 'reconstructed random cohorts');
  const regenerated = makeConfigs(m.randomness, schedule);
  equal(m.logicalDuels, regenerated.logicalDuels, 'logical duel score routing');
  for (const c of regenerated.configs) equal(read(c.path), c.config, 'reconstructed configuration');
  equal(m.configs, regenerated.configs.map(({ config, path: configPath, ...details }) => ({ ...details, ...record(configPath) })),
    'exact physical config metadata and binary/score routing');
  console.log(text({ status: 'VERIFIED_NO_RUNS', design, manifestSha256: hash(manifestFile) })); process.exit(0);
}

fs.mkdirSync(frozen); // Claim once before entropy; interrupted attempts are preserved.
const randomness = { drawnAt: new Date().toISOString(),
  provenance: 'Single post-review crypto draw: one 32-byte salt, 80 population and eight duel 12-byte seed suffixes. No automatic redraw or outcome access.',
  salt: crypto.randomBytes(32).toString('hex'),
  population: Object.fromEntries(populationIds.map(id => [id, `family-stress-20261001-${id}-${crypto.randomBytes(12).toString('hex')}`])),
  duel: Array.from({ length: 8 }, (_, i) => `family-duel-20261001-s${i + 1}-${crypto.randomBytes(12).toString('hex')}`) };
write(path.join(frozen, 'randomness-attempt.json'), text(randomness));
randomness.ranges = validateRandomness(randomness, excludedRanges);
write(path.join(frozen, 'randomness.json'), text(randomness));
const copies = [];
function copy(source, target) {
  const before = record(source); assert(files.has(before.path), 'copy source must have frozen provenance');
  equal(before, files.get(before.path), 'unchanged copy source');
  fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
  const after = record(target); equal([after.bytes, after.sha256], [before.bytes, before.sha256], 'exact copied bytes'); copies.push(after);
}
sourcePool.forEach((team, i) => team.warriors.forEach((file, side) => copy(file, pool[i].warriors[side])));
sourceZombies.forEach((z, i) => copy(z.path, zombies[i].path));
for (const [variant, paths] of Object.entries(variants)) paths.forEach((file, i) => copy(file, frozenVariants[variant][i]));
const schedule = populationSchedule(pool, randomness.salt), generated = makeConfigs(randomness, schedule);
fs.mkdirSync(path.join(frozen, 'configs'));
for (const c of generated.configs) write(c.path, text(c.config));
sourceFiles.forEach(check);
const metadata = generated.configs.map(({ config, path: configPath, ...details }) => ({ ...details, ...record(configPath) }));
const manifest = { schemaVersion: 1, suite: 'claude-family-stress-20261001', frozenAt: new Date().toISOString(),
  design, analysisPlan, weights, generalManifest: record(generalFile), provenance: record(provenanceFile), expectedHashes,
  engine, java, runner, researchRuntime, excludedRanges, randomness, pool, zombies, frozenVariants,
  schedule, configs: metadata, logicalDuels: generated.logicalDuels,
  files: [...sourceFiles, ...copies, record(path.join(frozen, 'randomness-attempt.json')), record(path.join(frozen, 'randomness.json')),
    ...generated.configs.map(c => record(c.path))] };
const serialized = text(manifest); write(manifestFile, serialized); write(`${manifestFile}.sha256`, `${sha(serialized)}\n`);
console.log(text({ status: 'FROZEN_NO_RUNS', manifest: manifestFile, sha256: sha(serialized), design,
  configs: metadata.length, executionCount: metadata.reduce((s, c) => s + c.executions, 0) }));
