// Authoring only until explicitly invoked after assembly/review. Never launches a process.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const suite = 'codex-goal-20261001-stosb-imp-screen';
const screen = path.join(here, 'screen');
const manifestPath = path.join(screen, 'manifest.json');
const assert = (ok, why) => { if (!ok) throw Error(why); };
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const hashFile = file => hash(fs.readFileSync(file));
const json = value => JSON.stringify(value, null, 2) + '\n';
const absolute = file => path.resolve(root, file);
const relative = file => path.relative(root, file).split(path.sep).join('/');
const record = file => ({ path: relative(file), bytes: fs.statSync(file).size, sha256: hashFile(file) });
const writeNew = (file, value) => fs.writeFileSync(file, value, { flag: 'wx' });
const checkRecord = entry => assert(fs.statSync(absolute(entry.path)).size === entry.bytes && hashFile(absolute(entry.path)) === entry.sha256, `Frozen input changed: ${entry.path}`);
const javaHash = seed => { let h = 0; for (let i = 0; i < seed.length; i++) h = (Math.imul(h, 31) + seed.charCodeAt(i)) | 0; return h; };
const range = (seed, battles) => ({ seed, firstWarSeed: javaHash(seed), lastWarSeed: javaHash(seed) + battles - 1 });

assert(process.argv.length <= 3 && (!process.argv[2] || process.argv[2] === '--verify'), 'usage: node generate-screen.mjs [--verify]');
if (process.argv[2] === '--verify') {
  assert(hashFile(manifestPath) === fs.readFileSync(manifestPath + '.sha256', 'utf8').trim(), 'Manifest checksum mismatch');
  const manifest = read(manifestPath);
  manifest.files.forEach(checkRecord);
  assert(manifest.protocol.battlesPerArm === 500 && manifest.configs.length === 2, 'Unexpected frozen design');
  console.log(`PASS: ${manifest.files.length} frozen inputs/configs verified; no outcomes read or processes launched`);
  process.exit(0);
}
assert(!fs.existsSync(screen), 'Screen directory already exists: never redraw or overwrite an attempted freeze');

const lea = path.resolve(here, '../lea-confirmation');
const references = {
  panel: [path.join(lea, 'panel-2-m050.json'), '87fd2a6f76bcdf5a2be4f136429a555fc7dc806cc172046f249b64604ed636cf'],
  leaManifest: [path.join(lea, 'manifest.json'), 'e58f45cea58b81de33062edaa8e6275a378ee2433d7afa1d98fd08ef93eec17c'],
  bootstrap: [path.resolve(here, '../bootstrap-designs/screen/protocol.json'), 'f3dd4cd0b84fc9561694b8b2b6972ee1518b9a871a329a0b971b4953f0252cdf'],
  bootstrapManifest: [path.resolve(here, '../bootstrap-designs/screen/input-manifest.json'), 'bee1ba3e32b1887af464bd554e4cf23225dbac8765fd94b9381bfa96c601996d'],
  camperManifest: [path.resolve(here, '../conditional-camper-screen/manifest.json'), 'e4cf9d05a76e6dbb0e27b7d3d920ea2474d094321d257deef5c626c2e56d29bd'],
  source: [path.join(here, 'B-STOSB-imp.asm'), '8b34f1cc8be43e527f52fb5096bc1e9e8345784ec48b19767d0498966d1a40f8'],
  runner: [absolute('official-benchmark.mjs'), '6618a0d865be0b87389056e09a972fcef88f43d4d2e9f2a9f48bfc8a7ba2d786'],
  engine: [absolute('repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar'), '31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d'],
  java: [absolute('tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe'), '46df95bb47e2ba2b10736cee2ab543289c66021611f1ec67d0d55d5128228c20'],
  m050A: [path.join(lea, 'build/m050/A'), '0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44'],
  m050B: [path.join(lea, 'build/m050/B'), '06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782'],
};
for (const [name, [file, expected]] of Object.entries(references)) assert(hashFile(file) === expected, `Reference drift: ${name}`);
const assemblyPath = path.join(here, 'build/manifest.json');
const imp = path.join(here, 'build/B-STOSB-imp');
const assembly = read(assemblyPath);
assert(Array.isArray(assembly) && assembly.length === 1, 'Need the one-source assembly manifest');
const built = assembly[0];
assert(path.resolve(built.input) === references.source[0] && path.resolve(built.output) === imp, 'Wrong assembly source/output mapping');
assert(built.sourceSha256 === references.source[1] && built.binarySha256 === hashFile(imp), 'Assembly hash proof failed');
const impBytes = fs.readFileSync(imp), controlB = fs.readFileSync(references.m050B[0]);
assert(built.size === impBytes.length && impBytes.length === 31 && impBytes.length <= 256, 'Unexpected imp size');
assert(impBytes.subarray(0, 20).equals(controlB.subarray(0, 20)), 'Opener differs from exact m050 B');
assert(impBytes.subarray(20).toString('hex') === '8d9c000289dfb0aaaaffe3', 'Unexpected five-instruction launcher bytes');

