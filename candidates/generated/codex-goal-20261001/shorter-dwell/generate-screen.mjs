// Authoring/freeze only: no subprocesses, battle outcomes, or automatic redraws.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assert, equal, sha, hashFile, read, text, record, check, seedRange, overlaps } from '../bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../../..');
const screen = path.join(here, 'screen'), manifestPath = path.join(screen, 'manifest.json');
const suite = 'codex-goal-20261001-shorter-dwell-screen';
const arms = ['m050', 'both-trail512', 'b-trail512', 'both-trail256', 'b-trail256'];
const mode = process.argv[2], write = (file, value) => fs.writeFileSync(file, value, { flag: 'wx' });
assert(process.argv.length === 3 && ['--preflight', '--freeze', '--verify'].includes(mode), 'usage: node generate-screen.mjs --preflight|--freeze|--verify');
const controlHashes = ['0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44', '06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782'];
const componentIds = ['A-trail512', 'B-trail512', 'A-trail256', 'B-trail256'];
const componentHashes = ['f5d20bb160052bbc2247b91c3737fe51f4bdd81d557396837faf319cc90e4e40', 'ed236d60c51ca5ff19f482967b47f77bd8583180f34fd6595f4cbcce69555b31', 'b39583ee5bbc9204d8871cecffa6b0b45d3b35989c0c86853d6a43ef13ce390b', 'c4d961cfb18fd21fb71c7df36298e19a37faf379d38654ac36f76e1307fce214'];
const workerHex = 'a5f3a529d4292f8b3fb10931f6ab4fff1f';
const variants = { m050: ['m050-A', 'm050-B'],
  'both-trail512': ['A-trail512', 'B-trail512'], 'b-trail512': ['m050-A', 'B-trail512'],
  'both-trail256': ['A-trail256', 'B-trail256'], 'b-trail256': ['m050-A', 'B-trail256'] };
const design = { arms, candidateName: 'COD_pair', published2025Teams: 75, seniorTeams: 62, youthTeams: 13,
  cohorts: 25, opponentSlots: 75, repeats: 0, seeds: 1, battlesPerBlock: 20, battlesPerArm: 500,
  totalBattles: 2500, threads: 1, parallel: false, telemetry: false };
const decision = { metric: 'team points per battle, not win percentage', reference: 'm050', candidates: arms.slice(1),
  primary: 'equal-weight mean of the 25 matched cohort deltas, candidate minus fresh exact m050',
  gate: 'After all five arms complete, advance each candidate only if its complete paired mean delta is strictly positive. No partial-arm selection, adaptive stopping or extension, outcome-driven redraw, or old-result pooling.',
  interval: 'Descriptive two-sided 95% cohort t interval, df=24, critical 2.0638985616280205; not a significance gate and not 500 independent trials.',
  boundary: 'Selection among four candidates is exploratory. Every selected candidate needs a fresh matched holdout against BOTH exact m049 and m050. No screen champion, final replacement, unseen-population or universal claim.' };

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
  return Array.from({ length: 25 }, (_, i) => ({ id: `shorter-dwell-full75-${String(i + 1).padStart(2, '0')}`, opponents: shuffled.slice(i * 3, i * 3 + 3) }));
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

// Read prior input manifests only, never their battle outcomes. Word-trigger
// includes shift, bootstrap holdout, imp, camper, LEA, and earlier audit ranges.
const wordFile = path.resolve(here, '../word-trigger/screen/manifest.json');
equal(add(wordFile).sha256, '4a90ea45736ddaa8ba5dd93b64b36305ae68c3a4f281d520f0d5a3b12b93a959', 'latest frozen word-trigger screen');
const word = read(wordFile);
const excludedRanges = [...new Map([...word.randomness.excludedRanges, word.randomness.range].map(r => [JSON.stringify(r), r])).values()];
for (const range of excludedRanges) equal(range, seedRange(range.seed, range.lastWarSeed - range.firstWarSeed + 1), 'known Java seed range');
assert(excludedRanges.some(r => JSON.stringify(r) === JSON.stringify(word.randomness.range)), 'missing word-trigger seed range');
const engine = add(path.resolve(root, audit.engine.path)), java = add(path.resolve(root, audit.java.path)), runner = add(path.resolve(root, audit.runner.path));
equal(engine.sha256, audit.engine.sha256, 'original engine'); equal(java.sha256, audit.java.sha256, 'Java runtime'); equal(runner.sha256, audit.runner.sha256, 'original runner');
equal(engine, word.engine, 'same original engine'); equal(java, word.java, 'same Java'); equal(runner, word.runner, 'same original runner');
for (const item of [...word.researchRuntime.sources, ...word.researchRuntime.classes]) { check(item); add(item.path); }
const helper = path.resolve(here, '../bootstrap-holdout/protocol.mjs');
const helperRecord = word.files.find(item => item.path === helper); assert(helperRecord, 'missing frozen helper provenance'); check(helperRecord); add(helper);

