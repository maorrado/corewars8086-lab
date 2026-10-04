// Authoring/freeze only: no subprocesses, benchmarks, outcome reads or redraws.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assert, equal, sha, hashFile, read, text, record, check, seedRange, overlaps } from '../bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../../..');
const screen = path.join(here, 'screen'), manifestPath = path.join(screen, 'manifest.json');
const suite = 'codex-goal-20261001-word-trigger-screen', arms = ['m050', 'a_only', 'b_only', 'both'];
const mode = process.argv[2], write = (file, value) => fs.writeFileSync(file, value, { flag: 'wx' });
assert(process.argv.length === 3 && ['--preflight', '--freeze', '--verify'].includes(mode), 'usage: node generate-screen.mjs --preflight|--freeze|--verify');
const candidateHashes = ['82616615d827119202b995649f4b11a59c3f7766ae2c9e762ab2b7ff833b1526', '9f0326daa7c0bc2028788a1d5730072ed99032e2e0bad285a779bc47a9c3b778'];
const controlHashes = ['0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44', '06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782'];
const sourceHashes = ['59fb9fd665fc29209997741c7cc494debec167a7494a735350e1a700162c5065', '088f2f10118c314d25daa6b5cf47a845194a444c90b57fde0718dcc9a08f5d13'];
const workerHex = 'f3a529d4292f8b3fb10731f6ab4fff1f';
const design = { arms, candidateName: 'COD_pair', published2025Teams: 75, seniorTeams: 62, youthTeams: 13,
  cohorts: 25, opponentSlots: 75, repeats: 0, seeds: 1, battlesPerBlock: 20, battlesPerArm: 500,
  totalBattles: 2000, threads: 1, parallel: false, telemetry: false };
