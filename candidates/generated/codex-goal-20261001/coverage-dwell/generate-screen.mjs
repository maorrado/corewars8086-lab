// Authoring/freeze only: no subprocesses, battle outcomes, or automatic redraws.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assert, equal, sha, hashFile, read, text, record, check, seedRange, overlaps } from '../bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../../..');
const screen = path.join(here, 'screen'), manifestPath = path.join(screen, 'manifest.json');
const suite = 'codex-goal-20261001-coverage-dwell-screen';
const arms = ['m050', 'lower-strides', 'upper-strides'];
const mode = process.argv[2], write = (file, value) => fs.writeFileSync(file, value, { flag: 'wx' });
assert(process.argv.length === 5 && ['--preflight', '--freeze', '--verify'].includes(mode) && process.argv[3] === '--validation-sha256' && /^[a-f0-9]{64}$/i.test(process.argv[4]),
  'usage: node generate-screen.mjs --preflight|--freeze|--verify --validation-sha256 <reviewed-expected-hash>');
const expectedValidationHash = process.argv[4].toLowerCase();
const controlHashes = ['0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44', '06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782'];
const componentIds = ['A-lower', 'B-lower', 'A-upper', 'B-upper'];
const componentHashes = ['c2c64f994af48d1e82e76071db5d904ae23678a8aafd465dc7a82039a6dc2c2b', 'b40603e61caf3a28d8228a1219319a4badfd5a68666d177617f13268e28e17c1', '87155e106697229096aef3d27ba632741791bcd8b1fde3d0cd6d6acc4c900ebf', 'ee615b6f885e038c27fe787bc7be21904f502b1b0d948e462f053f950315a1eb'];
const workerHex = 'a5f3a529d4292f8b3fb10931f6ab4fff1f';
const variants = { m050: ['m050-A', 'm050-B'],
  'lower-strides': ['A-lower', 'B-lower'], 'upper-strides': ['A-upper', 'B-upper'] };
const design = { arms, candidateName: 'COD_pair', published2025Teams: 75, seniorTeams: 62, youthTeams: 13,
  cohorts: 25, opponentSlots: 75, repeats: 0, seeds: 1, battlesPerBlock: 20, battlesPerArm: 500,
  totalBattles: 1500, threads: 1, parallel: false, telemetry: false };
const decision = { metric: 'team points per battle, not win percentage', reference: 'm050', candidates: arms.slice(1),
  primary: 'equal-weight mean of the 25 matched cohort deltas, candidate minus fresh exact m050',
  gate: 'After all three arms complete, advance each candidate only if its complete paired mean delta is strictly positive. No partial-arm selection, adaptive stopping or extension, outcome-driven redraw, or old-result pooling.',
  interval: 'Descriptive two-sided 95% cohort t interval, df=24, critical 2.0638985616280205; not a significance gate and not 500 independent trials.',
  boundary: 'Selection among two candidates is exploratory. Every selected candidate needs a fresh matched holdout against BOTH exact m049 and m050. No screen champion, final replacement, unseen-population or universal claim.' };

