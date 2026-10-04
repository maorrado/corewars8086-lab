import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const id = 'codex-goal-20261001-conditional-camper-screen';
const build = path.join(root, 'build/codex-goal-20261001/conditional-camper-screen');
const outputs = path.join(root, 'experiments/codex-goal-20261001/conditional-camper-screen');
const runs = path.join(root, 'build/official-runs/codex-goal-20261001/conditional-camper-screen');
const assert = (ok, message) => { if (!ok) throw Error(message); };
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const text = value => `${JSON.stringify(value, null, 2)}\n`;
const record = file => ({ path: file, bytes: fs.statSync(file).size, sha256: hash(file) });
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
assert(process.argv.length === 2, 'usage: node generate.mjs; assembles nothing and runs no battles');
const references = {
  base: [path.join(root, 'config-final-2025-m049-once.json'), '5fec9af2cd632d5c5dcbc095304168e5fe1c15e97d7893db8a5820ae3c1d481d'],
  runner: [path.join(root, 'official-benchmark.mjs'), '6618a0d865be0b87389056e09a972fcef88f43d4d2e9f2a9f48bfc8a7ba2d786'],
  engine: [path.join(root, 'repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar'), '31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d'],
  java: [path.join(root, 'tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe'), '46df95bb47e2ba2b10736cee2ab543289c66021611f1ec67d0d55d5128228c20'],
  m050A: [path.join(root, 'build/m050-repro/ab_pad_a'), '0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44'],
  m050B: [path.join(root, 'build/m050-repro/ab_pad_b'), '06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782'],
};
for (const [name, [file, expected]] of Object.entries(references)) assert(hash(file) === expected, `changed ${name}`);
const source = path.join(root, 'candidates/generated/codex-goal-20260930/resilient-topology/B-conditional-camper.asm');
const camper = path.join(build, 'assembled/B-conditional-camper');
const assemblyManifest = path.join(build, 'assembled/manifest.json');
const assembly = read(assemblyManifest);
assert(assembly.length === 1 && path.resolve(assembly[0].input) === source && path.resolve(assembly[0].output) === camper, 'wrong assembly mapping');
assert(assembly[0].sourceSha256 === hash(source) && assembly[0].binarySha256 === hash(camper), 'assembly hashes differ');
assert(assembly[0].size === fs.statSync(camper).size && assembly[0].size > 0 && assembly[0].size <= 256, 'invalid assembled length');
const seeds = ['camper-screen-20261001-1-90b393c7fab785781498044b', 'camper-screen-20261001-2-5e0f57d505889ace61f3bd43'];
const javaHash = seed => { let h = 0; for (let i = 0; i < seed.length; i++) h = (Math.imul(h, 31) + seed.charCodeAt(i)) | 0; return h; };
const seedRanges = seeds.map(seed => ({ seed, first: javaHash(seed), last: javaHash(seed) + 24 }));
assert(Math.abs(seedRanges[0].first - seedRanges[1].first) >= 25, 'overlapping engine seed ranges');
const base = read(references.base[0]);
const cohortIds = ['all-v1-01', 'all-v1-02', 'all-v1-07', 'all-v1-18'];
const cohorts = cohortIds.map(cohortId => {
  const cohort = base.cohorts.find(c => c.id === cohortId);
  assert(cohort?.opponents.length === 3, 'missing cohort');
  return { id: cohortId, opponents: cohort.opponents.map(team => ({ name: team.name, warriors: team.warriors.map(file => path.resolve(root, file)) })) };
});
const teams = cohorts.flatMap(cohort => cohort.opponents);
assert(teams.length === 12 && new Set(teams.map(team => team.name)).size === 12 && teams.every(team => team.name.startsWith('A_')), 'need 12 distinct senior teams');
const zombies = base.zombies.map(zombie => ({ name: zombie.name, path: path.resolve(root, zombie.path) }));
assert(zombies.length === 4, 'need four Zombies');
const frozen = path.join(build, 'frozen');
const controlA = path.join(frozen, 'm050-A');
const controlB = path.join(frozen, 'm050-B');
const configs = ['control', 'camper'].map(arm => ({ arm, file: path.join(here, `${arm}.json`), config: {
  experimentId: `${id}-${arm}`, java: references.java[0], jar: references.engine[0],
  outputPath: path.join(outputs, `${arm}.json`), runDirectory: path.join(runs, arm),
  candidate: { name: 'COD_pair', warriors: [controlA, arm === 'control' ? controlB : camper] },
  battles: 25, threads: 1, parallel: false, telemetry: false, seeds, cohorts, zombies,
} }));
for (const destination of [path.join(here, 'manifest.json'), path.join(here, 'manifest.json.sha256'), frozen, outputs, runs, ...configs.map(c => c.file)]) {
  assert(!fs.existsSync(destination), `refusing to overwrite or reuse ${destination}`);
}
// All preconditions are checked before exclusive artifact writes. No Java is launched.
fs.mkdirSync(frozen, { recursive: true });
fs.copyFileSync(references.m050A[0], controlA, fs.constants.COPYFILE_EXCL);
fs.copyFileSync(references.m050B[0], controlB, fs.constants.COPYFILE_EXCL);
const inputFiles = [...new Set([controlA, controlB, camper, ...teams.flatMap(t => t.warriors), ...zombies.map(z => z.path)])];
const manifest = {
  schemaVersion: 1, experimentId: id, frozenAt: new Date().toISOString(),
  protocol: { candidateName: 'COD_pair', battlesPerBlock: 25, seeds, seedRanges, cohorts: cohortIds, uniqueSeniorTeams: 12,
    battlesPerArm: 200, arms: ['control', 'camper'], threads: 1, parallel: false, telemetry: false },
  hypothesis: 'Keep exact m050 A and B capture opening, then park B in a two-byte arena JZ loop using a private stack. A screening hypothesis only; B sacrifices continued offense.',
  interpretation: 'Four selected senior triples, not a broad field or historical-final replay. Points per battle are not win rates. A positive screen would require independent broad-field validation.',
  references: Object.fromEntries(Object.entries(references).map(([name, [file]]) => [name, record(file)])),
  source: record(source), assemblyManifest: record(assemblyManifest),
  authoring: ['generate.mjs', 'analyze.mjs'].map(file => record(path.join(here, file))),
  binaries: inputFiles.map(record),
  configs: configs.map(({ arm, file, config }) => ({ arm, path: file, sha256: crypto.createHash('sha256').update(text(config)).digest('hex') })),
};
for (const entry of configs) fs.writeFileSync(entry.file, text(entry.config), { flag: 'wx' });
const manifestText = text(manifest);
const manifestHash = crypto.createHash('sha256').update(manifestText).digest('hex');
fs.writeFileSync(path.join(here, 'manifest.json'), manifestText, { flag: 'wx' });
fs.writeFileSync(path.join(here, 'manifest.json.sha256'), `${manifestHash}\n`, { flag: 'wx' });
console.log(JSON.stringify({ manifest: path.join(here, 'manifest.json'), sha256: manifestHash, camper: record(camper), configs: configs.map(c => c.file), seedRanges, status: 'prepared; no battles run' }, null, 2));