const decision = { metric: 'team points per battle, not win percentage', reference: 'm050', candidates: arms.slice(1),
  primary: 'equal-weight mean of the 25 matched cohort deltas, candidate minus fresh exact m050',
  gate: 'Advance each candidate only if its complete paired mean delta is strictly positive; no partial-arm selection, adaptive extension or old-result pooling.',
  interval: 'Descriptive 95% cohort t interval, df=24, critical 2.0638985616280205; not a significance gate and not 500 independent trials.',
  boundary: 'Every selected candidate needs a fresh matched holdout against BOTH exact m049 and m050. No screen champion, final replacement, unseen-population or universal claim.' };

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
if (mode === '--verify') {
  equal(hashFile(manifestPath), fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim(), 'manifest checksum');
  const manifest = read(manifestPath); manifest.files.forEach(check);
  equal(manifest.protocol, design, 'exact design'); equal(manifest.decisionPlan, decision, 'screen gate');
  equal(manifest.shuffledTeams, shuffledTeams(manifest.randomness.salt, manifest.pool), 'unbiased shuffle reconstruction');
  equal(manifest.randomness.range, seedRange(manifest.randomness.seed, 20), 'fresh Java range');
  for (const old of manifest.randomness.excludedRanges) assert(!overlaps(manifest.randomness.range, old), 'seed range overlap');
  console.log(JSON.stringify({ status: 'INPUTS_VERIFIED', manifestSha256: hashFile(manifestPath), files: manifest.files.length, design }));
  process.exit(0);
}
assert(!fs.existsSync(screen), 'Refusing an existing screen, including an interrupted prior entropy draw');
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
const shiftFile = path.resolve(here, '../shift-quantizer/screen/manifest.json');
equal(add(shiftFile).sha256, '6550f6a7480d5eccd6eac9598244d613c556c0cec6699f2149e85ac3efb134cc', 'latest frozen shift screen');
const shift = read(shiftFile);
// The shift freeze transitively records the bootstrap holdout, imp, camper,
// bootstrap screen, LEA confirmation and earlier audit seed ranges.
const excludedRanges = [...new Map([...shift.randomness.excludedRanges, ...shift.protocol.seedRanges].map(r => [JSON.stringify(r), r])).values()];
for (const range of excludedRanges) equal(range, seedRange(range.seed, range.lastWarSeed - range.firstWarSeed + 1), 'known Java seed range');
const holdoutFile = path.resolve(here, '../bootstrap-holdout/frozen/manifest.json');
equal(add(holdoutFile).sha256, '199c261970f36c1850100875fb20cac14935cd81a749fa55e081463bdecc253a', 'bootstrap holdout seed provenance');
for (const range of read(holdoutFile).randomness.seedRanges) assert(excludedRanges.some(old => JSON.stringify(old) === JSON.stringify(range)), 'missing bootstrap holdout range');
const engine = add(path.resolve(root, audit.engine.path)), java = add(path.resolve(root, audit.java.path)), runner = add(path.resolve(root, audit.runner.path));
equal(engine.sha256, audit.engine.sha256, 'original engine'); equal(java.sha256, audit.java.sha256, 'Java runtime'); equal(runner.sha256, audit.runner.sha256, 'original runner');
for (const item of [...shift.researchRuntime.sources, ...shift.researchRuntime.classes]) { check(item); add(item.path); }
const helper = path.resolve(here, '../bootstrap-holdout/protocol.mjs');
const helperRecord = read(holdoutFile).files.find(item => item.path === helper); assert(helperRecord, 'missing frozen helper provenance'); check(helperRecord); add(helper);
const assemblyPath = path.join(here, 'build/manifest.json'), assembly = read(assemblyPath); add(assemblyPath);
assert(Array.isArray(assembly) && assembly.length === 2, 'need exact two-file assembly manifest');
const candidates = ['A', 'B'].map((side, i) => {
  const source = path.join(here, `Word${side}.asm`), binary = path.join(here, `build/Word${side}`), item = assembly[i];
  equal(path.resolve(item.input), source, 'assembly source path'); equal(path.resolve(item.output), binary, 'assembly binary path');
  equal(add(source).sha256, sourceHashes[i], 'reviewed source hash'); equal(item.sourceSha256, sourceHashes[i], 'assembly source identity');
  equal(add(binary).sha256, candidateHashes[i], 'reviewed binary hash'); equal(item.binarySha256, candidateHashes[i], 'assembly binary identity');
  const bytes = fs.readFileSync(binary), size = i === 0 ? 189 : 117, worker = i === 0 ? 0xad : 0x65;
  equal(bytes.length, size, 'preserved image length'); equal(item.size, size, 'assembly size');
  equal(bytes.subarray(worker).toString('hex'), workerHex, 'exact private 16-byte worker, no trailing bytes');
  for (const offset of (i === 0 ? [0x69, 0x7b] : [0x33])) equal(bytes.subarray(offset, offset + 3).toString('hex'), 'b90800', 'private eight-word template copy');
  const initial = i === 0 ? 0x9d : 0x55;
  equal(bytes.subarray(initial, initial + 3).toString('hex'), 'b90700', 'initial seven-word recurrence count');
  return binary;
});
const validationPath = path.join(here, 'validation/result.json');
assert(fs.existsSync(validationPath), 'Required original-engine recurrence validation/result.json is absent');
const validation = read(validationPath); add(validationPath);
equal(hashFile(validationPath), 'a5d5f58d03a23aae8a2fd9298c3f590b50917d0ea51243aa20cd686ac60a9aba', 'reviewed recurrence evidence artifact');
// Parent-created evidence must attest the precise reviewed pair, not merely
// exist. These fields are part of this screen's preregistered evidence gate.
equal(validation.status, 'PASS', 'recurrence validation status');
equal(['wordA', 'wordB'].map(key => validation.binaryIdentities[key].sha256), candidateHashes, 'validated word-trigger binaries');
equal(['m050A', 'm050B'].map(key => validation.binaryIdentities[key].sha256), controlHashes, 'validated m050 binaries');
equal([validation.offsets, validation.paths, validation.healthyPairedPaths, validation.baselineUnhealthyPaths,
  validation.newUnhealthyPaths, validation.steadyOpcodesSaved], [119, 357, 349, 8, 0, 3], 'reviewed recurrence coverage and no-new-failure gate');
for (const item of validation.files) { check(item); add(item.path); }
equal(validation.files.find(item => item.path === engine.path)?.sha256, engine.sha256, 'validation original engine');
assert(validation.commands.length === 2 && validation.commands.every(command => command.exitCode === 0 && !command.error && !command.stderr), 'recurrence build/run completion');
equal(validation.commands[1].executable, java.path, 'recurrence Java');
equal(validation.commands[1].args, ['-cp', [path.join(here, 'validation/verified-classes'), engine.path].join(path.delimiter),
  'WorkerRecurrenceFixture', ...['m050A', 'm050B', 'wordA', 'wordB'].map(key => validation.binaryIdentities[key].path)], 'original-only recurrence command');