const sourceManifestPath = path.join(here, 'manifest.json');
equal(add(sourceManifestPath).sha256, '6dbb2f2d83fe34559d22c97874f7e36a7b0e9b693441c67dc348255eca11c276', 'reviewed source design manifest');
const sourceDesign = read(sourceManifestPath);
equal(add(path.resolve(root, sourceDesign.generator)).sha256, sourceDesign.generatorSha256, 'reviewed source generator');
equal(Object.keys(sourceDesign.components), componentIds, 'exact four source components');
equal(sourceDesign.arms, arms.slice(1).map(id => ({ id, A: variants[id][0] === 'm050-A' ? 'baseline.A' : variants[id][0], B: variants[id][1] })), 'four reviewed pairings');
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
  const bytes = fs.readFileSync(binary), highOffset = side === 'A' ? 0xa1 : 0x59;
  equal(bytes.length, original.length, 'preserved image length'); equal(entry.size, original.length, 'assembly size');
  const changed = [...original.keys()].filter(i => original[i] !== bytes[i]);
  equal(changed, [highOffset], 'only the DX immediate high byte changes');
  equal(definition.binaryChangedByte, highOffset, 'source design byte offset');
  equal(bytes[highOffset], definition.dx >>> 8, 'planned DX high byte');
  equal(bytes.subarray(highOffset - 2, highOffset).toString('hex'), 'ba00', 'MOV DX low immediate unchanged');
  const predicted = Buffer.from(original); predicted[highOffset] = definition.dx >>> 8;
  assert(bytes.equals(predicted), 'assembly differs from exact one-byte prediction');
  equal(bytes.subarray(side === 'A' ? 0xac : 0x64).toString('hex'), workerHex, 'unchanged private 17-byte worker');
  return binary;
});

// Root-reviewed original-engine semantic evidence, not a battle score gate.
const validationPath = path.join(here, 'validation/result.json');
equal(add(validationPath).sha256, '22f8d7341e57c38ea1ba282506a806635ec531f804fa322ce7a0ac3f9cf8a04b', 'reviewed shorter-dwell recurrence evidence');
const validation = read(validationPath);
equal(validation.status, 'PASS', 'recurrence validation status');
equal([validation.offsets, validation.pairedPaths, validation.healthyPaths, validation.baselineUnhealthyPaths, validation.newFailures],
  [119, 714, 698, 16, 0], 'reviewed recurrence coverage and no-new-failure gate');
equal(validation.summary, 'Dwell PASS offsets=119 paired=714 healthy=698 baselineUnhealthy=16 newFailures=0', 'recurrence completion summary');
const validatedBinaries = [...['A', 'B'].map(side => path.resolve(root, sourceDesign.baseline[side].binary)), ...candidates];
equal(validation.binaries, validatedBinaries.map(record), 'all six exact validated binaries');
equal(validation.binaries.map(item => item.sha256), [...controlHashes, ...componentHashes], 'validated identities');
for (const item of validation.files) { check(item); add(item.path); }
equal(validation.files.find(item => item.path === engine.path), engine, 'validation original engine');
assert(validation.commands.length === 2 && validation.commands.every(command => command.exitCode === 0 && !command.error && !command.stderr), 'recurrence build/run completion');
equal(validation.commands[1].executable, java.path, 'recurrence Java');
equal(validation.commands[1].args, ['-cp', [path.join(here, 'validation/classes'),
  path.resolve(here, '../word-trigger/validation/verified-classes'), engine.path].join(path.delimiter),
  'DwellFixture', ...validatedBinaries], 'original-only recurrence command');
equal(validation.commands[1].stdout.trim(), validation.summary, 'observed recurrence completion');

for (const file of ['generate-screen.mjs', 'README.md', 'SCREEN-PROTOCOL.md']) add(path.join(here, file));
const files = [...sources.values()]; files.forEach(check);
if (mode === '--preflight') {
  console.log(JSON.stringify({ status: 'PREFLIGHT_ONLY', entropyDrawn: false, design, excludedRanges: excludedRanges.length, validation: record(validationPath) })); process.exit(0);
}
if (mode === '--verify') {
  equal(hashFile(manifestPath), fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim(), 'manifest checksum');
  const manifest = read(manifestPath); manifest.files.forEach(check);
  equal(manifest.protocol, design, 'exact design'); equal(manifest.decisionPlan, decision, 'screen gate');
  equal(manifest.pool, pool, 'exact original roster'); equal(manifest.variants, variants, 'exact arm mapping');
  equal(manifest.controlHashes, controlHashes, 'control hashes'); equal(manifest.componentHashes, componentHashes, 'component hashes');
  equal(manifest.sourceDesign, { manifest: record(sourceManifestPath), result: sourceDesign }, 'source design binding');
  equal(manifest.assembly, { manifest: record(assemblyPath), entries: assembly }, 'assembly binding');
  equal(manifest.validation, { artifact: record(validationPath), result: validation }, 'recurrence evidence binding');
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
  salt: crypto.randomBytes(32).toString('hex'), seed: `shorter-dwell-screen-20261001-${crypto.randomBytes(12).toString('hex')}`, excludedRanges };
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
  assembly: { manifest: record(assemblyPath), entries: assembly }, validation: { artifact: record(validationPath), result: validation },
  engine, java, runner, researchRuntime: word.researchRuntime,
  configs: configs.map(item => ({ arm: item.arm, ...record(item.path), battles: 500 })),
  files: [...files, ...copies, record(path.join(screen, 'randomness.json')), ...configs.map(item => record(item.path))] };
const serialized = text(manifest); write(manifestPath, serialized); write(`${manifestPath}.sha256`, `${sha(serialized)}\n`);
console.log(JSON.stringify({ status: 'FROZEN_NO_BATTLES_LAUNCHED', manifest: manifestPath, manifestSha256: sha(serialized),
  seedRange: randomness.range, configs: configs.map(item => item.path), design }));