const base = read(references.panel[0]);
const prior = read(references.leaManifest[0]);
const bootstrap = read(references.bootstrap[0]);
const camper = read(references.camperManifest[0]);
const cohorts = base.cohorts.map(cohort => ({ id: cohort.id, opponents: cohort.opponents.map(team => ({
  name: team.name, warriors: team.warriors.map(file => path.resolve(lea, file)),
})) }));
const zombies = base.zombies.map(zombie => ({ name: zombie.name, path: path.resolve(lea, zombie.path) }));
assert(cohorts.length === 25 && new Set(cohorts.map(c => c.id)).size === 25, 'Need exactly 25 fixed panel-2 cohorts');
assert(cohorts.every(c => c.opponents.length === 3 && new Set(c.opponents.map(t => t.name)).size === 3), 'Each cohort needs three distinct opponents');
const teams = cohorts.flatMap(c => c.opponents);
assert(teams.length === 75 && teams.every(t => t.name.startsWith('A_') && t.warriors.length === 2), 'Need 75 senior team slots');
const exposure = Object.fromEntries([...new Set(teams.map(t => t.name))].sort().map(name => [name, teams.filter(t => t.name === name).length]));
assert(Object.keys(exposure).length === 62 && Object.values(exposure).filter(n => n === 2).length === 13 && Object.values(exposure).every(n => n === 1 || n === 2), 'Panel-2 exposure changed');
assert(zombies.length === 4 && new Set(zombies.map(z => z.name)).size === 4, 'Need four frozen Zombies');
const previousInputs = new Map(prior.inputs.map(entry => [path.resolve(root, entry.path), entry]));
for (const file of [...teams.flatMap(t => t.warriors), ...zombies.map(z => z.path)]) {
  assert(previousInputs.has(file), `Input not in frozen confirmation: ${file}`);
  checkRecord(previousInputs.get(file));
}
const ranges = [...prior.engineSeedRanges, ...prior.excludedPriorEngineSeedRanges,
  bootstrap.randomness.range, ...bootstrap.randomness.excludedRanges,
  ...camper.protocol.seedRanges.map(r => ({ seed: r.seed, firstWarSeed: r.first, lastWarSeed: r.last }))];
const excluded = [...new Map(ranges.map(r => [JSON.stringify(r), r])).values()];
for (const r of excluded) assert(Number.isSafeInteger(r.firstWarSeed) && Number.isSafeInteger(r.lastWarSeed)
  && r.firstWarSeed === javaHash(r.seed) && r.lastWarSeed >= r.firstWarSeed, 'Invalid prior engine seed range');
const externalFiles = [...new Set([...Object.values(references).map(([file]) => file), assemblyPath, imp,
  ...teams.flatMap(t => t.warriors), ...zombies.map(z => z.path),
  path.join(here, 'generate-screen.mjs'), path.join(here, 'README.txt'), absolute('assemble.mjs')])];
const externalRecords = externalFiles.map(record); // Complete preflight before the single entropy draw.