assert(validation.commands[1].stdout.includes(validation.summary), 'missing recurrence completion summary');
for (const file of ['generate-screen.mjs', 'README.md', 'SCREEN-PROTOCOL.md', 'validation/WorkerRecurrenceFixture.java']) add(path.join(here, file));
const files = [...sources.values()]; files.forEach(check);
if (mode === '--preflight') {
  console.log(JSON.stringify({ status: 'PREFLIGHT_ONLY', entropyDrawn: false, design, excludedRanges: excludedRanges.length, validation: record(validationPath) })); process.exit(0);
}
fs.mkdirSync(screen); // Exclusive claim before the only randomness draw.
const randomness = { drawnAt: new Date().toISOString(), provenance: 'One crypto.randomBytes(32) salt and one crypto.randomBytes(12) seed suffix after complete input/recurrence preflight; no automatic redraw or outcome access.',
  algorithm: 'SHA256(salt || uint64be counter), rejection-sampled unbiased uint32 Fisher-Yates over the 75-name ASCII-sorted roster; one permutation, no repeated teams',
  salt: crypto.randomBytes(32).toString('hex'), seed: `word-trigger-screen-20261001-${crypto.randomBytes(12).toString('hex')}`, excludedRanges };
randomness.range = seedRange(randomness.seed, 20);
randomness.collisions = excludedRanges.filter(old => overlaps(randomness.range, old));
write(path.join(screen, 'randomness.json'), text(randomness));
assert(randomness.collisions.length === 0, 'Seed collision recorded; stop without redraw');
const shuffled = shuffledTeams(randomness.salt, pool);
const cohorts = Array.from({ length: 25 }, (_, i) => ({ id: `word-full75-${String(i + 1).padStart(2, '0')}`, opponents: shuffled.slice(i * 3, i * 3 + 3) }));
const frozen = path.join(screen, 'frozen'); fs.mkdirSync(frozen);
const copies = [['m050-A', controls[0]], ['m050-B', controls[1]], ['word-A', candidates[0]], ['word-B', candidates[1]]].map(([name, source]) => {
  const target = path.join(frozen, name); fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
  equal(hashFile(target), hashFile(source), 'frozen contender copy'); return record(target);
});
const variants = { m050: ['m050-A', 'm050-B'], a_only: ['word-A', 'm050-B'], b_only: ['m050-A', 'word-B'], both: ['word-A', 'word-B'] };
const configs = arms.map(arm => ({ arm, path: path.join(screen, `${arm}.json`), config: {
  experimentId: `${suite}-${arm}`, java: java.path, jar: engine.path,
  outputPath: path.join(screen, 'results', `${arm}.json`), runDirectory: path.join(screen, 'runs', arm),
  candidate: { name: 'COD_pair', warriors: variants[arm].map(file => path.join(frozen, file)) },
  battles: 20, threads: 1, parallel: false, telemetry: false, seeds: [randomness.seed], cohorts, zombies,
} }));
for (const item of configs) write(item.path, text(item.config));
files.forEach(check);
const manifest = { schemaVersion: 1, suite, frozenAt: new Date().toISOString(), protocol: design, decisionPlan: decision,
  randomness, pool, shuffledTeams: shuffled, cohorts, zombies, variants, candidateHashes, controlHashes,
  worker: { bytes: 16, hex: workerHex, offsets: { A: 0xad, B: 0x65 }, privateCopyWords: 8, recurrenceCopyWords: 7 },
  assembly: { manifest: record(assemblyPath), entries: assembly }, validation: { artifact: record(validationPath), result: validation },
  engine, java, runner, researchRuntime: shift.researchRuntime,
  configs: configs.map(item => ({ arm: item.arm, ...record(item.path), battles: 500 })),
  files: [...files, ...copies, record(path.join(screen, 'randomness.json')), ...configs.map(item => record(item.path))] };
const serialized = text(manifest); write(manifestPath, serialized); write(`${manifestPath}.sha256`, `${sha(serialized)}\n`);
console.log(JSON.stringify({ status: 'FROZEN_NO_BATTLES_LAUNCHED', manifest: manifestPath, manifestSha256: sha(serialized),
  seedRange: randomness.range, configs: configs.map(item => item.path), design }));
