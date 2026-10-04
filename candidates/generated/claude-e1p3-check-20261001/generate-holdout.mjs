// Fresh paired holdout for e1p3 and one preselected relay finalist.
// This freezes inputs and entropy only; it never runs battles or selects a
// finalist from holdout outcomes.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { record, seedRange, overlaps, sha, equal, assert } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const mode = process.argv[2], finalist = process.argv[3] ?? 'e1p3';
const frozen = path.join(here, 'holdout/frozen');
const outputRoot = path.join(repo, 'experiments/claude-e1p3-holdout-20261001');
const variantsAllowed = ['e1p3', 'relay-a', 'relay-b', 'relay-ab'];
assert(['--preflight', '--freeze', '--verify'].includes(mode), 'usage: node generate-holdout.mjs --preflight|--freeze|--verify [e1p3|relay-a|relay-b|relay-ab]');
assert(variantsAllowed.includes(finalist), `unknown finalist: ${finalist}`);
const arms = ['m049', 'm050', 'e1p3', ...(finalist === 'e1p3' ? [] : [finalist])];
const stressFile = path.join(repo, 'candidates/generated/claude-family-stress-20261001/frozen/manifest.json');
const stress = JSON.parse(fs.readFileSync(stressFile, 'utf8'));
const stressHash = sha(fs.readFileSync(stressFile));
equal(stressHash, fs.readFileSync(`${stressFile}.sha256`, 'utf8').trim(), 'stress-manifest checksum');
const stressFiles = new Map(stress.files.map(item => [path.resolve(item.path), item]));
function checked(file) {
  const actual = record(file), expected = stressFiles.get(path.resolve(file));
  if (expected) equal(actual, expected, `pinned research input ${file}`);
  return actual;
}
const localCandidates = {
  m049: ['A', 'B'].map(side => path.join(path.dirname(stressFile), 'binaries/m049', side)),
  m050: ['A', 'B'].map(side => path.join(path.dirname(stressFile), 'binaries/m050', side)),
  e1p3: ['e1p3A', 'e1p3B'].map(name => path.join(here, 'build', name)),
  'relay-a': ['e1p3A', 'e1p3B'].map(name => path.join(here, 'relay-builds/relay-a', name)),
  'relay-b': ['e1p3A', 'e1p3B'].map(name => path.join(here, 'relay-builds/relay-b', name)),
  'relay-ab': ['e1p3A', 'e1p3B'].map(name => path.join(here, 'relay-builds/relay-ab', name)),
};
const candidates = Object.fromEntries(arms.map(arm => [arm, localCandidates[arm]]));
const candidateFiles = Object.values(candidates).flat().map(checked);
const pool = stress.pool;
const zombies = stress.zombies;
assert(pool.length === 75 && new Set(pool.map(t => t.name)).size === 75, 'expected fixed 75-entry 2025 online-stage pool');
assert(pool.filter(t => t.name.startsWith('A_')).length === 62 && pool.filter(t => t.name.startsWith('Y_')).length === 13, 'senior/youth roster composition');
assert(zombies.length === 4, 'exact four Zombies');
const poolFiles = pool.flatMap(team => team.warriors).map(checked);
const zombieFiles = zombies.map(zombie => checked(zombie.path));
const toolBase = path.join(repo, 'tools/engine-acceleration-20261001/runtime');
const runtimeFiles = [path.join(toolBase, 'research-batch.mjs'), path.join(toolBase, 'batch-format.mjs'), path.join(toolBase, 'SerialBatchMain.java'),
  ...stress.researchRuntime.classes.map(item => item.path)].map(file => {
    const actual = record(file), prior = stressFiles.get(path.resolve(file));
    if (prior) equal(actual, prior, `pinned runtime input ${file}`);
    return actual;
  });
const engine = checked(stress.engine.path), java = checked(stress.java.path);
const localAssembler = ['e1p3-A.asm', 'e1p3-B.asm', 'assemble-local.mjs'].map(name => record(path.join(here, name)));
const relayManifests = ['relay-builds/relay-a/manifest.json', 'relay-builds/relay-b/manifest.json', 'relay-builds/relay-ab/manifest.json']
  .map(file => record(path.join(here, file)));