fs.mkdirSync(screen); // Exclusive directory claim; any interrupted/failed attempt remains visible.
const seed = `stosb-imp-screen-20261001-${crypto.randomBytes(12).toString('hex')}`;
const proposed = range(seed, 20);
const collisions = excluded.filter(r => proposed.firstWarSeed <= r.lastWarSeed && r.firstWarSeed <= proposed.lastWarSeed);
const randomness = { provenance: 'One crypto.randomBytes(12) call after successful assembly/input preflight; no automatic redraw, no outcome access.',
  draws: 1, seed, range: proposed, excludedRanges: excluded, collisions };
writeNew(path.join(screen, 'randomness.json'), json(randomness));
assert(collisions.length === 0, 'Seed-range collision recorded; stop for manual decision, do not redraw');
const frozen = path.join(screen, 'frozen'); fs.mkdirSync(frozen);
const copies = [['m050-A', references.m050A[0]], ['m050-B', references.m050B[0]], ['imp-B', imp]];
for (const [name, source] of copies) {
  const target = path.join(frozen, name);
  fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
  assert(hashFile(target) === hashFile(source), 'Frozen copy mismatch');
}
const configs = ['control', 'imp'].map(arm => ({ arm, path: path.join(screen, `${arm}.json`), config: {
  experimentId: `${suite}-${arm}`, java: references.java[0], jar: references.engine[0],
  outputPath: path.join(screen, 'results', `${arm}.json`), runDirectory: path.join(screen, 'runs', arm),
  candidate: { name: 'COD_pair', warriors: [path.join(frozen, 'm050-A'), path.join(frozen, arm === 'control' ? 'm050-B' : 'imp-B')] },
  battles: 20, threads: 1, parallel: false, telemetry: false, seeds: [seed], cohorts, zombies,
} }));
for (const c of configs) {
  assert(c.config.battles * c.config.seeds.length * c.config.cohorts.length === 500, 'Wrong arm battle count');
  writeNew(c.path, json(c.config));
}
externalRecords.forEach(checkRecord);
const manifest = {
  schemaVersion: 1, experimentId: suite, frozenAt: new Date().toISOString(),
  hypothesis: 'Exact m050 A plus one-byte STOSB imp B; same m050 B opener, then an immediately advancing write/execute frontier instead of Phoenix.',
  protocol: { arms: ['control', 'imp'], candidateName: 'COD_pair', panel: 2, cohortCount: 25, seniorTeamSlots: 75,
    uniqueSeniorTeams: 62, exposureCounts: exposure, seeds: [seed], seedRanges: [proposed], battlesPerCohort: 20,
    battlesPerArm: 500, totalBattles: 1000, threads: 1, parallel: false, telemetry: false, execution: 'Run arms sequentially; never concurrent Java jobs for this screen.' },
  decisionPlan: { metric: 'surviving-warrior points per battle, not win rate', requiredRunsPerArm: 25, requiredBattlesPerArm: 500,
    comparison: 'Imp minus matched exact m050; require both full arms, identical names/cohorts/seeds/input hashes, no missing/duplicate blocks.',
    screenGate: 'Positive paired mean above 1e-8 is only a screen lead, not superiority. Report all 25 paired cohort deltas and a descriptive df=24 t interval.',
    limits: 'Same existing 2025 senior population, 13 repeated teams; cohort sensitivity is not 500 independent Bernoulli trials. No m049 comparison, final promotion, unseen-population claim or pooling with older results. Fresh independent validation against both controls is required.' },
  rosterProvenance: 'Frozen confirmation panel 2 selected before this candidate has any result; no outcomes read by this generator. Different roster grouping from bootstrap panel 1.',
  assembly: { manifest: record(assemblyPath), source: record(references.source[0]), binary: record(imp), entry: built },
  randomness,
  configs: configs.map(c => ({ arm: c.arm, ...record(c.path), battles: 500 })),
  files: [...externalRecords, ...copies.map(([name]) => record(path.join(frozen, name))),
    record(path.join(screen, 'randomness.json')), ...configs.map(c => record(c.path))],
};
const serialized = json(manifest); writeNew(manifestPath, serialized); writeNew(manifestPath + '.sha256', hash(serialized) + '\n');
console.log(JSON.stringify({ status: 'Frozen; no battles launched', manifest: manifestPath, seedRange: proposed,
  candidateHash: built.binarySha256, configs: configs.map(c => c.path), battlesPerArm: 500 }, null, 2));
