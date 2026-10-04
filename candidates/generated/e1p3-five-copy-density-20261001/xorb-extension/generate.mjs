// Post-hoc paired extension: exact m050-XORB against the frozen five-e1p3 pool.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { record, text } from '../../codex-goal-20261001/bootstrap-holdout/protocol.mjs';
import { assert, equal, sha } from '../model.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../../..');
const mode = process.argv[2]; assert(['--preflight', '--freeze', '--verify'].includes(mode), 'usage: generate.mjs --preflight|--freeze|--verify');
const parentDir = path.join(repo, 'experiments/e1p3-five-copy-density-20261001');
const parentFreeze = path.join(repo, 'candidates/generated/e1p3-five-copy-density-20261001/frozen');
const parentManifestPath = path.join(parentFreeze, 'manifest.json'), parentBytes = fs.readFileSync(parentManifestPath);
const parentHash = sha(parentBytes), parent = JSON.parse(parentBytes);
equal(parentHash, fs.readFileSync(`${parentManifestPath}.sha256`, 'utf8').trim(), 'parent frozen manifest hash');
equal(parentHash, '84e8b08637f8f7e29f719a9791a6a11589872a2ab0185c48069b500b94b429ba', 'expected parent study');
const completion = JSON.parse(fs.readFileSync(path.join(parentDir, 'runner-complete.json'), 'utf8'));
assert(completion.status === 'ALL_DENSITY_JOBS_COMPLETE' && completion.battles === 3200, 'parent study must be complete');
const parentAnalysis = [path.join(parentDir, 'analysis-corrected.json'), path.join(parentDir, 'paired-comparisons.json')].map(file => record(file));
for (const item of parent.files) equal(record(item.path), item, `parent frozen input ${item.path}`);

const xorDir = path.join(repo, 'build/m050-pointer-operator/xor-b'), srcDir = path.join(repo, 'candidates/generated/m050-pointer-operator/xor-b');
const xorBinaries = ['A', 'B'].map(name => path.join(xorDir, name));
const xorSources = ['A.asm', 'B.asm'].map(name => path.join(srcDir, name));
const xorBuildManifestPath = path.join(xorDir, 'manifest.json'), xorBuildManifest = JSON.parse(fs.readFileSync(xorBuildManifestPath, 'utf8'));
const expectedBinaryHashes = ['0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44',
  'fb66036e0b20a8df162da32e453cc148b5ff5ea0d1494439f3c417be0a57d994'];
equal(xorBuildManifest.length, 2, 'XORB assembly manifest');
for (let i = 0; i < 2; i++) {
  const entry = xorBuildManifest[i]; equal(path.resolve(entry.input), path.resolve(xorSources[i]), 'XORB source path');
  equal(record(xorSources[i]).sha256, entry.sourceSha256, 'XORB source hash');
  equal(path.resolve(entry.output), path.resolve(xorBinaries[i]), 'XORB binary path');
  equal(record(xorBinaries[i]).sha256, expectedBinaryHashes[i], 'XORB exact binary hash');
}
const extensionFreeze = path.join(here, 'frozen'), experimentDir = path.join(repo, 'experiments/m050-xorb-e1p3-density-extension-20261001');
const extensionBins = ['A', 'B'].map(name => path.join(extensionFreeze, 'binaries', name));
const parentM050 = parent.configs.filter(c => c.arm === 'm050');
equal(parentM050.length, 80, '80 exact parent control configs');
const firstParentConfig = JSON.parse(fs.readFileSync(parentM050[0].path, 'utf8'));
const engineRecord = record(path.resolve(firstParentConfig.jar));
const javaRecord = record(path.resolve(firstParentConfig.java));
const controlRecords = [];
const configs = parentM050.map((item, index) => {
  const parentConfigPath = item.path, original = JSON.parse(fs.readFileSync(parentConfigPath, 'utf8'));
  const resultPath = path.join(parentDir, 'accelerated', item.id, 'result.json');
  const parentResult = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  equal(parentResult.configSha256, sha(fs.readFileSync(parentConfigPath)), `${item.id} parent config hash`);
  assert(parentResult.aggregate.battles === 10 && parentResult.runs.length === 1, `${item.id} complete parent control`);
  controlRecords.push(record(parentConfigPath), record(resultPath));
  const id = `${item.cohortId}-m050-xorb-o${item.orientation + 1}`;
  const config = { ...original,
    experimentId: `m050-xorb-e1p3-density-extension-20261001-${id}`,
    outputPath: path.join(experimentDir, 'unused-official-output', `${id}.json`),
    runDirectory: path.join(experimentDir, 'unused-official-runs', id),
    candidate: { ...original.candidate, warriors: extensionBins } };
  return { id, cohortId: item.cohortId, k: item.k, orientation: item.orientation, parentId: item.id,
    path: path.join(extensionFreeze, 'configs', `${id}.json`), config };
});
const uniqueRecords = records => [...new Map(records.map(x => [x.path, x])).values()];
const parentInputPaths = new Set();
for (const item of parentM050) {
  const original = JSON.parse(fs.readFileSync(item.path, 'utf8'));
  parentInputPaths.add(path.resolve(original.java));
  parentInputPaths.add(path.resolve(original.jar));
  for (const team of [original.candidate, ...original.cohorts.flatMap(c => c.opponents)])
    for (const file of team.warriors) parentInputPaths.add(path.resolve(file));
  for (const zombie of original.zombies) parentInputPaths.add(path.resolve(zombie.path));
}
for (const item of parent.files) {
  if (item.path.includes('engine-acceleration-20261001\\runtime\\')) parentInputPaths.add(path.resolve(item.path));
}
const parentInputRecords = [...parentInputPaths].map(file => record(file));
const filesBefore = uniqueRecords([
  record(parentManifestPath), record(`${parentManifestPath}.sha256`), ...parentAnalysis,
  record(xorBuildManifestPath), ...xorSources.map(record), ...xorBinaries.map(record),
  ...controlRecords, ...parentInputRecords,
  record(path.join(here, 'PROTOCOL.md')), record(path.join(here, 'generate.mjs')),
  record(path.join(here, 'run.mjs')), record(path.join(here, 'analyze.mjs')),
]);
const manifestPath = path.join(extensionFreeze, 'manifest.json');