function shuffledTeams(salt, teams) {
  assert(/^[a-f0-9]{64}$/.test(salt), 'invalid shuffle salt');
  let counter = 0, bytes = Buffer.alloc(0), offset = 0;
  const bounded = bound => {
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
  };
  const result = [...teams];
  for (let i = result.length - 1; i > 0; i--) { const j = bounded(i + 1); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
function makeCohorts(shuffled) {
  return Array.from({ length: 25 }, (_, i) => ({ id: `coverage-dwell-full75-${String(i + 1).padStart(2, '0')}`, opponents: shuffled.slice(i * 3, i * 3 + 3) }));
}
function makeConfigs(randomness, cohorts, zombies, engine, java) {
  return arms.map(arm => ({ arm, path: path.join(screen, `${arm}.json`), config: {
    experimentId: `${suite}-${arm}`, java: java.path, jar: engine.path,
    outputPath: path.join(screen, 'results', `${arm}.json`), runDirectory: path.join(screen, 'runs', arm),
    candidate: { name: 'COD_pair', warriors: variants[arm].map(file => path.join(screen, 'frozen', file)) },
    battles: 20, threads: 1, parallel: false, telemetry: false, seeds: [randomness.seed], cohorts, zombies,
  } }));
}
if (mode !== '--verify') assert(!fs.existsSync(screen), 'Refusing an existing screen, including an interrupted entropy draw');
const sources = new Map(), add = file => { const item = record(file); sources.set(item.path, item); return item; };
const auditFolder = path.join(root, 'candidates/generated/claude-synthesis-audit-20260930');
const auditFile = path.join(auditFolder, 'manifest.json'), baseFile = path.join(auditFolder, 'fresh-m050.json');
equal(add(auditFile).sha256, '73de3d03de97bfb7628bf6b7169f921dd3ab8ffdfb09ff5dd0dfc6eadd96eaa7', 'original broad audit manifest');
const audit = read(auditFile), baseRecord = audit.configs.find(item => item.id === 'fresh-m050');
equal(add(baseFile).sha256, baseRecord.sha256, 'full 75-team source config');
const base = read(baseFile), resolveBase = file => path.resolve(auditFolder, file);
const knownInputs = new Map(audit.binaries.map(item => [path.resolve(root, item.path), item]));
const pool = base.cohorts.flatMap(cohort => cohort.opponents).map(team => ({ name: team.name, warriors: team.warriors.map(resolveBase) }))
  .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
assert(pool.length === 75 && new Set(pool.map(team => team.name)).size === 75, 'expected 75 published teams exactly once');
assert(pool.filter(t => t.name.startsWith('A_')).length === 62 && pool.filter(t => t.name.startsWith('Y_')).length === 13, 'expected 62 senior and 13 youth teams');
const zombies = base.zombies.map(z => ({ name: z.name, path: resolveBase(z.path) }));
assert(zombies.length === 4 && new Set(zombies.map(z => z.name)).size === 4, 'expected four distinct frozen Zombies');
const controls = base.candidate.warriors.map(resolveBase);
equal(controls.map(hashFile), controlHashes, 'exact m050 controls');
for (const file of [...pool.flatMap(t => { assert(t.warriors.length === 2, 'two warriors per team'); return t.warriors; }), ...zombies.map(z => z.path), ...controls]) {
  const expected = knownInputs.get(file); assert(expected, `input lacks original frozen provenance: ${file}`);
  const item = add(file); equal(item.sha256, expected.sha256, 'original input hash'); equal(item.bytes, expected.bytes, 'original input length');
}

// Input manifests only: exclude the latest shorter-dwell range and its full
// transitive history, including word-trigger and all earlier frozen ranges.
const priorFile = path.resolve(here, '../shorter-dwell/screen/manifest.json');
equal(add(priorFile).sha256, '4a6ed9ce480098cf78e812d6e42659a232e86472fc03379e99eba08e0bf3eabd', 'latest frozen shorter-dwell screen');
const previous = read(priorFile);
equal([previous.randomness.range.firstWarSeed, previous.randomness.range.lastWarSeed], [-1205286788, -1205286769], 'latest shorter-dwell seed range');
const excludedRanges = [...new Map([...previous.randomness.excludedRanges, previous.randomness.range].map(r => [JSON.stringify(r), r])).values()];
for (const range of excludedRanges) equal(range, seedRange(range.seed, range.lastWarSeed - range.firstWarSeed + 1), 'known Java seed range');
assert(excludedRanges.length === 28, 'expected latest range plus 27 transitive exclusions');
const engine = add(path.resolve(root, audit.engine.path)), java = add(path.resolve(root, audit.java.path)), runner = add(path.resolve(root, audit.runner.path));
equal(engine.sha256, audit.engine.sha256, 'original engine'); equal(java.sha256, audit.java.sha256, 'Java runtime'); equal(runner.sha256, audit.runner.sha256, 'original runner');
equal(engine, previous.engine, 'same original engine'); equal(java, previous.java, 'same Java'); equal(runner, previous.runner, 'same original runner');
for (const item of [...previous.researchRuntime.sources, ...previous.researchRuntime.classes]) { check(item); add(item.path); }
const helper = path.resolve(here, '../bootstrap-holdout/protocol.mjs');
const helperRecord = previous.files.find(item => item.path === helper); assert(helperRecord, 'missing frozen helper provenance'); check(helperRecord); add(helper);

const sourceManifestPath = path.join(here, 'manifest.json');
equal(add(sourceManifestPath).sha256, 'e2e9b52732e39b5dd8d5020dd265f61f64c050d7cb799956292bba911e009060', 'reviewed source design manifest');
const sourceDesign = read(sourceManifestPath);
equal(add(path.resolve(root, sourceDesign.generator)).sha256, sourceDesign.generatorSha256, 'reviewed source generator');
equal(Object.keys(sourceDesign.components), componentIds, 'exact four source components');
equal(sourceDesign.arms, arms.slice(1).map(id => ({ id, A: variants[id][0] === 'm050-A' ? 'baseline.A' : variants[id][0], B: variants[id][1] })), 'two reviewed paired arms');
const baselineBytes = {};
for (const [index, side] of ['A', 'B'].entries()) {
  const item = sourceDesign.baseline[side], source = path.resolve(root, item.source), binary = path.resolve(root, item.binary);
  equal(add(source).sha256, item.sourceSha256, 'baseline source identity');
  equal(add(binary).sha256, controlHashes[index], 'baseline design binary identity');
  equal(item.binarySha256, controlHashes[index], 'source manifest exact control identity');
  baselineBytes[side] = fs.readFileSync(binary);
  equal(baselineBytes[side].length, index === 0 ? 189 : 117, 'control length');
  equal(baselineBytes[side].subarray(index === 0 ? 0xac : 0x64).toString('hex'), workerHex, 'unchanged control 17-byte worker');
}
const assemblyPath = path.join(here, 'build/manifest.json'), assembly = read(assemblyPath); add(assemblyPath);
assert(Array.isArray(assembly) && assembly.length === 4, 'need exact four-file assembly manifest');
const candidates = componentIds.map((id, index) => {
  const definition = sourceDesign.components[id], source = path.resolve(root, definition.source), binary = path.join(here, 'build', id);
  const entry = assembly[index], side = definition.letter, original = baselineBytes[side];
  equal(path.resolve(entry.input), source, 'assembly source path'); equal(path.resolve(entry.output), binary, 'assembly binary path');
  equal(add(source).sha256, definition.sourceSha256, 'source design identity'); equal(entry.sourceSha256, definition.sourceSha256, 'assembly source identity');
  equal(add(binary).sha256, componentHashes[index], 'reviewed binary hash'); equal(entry.binarySha256, componentHashes[index], 'assembly binary identity');
  equal(definition.expectedBinarySha256, componentHashes[index], 'source prediction identity');
  const bytes = fs.readFileSync(binary), offsets = side === 'A' ? [0xa1, 0xa4] : [0x59, 0x5c];
  equal(bytes.length, original.length, 'preserved image length'); equal(entry.size, original.length, 'assembly size');
  const changed = [...original.keys()].filter(i => original[i] !== bytes[i]);
  equal(changed, offsets, 'only DX/BP immediate high bytes change');
  equal(definition.binaryChanges.map(change => change.offset), offsets, 'source design byte offsets');
  const predicted = Buffer.from(original);
  for (const [i, register, opcode] of [[0, 'dx', 'ba00'], [1, 'bp', 'bd00']]) {
    equal(bytes.subarray(offsets[i] - 2, offsets[i]).toString('hex'), opcode, 'initializer opcode/low immediate unchanged');
    predicted[offsets[i]] = definition[register] >>> 8;
  }
  assert(bytes.equals(predicted), 'assembly differs from exact two-byte prediction');
  equal(definition.bp - definition.dx, 256, 'planned short trail');
  equal([definition.coverage.anchorsPerOrbit, definition.coverage.paintedBytesPerOrbit,
    definition.coverage.minPaintMultiplicity, definition.coverage.maxPaintMultiplicity], [256, 65536, 1, 1], 'ideal full support geometry');
  equal(bytes.subarray(side === 'A' ? 0xac : 0x64).toString('hex'), workerHex, 'unchanged private 17-byte worker');
  return binary;
});

// Root supplies a reviewed expected hash explicitly, never inferred from the
// current artifact. The exact pin and artifact are persisted in the manifest.
const validationPath = path.join(here, 'validation/result.json');
equal(add(validationPath).sha256, expectedValidationHash, 'explicit reviewed long-orbit validation pin');
const validation = read(validationPath);
equal(validation.status, 'PASS', 'long-orbit validation status');
equal([validation.offsets, validation.pairedPaths, validation.healthyPaths, validation.baselineUnhealthyPaths,
  validation.generations, validation.newFailures], [119, 714, 698, 16, 258, 0], 'complete long-orbit evidence and no-new-failure gate');
equal(validation.summary, 'Coverage PASS offsets=119 paired=714 healthy=698 baselineUnhealthy=16 generations=258 newFailures=0', 'long-orbit completion summary');
const validatedBinaries = [...['A', 'B'].map(side => path.resolve(root, sourceDesign.baseline[side].binary)), ...candidates];
equal(validation.binaries, validatedBinaries.map(record), 'all six exact validated binaries');
equal(validation.binaries.map(item => item.sha256), [...controlHashes, ...componentHashes], 'validated binary identities');
assert(Array.isArray(validation.files) && validation.files.length > 0, 'missing validation dependencies');
for (const item of validation.files) { check(item); add(item.path); }
equal(validation.files.find(item => item.path === engine.path), engine, 'validation original engine');
for (const file of ['validate.mjs', 'CoverageFixture.java', 'validation/classes/CoverageFixture.class']) {
  equal(validation.files.find(item => item.path === path.join(here, file)), record(path.join(here, file)), 'bound long-orbit authoring/class');
}
assert(validation.commands.length === 2 && validation.commands.every(command => command.exitCode === 0 && !command.error && !command.stderr), 'long-orbit build/run completion');
equal(validation.commands[1].executable, java.path, 'long-orbit Java');
equal(validation.commands[1].args, ['-cp', [path.join(here, 'validation/classes'),
  path.resolve(here, '../word-trigger/validation/verified-classes'), engine.path].join(path.delimiter),
  'CoverageFixture', ...validatedBinaries], 'original-only long-orbit command');
equal(validation.commands[1].stdout.trim(), validation.summary, 'observed long-orbit completion');

for (const file of ['generate-screen.mjs', 'analyze-screen.mjs', 'README.md', 'SCREEN-PROTOCOL.md', 'coverage-proof.mjs']) add(path.join(here, file));
const files = [...sources.values()]; files.forEach(check);
if (mode === '--preflight') {
  console.log(JSON.stringify({ status: 'PREFLIGHT_ONLY', entropyDrawn: false, expectedValidationHash, design, excludedRanges: excludedRanges.length, validation: record(validationPath) })); process.exit(0);
}
if (mode === '--verify') {
  equal(hashFile(manifestPath), fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim(), 'manifest checksum');
  const manifest = read(manifestPath); manifest.files.forEach(check);
  equal(manifest.protocol, design, 'exact design'); equal(manifest.decisionPlan, decision, 'screen gate');
  equal(manifest.pool, pool, 'exact original roster'); equal(manifest.variants, variants, 'exact arm mapping');
  equal(manifest.controlHashes, controlHashes, 'control hashes'); equal(manifest.componentHashes, componentHashes, 'component hashes');
  equal(manifest.sourceDesign, { manifest: record(sourceManifestPath), result: sourceDesign }, 'source design binding');
  equal(manifest.assembly, { manifest: record(assemblyPath), entries: assembly }, 'assembly binding');
  equal(manifest.validation, { expectedSha256: expectedValidationHash, artifact: record(validationPath), result: validation }, 'recurrence evidence binding');
  equal(manifest.randomness.excludedRanges, excludedRanges, 'complete transitive seed exclusion');
  equal(manifest.shuffledTeams, shuffledTeams(manifest.randomness.salt, pool), 'unbiased shuffle reconstruction');
  equal(manifest.cohorts, makeCohorts(manifest.shuffledTeams), '25 exact triples'); equal(manifest.zombies, zombies, 'four Zombies');
  equal(manifest.randomness.range, seedRange(manifest.randomness.seed, 20), 'fresh Java range');
  for (const old of excludedRanges) assert(!overlaps(manifest.randomness.range, old), 'seed range overlap');
  const expectedConfigs = makeConfigs(manifest.randomness, manifest.cohorts, zombies, engine, java);
  for (const item of expectedConfigs) equal(read(item.path), item.config, 'exact frozen arm config');
  const expectedCopies = [['m050-A', controlHashes[0]], ['m050-B', controlHashes[1]], ...componentIds.map((id, i) => [id, componentHashes[i]])];
  for (const [id, expected] of expectedCopies) equal(hashFile(path.join(screen, 'frozen', id)), expected, 'exact frozen contender');
  console.log(JSON.stringify({ status: 'INPUTS_VERIFIED', manifestSha256: hashFile(manifestPath), files: manifest.files.length, design })); process.exit(0);
}
fs.mkdirSync(screen); // Exclusive claim before the only randomness draw.
const randomness = { drawnAt: new Date().toISOString(), provenance: 'One crypto.randomBytes(32) salt and one crypto.randomBytes(12) seed suffix after complete input/recurrence preflight; no automatic redraw or outcome access.',
  algorithm: 'SHA256(salt || uint64be counter), rejection-sampled unbiased uint32 Fisher-Yates over the 75-name ASCII-sorted roster; one permutation, no repeated teams',
  salt: crypto.randomBytes(32).toString('hex'), seed: `coverage-dwell-screen-20261001-${crypto.randomBytes(12).toString('hex')}`, excludedRanges };
randomness.range = seedRange(randomness.seed, 20);
randomness.collisions = excludedRanges.filter(old => overlaps(randomness.range, old));
write(path.join(screen, 'randomness.json'), text(randomness));
assert(randomness.collisions.length === 0, 'Seed collision recorded; stop without redraw');
const shuffled = shuffledTeams(randomness.salt, pool), cohorts = makeCohorts(shuffled);
const frozen = path.join(screen, 'frozen'); fs.mkdirSync(frozen);
const copies = [['m050-A', controls[0]], ['m050-B', controls[1]], ...componentIds.map((id, i) => [id, candidates[i]])].map(([name, source]) => {
  const target = path.join(frozen, name); fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
  equal(hashFile(target), hashFile(source), 'frozen contender copy'); return record(target);
});
const configs = makeConfigs(randomness, cohorts, zombies, engine, java);
for (const item of configs) write(item.path, text(item.config));
files.forEach(check);
const manifest = { schemaVersion: 1, suite, frozenAt: new Date().toISOString(), protocol: design, decisionPlan: decision,
  randomness, pool, shuffledTeams: shuffled, cohorts, zombies, variants, componentHashes, controlHashes,
  worker: { bytes: 17, hex: workerHex, offsets: { A: 0xac, B: 0x64 }, unchanged: true },
  sourceDesign: { manifest: record(sourceManifestPath), result: sourceDesign },
  assembly: { manifest: record(assemblyPath), entries: assembly }, validation: { expectedSha256: expectedValidationHash, artifact: record(validationPath), result: validation },
  engine, java, runner, researchRuntime: previous.researchRuntime,
  configs: configs.map(item => ({ arm: item.arm, ...record(item.path), battles: 500 })),
  files: [...files, ...copies, record(path.join(screen, 'randomness.json')), ...configs.map(item => record(item.path))] };
const serialized = text(manifest); write(manifestPath, serialized); write(`${manifestPath}.sha256`, `${sha(serialized)}\n`);
console.log(JSON.stringify({ status: 'FROZEN_NO_BATTLES_LAUNCHED', manifest: manifestPath, manifestSha256: sha(serialized),
  seedRange: randomness.range, configs: configs.map(item => item.path), design }));