function shuffle(salt, items) {
  let counter = 0, bytes = Buffer.alloc(0), offset = 0;
  function bounded(bound) {
    const limit = Math.floor(0x100000000 / bound) * bound;
    let value;
    do {
      if (offset + 4 > bytes.length) {
        const block = Buffer.alloc(8); block.writeBigUInt64BE(BigInt(counter++));
        bytes = crypto.createHash('sha256').update(Buffer.from(salt, 'hex')).update(block).digest(); offset = 0;
      }
      value = bytes.readUInt32BE(offset); offset += 4;
    } while (value >= limit);
    return value % bound;
  }
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = bounded(i + 1); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
function panelsFor(randomness) {
  return randomness.panels.map((draw, index) => {
    const expectedId = `panel-${String(index + 1).padStart(2, '0')}`;
    equal(draw.id, expectedId, 'panel identifier');
    const arranged = shuffle(draw.salt, pool);
    return { id: draw.id, salt: draw.salt, seeds: draw.seeds,
      cohorts: Array.from({ length: 25 }, (_, j) => ({ id: `${draw.id}-cohort-${String(j + 1).padStart(2, '0')}`,
        opponents: arranged.slice(j * 3, j * 3 + 3) })) };
  });
}
function configsFor(panels) {
  return panels.flatMap(panel => arms.map(arm => {
    const id = `${panel.id}-${arm}`;
    return { id, panel: panel.id, arm, path: path.join(frozen, `${id}.json`), config: {
      experimentId: `claude-e1p3-holdout-20261001-${id}`, java: java.path, jar: engine.path,
      outputPath: path.join(outputRoot, 'results', `${id}.json`), runDirectory: path.join(outputRoot, 'runs', id),
      candidate: { name: 'COD_pair', warriors: candidates[arm] }, battles: 25, threads: 1, parallel: false, telemetry: false,
      seeds: panel.seeds, cohorts: panel.cohorts, zombies,
    } };
  }));
}
const design = { status: mode === '--preflight' ? 'PREFLIGHT_ONLY' : undefined, finalist, arms, teams: 75,
  composition: { senior: 62, youth: 13 }, panels: 8, cohortsPerPanel: 25, seedsPerPanel: 2, battlesPerBlock: 25,
  battlesPerArm: 10000, totalBattles: arms.length * 10000, threads: 1, parallel: false, telemetry: false,
  engine: 'exact deterministic v6 JAR; no gameplay overlays', metric: 'team points per candidate appearance',
  independenceUnit: 'eight independently salted panel-level paired deltas; seed/cohort records are nested, not extra independent n',
  confidence: { comparisons: finalist === 'e1p3' ? 2 : 5, criticalValue: finalist === 'e1p3' ? 3.0 : 4.1,
    note: 'Conservative t criticals for Bonferroni two-sided 95% familywise coverage over the predeclared candidate-vs-control contrasts; finalist-vs-e1p3 included when present.' },
  limitation: 'Fresh seeds and new cohort groupings, but the same fixed 75 published 2025 online-stage teams and four Zombies; not a verified 2025 final roster or unseen-opponent test.' };

if (mode === '--preflight') {
  console.log(JSON.stringify({ ...design, stressManifestSha256: stressHash,
    candidateHashes: Object.fromEntries(arms.map(arm => [arm, candidates[arm].map(file => record(file).sha256)])),
    frozenInputs: candidateFiles.length + poolFiles.length + zombieFiles.length + runtimeFiles.length + 2 }, null, 2));
  process.exit(0);
}
if (mode === '--verify') {
  const manifestFile = path.join(frozen, 'manifest.json');
  equal(sha(fs.readFileSync(manifestFile)), fs.readFileSync(`${manifestFile}.sha256`, 'utf8').trim(), 'holdout manifest checksum');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  equal(manifest.design.finalist, finalist, 'finalist'); equal(manifest.design.arms, arms, 'arms');
  manifest.files.forEach(item => equal(record(item.path), item, 'frozen input')); 
  const randomness = JSON.parse(fs.readFileSync(path.join(frozen, 'randomness.json'), 'utf8'));
  equal(manifest.randomness, randomness, 'randomness record');
  equal(manifest.panels, panelsFor(randomness), 'panel reconstruction');
  const ranges = randomness.panels.flatMap(panel => panel.seeds.map(seed => seedRange(seed, 25)));
  equal(randomness.ranges, ranges, 'seed range arithmetic');
  for (let i = 0; i < ranges.length; i++) {
    assert(!randomness.excludedRanges.some(old => overlaps(old, ranges[i])), 'new holdout overlaps prior seed range');
    assert(!ranges.slice(0, i).some(old => overlaps(old, ranges[i])), 'new holdout ranges overlap each other');
  }
  for (const item of configsFor(manifest.panels)) equal(JSON.parse(fs.readFileSync(item.path, 'utf8')), item.config, 'frozen config');
  console.log(JSON.stringify({ status: 'INPUTS_VERIFIED', manifestSha256: sha(fs.readFileSync(manifestFile)), design: manifest.design }));
  process.exit(0);
}

assert(!fs.existsSync(frozen), 'refusing to overwrite a previous/failed entropy freeze');
fs.mkdirSync(frozen, { recursive: true });
const excludedRanges = [...new Map([...stress.excludedRanges, ...stress.randomness.ranges].map(r => [JSON.stringify(r), r])).values()];
const randomness = { drawnAt: new Date().toISOString(), salt: crypto.randomBytes(32).toString('hex'),
  panels: Array.from({ length: 8 }, (_, index) => ({ id: `panel-${String(index + 1).padStart(2, '0')}`,
    salt: crypto.randomBytes(32).toString('hex'), seeds: Array.from({ length: 2 }, (_, j) =>
      `e1p3-holdout-20261001-p${index + 1}-s${j + 1}-${crypto.randomBytes(12).toString('hex')}`) })) };
randomness.ranges = randomness.panels.flatMap(panel => panel.seeds.map(seed => seedRange(seed, 25)));
randomness.excludedRanges = excludedRanges;
fs.writeFileSync(path.join(frozen, 'randomness-attempt.json'), `${JSON.stringify(randomness, null, 2)}\n`, { flag: 'wx' });
for (let i = 0; i < randomness.ranges.length; i++) {
  assert(!excludedRanges.some(old => overlaps(old, randomness.ranges[i])), `holdout range overlaps prior input ${randomness.ranges[i].seed}`);
  assert(!randomness.ranges.slice(0, i).some(old => overlaps(old, randomness.ranges[i])), 'new holdout ranges overlap each other');
}
const panels = panelsFor(randomness);
fs.writeFileSync(path.join(frozen, 'randomness.json'), `${JSON.stringify(randomness, null, 2)}\n`, { flag: 'wx' });
const configs = configsFor(panels);
for (const item of configs) fs.writeFileSync(item.path, `${JSON.stringify(item.config, null, 2)}\n`, { flag: 'wx' });
const allFiles = [...new Map([...candidateFiles, ...poolFiles, ...zombieFiles, ...runtimeFiles, engine, java, ...localAssembler, ...relayManifests,
  record(stressFile), record(path.join(here, 'e1p3-A.asm')), record(path.join(here, 'e1p3-B.asm')),
  record(path.join(here, 'relay-screen-manifest.json')), record(path.join(here, 'generate-holdout.mjs')),
  record(path.join(frozen, 'randomness-attempt.json')), record(path.join(frozen, 'randomness.json')),
  ...configs.map(item => record(item.path))].map(item => [item.path, item])).values()];
const manifest = { schemaVersion: 1, suite: 'claude-e1p3-fresh-holdout-20261001', frozenAt: new Date().toISOString(),
  design, stressManifest: record(stressFile), excludedRanges, randomness, panels,
  candidates: Object.fromEntries(arms.map(arm => [arm, candidates[arm].map(file => record(file))])),
  engine, java, researchRuntime: runtimeFiles, files: allFiles };
const manifestFile = path.join(frozen, 'manifest.json');
fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
fs.writeFileSync(`${manifestFile}.sha256`, `${sha(fs.readFileSync(manifestFile))}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: 'FROZEN_NOT_RUN', manifestSha256: sha(fs.readFileSync(manifestFile)), design,
  configs: configs.length, seedRanges: randomness.ranges.length }, null, 2));