if (mode === '--preflight') {
  console.log(text({ status: 'PREFLIGHT_NO_WRITES_NO_BATTLES', parentManifestSha256: parentHash,
    arms: configs.length, addedBattles: configs.length * 10, seedRangesReused: 40,
    XORBHashes: expectedBinaryHashes, controls: controlRecords.length / 2 })); process.exit(0);
}
if (mode === '--verify') {
  const bytes = fs.readFileSync(manifestPath), manifest = JSON.parse(bytes);
  equal(sha(bytes), fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim(), 'extension manifest checksum');
  equal(manifest.parentManifestSha256, parentHash, 'parent manifest identity');
  equal(manifest.configs.length, configs.length, 'extension config count');
  for (const file of manifest.files) equal(record(file.path), file, `frozen extension input ${file.path}`);
  for (const item of configs) equal(JSON.parse(fs.readFileSync(item.path, 'utf8')), item.config, `${item.id} exact config`);
  equal(manifest.configs, configs.map(({ config, path: p, ...x }) => ({ ...x, ...record(p) })), 'extension config metadata');
  console.log(text({ status: 'INPUTS_VERIFIED_NO_RUNS', manifestSha256: sha(bytes), configs: configs.length })); process.exit(0);
}
assert(!fs.existsSync(extensionFreeze) && !fs.existsSync(experimentDir), 'refusing prior freeze or run directory');
fs.mkdirSync(path.join(extensionFreeze, 'configs'), { recursive: true });
for (let i = 0; i < 2; i++) {
  fs.mkdirSync(path.dirname(extensionBins[i]), { recursive: true });
  fs.copyFileSync(xorBinaries[i], extensionBins[i]);
  equal(record(extensionBins[i]).sha256, expectedBinaryHashes[i], 'copied XORB hash');
}
for (const item of configs) fs.writeFileSync(item.path, text(item.config), { flag: 'wx' });
const files = uniqueRecords([...filesBefore, ...extensionBins.map(record),
  ...configs.map(item => record(item.path)), ...parent.pool.flatMap(t => t.warriors.map(record)),
  ...parent.zombies.map(z => record(z.path))]);
const metadata = configs.map(({ config, path: p, ...x }) => ({ ...x, ...record(p) }));
const manifest = { schemaVersion: 1, suite: 'm050-xorb-e1p3-density-extension-20261001', frozenAt: new Date().toISOString(),
  interpretation: 'paired post-hoc extension; parent m050 outcomes reused, not independent evidence or fresh holdout',
  parentManifestSha256: parentHash, parentAnalyses: parentAnalysis,
  design: { candidate: 'm050-XORB', schedule: 'same five-identical-e1p3 opponent schedule as parent', configs: configs.length,
    battlesPerConfig: 10, totalNewBattles: configs.length * 10, cohortsPerK: 10, nameOrientations: 2,
    threads: 1, parallel: false, telemetry: false, originalEngineNoOverlays: true },
  candidateHashes: expectedBinaryHashes, controls: controlRecords, engine: engineRecord, java: javaRecord,
  configs: metadata, files };
const bytes = text(manifest); fs.writeFileSync(manifestPath, bytes, { flag: 'wx' });
const manifestHash = sha(Buffer.from(bytes)); fs.writeFileSync(`${manifestPath}.sha256`, `${manifestHash}\n`, { flag: 'wx' });
console.log(text({ status: 'FROZEN_NOT_RUN', manifestSha256: manifestHash, configs: configs.length,
  battles: configs.length * 10, parentManifestSha256: parentHash }));
