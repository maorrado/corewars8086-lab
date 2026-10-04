// Read-only: validates four explicitly supplied research directories; no Java.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { freeze, suite, arms, assert, equal, hashFile, read, check, mean, design, decision,
  panelFromSalt, seedRange, overlaps, configsFor } from './protocol.mjs';

const args = process.argv.slice(2), checkOnly = args.length === 1 && args[0] === '--check-inputs';
assert(checkOnly || args.length === 4, 'usage: node analyze.mjs --check-inputs | <entry_lea-dir> <both-dir> <m049-dir> <m050-dir>');
const manifestFile = path.join(freeze, 'manifest.json'), manifestHash = hashFile(manifestFile), manifest = read(manifestFile);
equal(manifestHash, fs.readFileSync(`${manifestFile}.sha256`, 'utf8').trim(), 'manifest checksum');
equal(manifest.suite, suite, 'suite'); equal(manifest.design, design, 'design'); equal(manifest.decision, decision, 'decision gate');
manifest.files.forEach(check);
equal(manifest.panel, panelFromSalt(manifest.randomness.panelSalt, manifest.teams), 'panel reconstruction');
equal(manifest.randomness.seedRanges, manifest.randomness.seeds.map(seed => seedRange(seed, 50)), 'fresh Java ranges');
manifest.randomness.seedRanges.forEach((range, index) => {
  for (const old of [...manifest.randomness.excludedRanges, ...manifest.randomness.seedRanges.slice(0, index)]) assert(!overlaps(range, old), 'fresh seed overlaps prior range');
});
equal(manifest.teams.length, 62, 'senior roster size');
equal(Object.values(manifest.panel.exposureCounts).filter(n => n === 2).length, 13, 'repeated teams');
assert(Object.values(manifest.panel.exposureCounts).every(n => n === 1 || n === 2), 'invalid team exposure');
const entries = configsFor(manifest.panel, manifest.randomness.seeds, manifest);
for (const item of entries) {
  const frozen = manifest.configs.find(c => c.arm === item.arm);
  equal(hashFile(item.path), frozen.sha256, 'config checksum'); equal(read(item.path), item.config, 'exact holdout configuration');
}
if (checkOnly) {
  console.log(JSON.stringify({ status: 'INPUTS_VERIFIED', manifestSha256: manifestHash, files: manifest.files.length, design, decision }));
  process.exit(0);
}
const directories = args.map(file => path.resolve(file));
assert(new Set(directories.map(file => file.toLowerCase())).size === 4, 'four different result directories required');
const audit = manifest.researchRuntime.sources.find(item => path.basename(item.path) === 'audit-derived.mjs');
assert(audit, 'missing frozen audit-derived source'); check(audit);
// Each invocation validates BOTH complete arms, archived/current inputs, actual
// counts, retained score files and exact base config. Together these cover all 4.
const integrityAudits = [[0, 2], [1, 3]].map(([a, b]) => JSON.parse(execFileSync(process.execPath,
  [audit.path, 'pair', directories[a], directories[b]], { encoding: 'utf8', windowsHide: true, maxBuffer: 4 * 1024 * 1024 })));
const field = {}, results = {}, details = [];
const expectedRuntime = new Map(manifest.researchRuntime.classes.map(item => [item.path, item]));
for (let armIndex = 0; armIndex < arms.length; armIndex++) {
  const arm = arms[armIndex], folder = directories[armIndex], config = entries[armIndex].config;
  const result = read(path.join(folder, 'result.json')), plan = read(path.join(folder, 'execution-plan.json'));
  const finished = read(path.join(folder, 'execution-finished.json'));
  equal(result.configSha256, manifest.configs[armIndex].sha256, `${arm} frozen config`);
  equal(result.config, config, `${arm} actual full config`); equal(result.experimentId, config.experimentId, `${arm} experiment`);
  equal(plan.baseConfig.path, entries[armIndex].path, 'original config path');
  assert(Date.parse(plan.createdAt) >= Date.parse(manifest.frozenAt), `${arm} execution plan predates holdout freeze`);
  equal(finished.code, 0, 'process exit'); equal(finished.failure, null, 'execution failure'); equal(finished.completedJobs, 50, 'completed job count');
  equal(result.researchExecution.mode, manifest.researchRuntime.mode, 'research mode');
  const runtime = plan.frozen.filter(item => item.path.startsWith(path.join(folder, 'runtime') + path.sep));
  equal(runtime.length, 8, 'seven reviewed classes plus base JAR');
  const runtimeClassRecords = runtime.filter(item => item.path.endsWith('.class'));
  equal(runtimeClassRecords.map(item => item.source).sort(), [...expectedRuntime.keys()].sort(), 'exact reviewed class set');
  for (const item of runtimeClassRecords) { equal(item.sha256, expectedRuntime.get(item.source).sha256, 'reviewed class hash'); equal(item.bytes, expectedRuntime.get(item.source).bytes, 'reviewed class size'); }
  equal(plan.baseEngine.sha256, manifest.engine.sha256, 'base JAR');
  equal(plan.command, { executable: manifest.java.path, args: ['-cp',
    [path.join(folder, 'runtime/wrapper'), path.join(folder, 'runtime/overlay-1'), path.join(folder, 'runtime/overlay-2'), path.join(folder, 'runtime/base-engine.jar')].join(path.delimiter),
    'SerialBatchMain', path.join(folder, 'jobs.nul')] }, 'exact accelerated runtime command, without new JVM flags');
  for (const source of manifest.researchRuntime.sources.filter(item => path.basename(item.path) !== 'audit-derived.mjs')) {
    const copy = plan.wrapper.authoring.find(item => item.source === source.path);
    assert(copy && copy.sha256 === source.sha256 && copy.bytes === source.bytes, 'wrapper/adapter source version');
  }
  let scoreless = 0;
  equal(result.runs.length, 50, '50 completed blocks');
  for (let i = 0; i < 50; i++) {
    const run = result.runs[i], job = plan.jobs[i], cohort = config.cohorts[Math.floor(i / 2)], seed = config.seeds[i % 2];
    equal(run.runId, `${cohort.id}__${seed}`, 'exact run identity');
    assert(Date.parse(run.startedAt) >= Date.parse(manifest.frozenAt), 'run predates freeze');
    equal(run.telemetry, null, 'unchanged no-telemetry setting');
    equal(run.engineArguments, ['--headless', '--comboSize', '4', '--battlesPerCombo', '50', '--seed', seed, '--threads', '1',
      '--warriorsDir', path.join(job.folder, 'survivors'), '--zombiesDir', path.join(job.folder, 'zombies'), '--outputFile', job.scorePath, '--parallel=false'], 'exact per-job options');
    const names = ['COD_pair', ...cohort.opponents.map(team => team.name)];
    equal(Object.keys(run.scores.groups).sort(), [...names].sort(), 'group score identities');
    equal(Object.keys(run.scores.warriors).sort(), names.flatMap(name => [`${name}1`, `${name}2`]).sort(), 'warrior score identities');
    equal(fs.readdirSync(path.join(job.folder, 'survivors')).sort(), names.flatMap(name => [`${name}1`, `${name}2`]).sort(), 'archive warrior membership');
    equal(fs.readdirSync(path.join(job.folder, 'zombies')).sort(), config.zombies.map(z => z.name).sort(), 'archive Zombie membership');
    const tolerance = 0.0005;
    for (const name of names) assert(Math.abs(run.scores.groups[name] - run.scores.warriors[`${name}1`] - run.scores.warriors[`${name}2`]) <= tolerance, 'team/warrior score sum');
    const missing = 50 - Object.values(run.scores.groups).reduce((sum, n) => sum + n, 0);
    assert(missing >= -tolerance && Math.abs(missing - Math.round(missing)) <= tolerance, 'integer no-award conservation');
    scoreless += Math.round(missing);
    const pairedInputs = { opponents: cohort.opponents.map(team => [team.name, run.inputs[team.name].map(f => f.sha256)]), zombies: run.zombies.map(z => [z.name, z.sha256]) };
    if (armIndex === 0) field[run.runId] = pairedInputs; else equal(pairedInputs, field[run.runId], 'exact paired opponents and Zombies');
  }
  equal(result.aggregate.battles, 2500, 'full holdout arm');
  results[arm] = result;
  details.push({ arm, directory: folder, resultSha256: hashFile(path.join(folder, 'result.json')), planSha256: hashFile(path.join(folder, 'execution-plan.json')),
    pointsPerBattle: result.aggregate.teamPerBattle, scorelessBattles: scoreless });
}
const comparisons = [];
for (const candidate of decision.candidates) for (const reference of decision.references) {
  const deltas = results[candidate].runs.map((run, i) => ({ cohort: run.cohortId, seed: run.seed,
    delta: run.candidate.teamPerBattle - results[reference].runs[i].candidate.teamPerBattle }));
  const byCohort = manifest.panel.cohorts.map(cohort => ({ cohort: cohort.id, delta: mean(deltas.filter(d => d.cohort === cohort.id).map(d => d.delta)) }));
  const bySeed = manifest.randomness.seeds.map(seed => ({ seed, delta: mean(deltas.filter(d => d.seed === seed).map(d => d.delta)) }));
  const delta = mean(byCohort.map(item => item.delta));
  const standardError = Math.sqrt(byCohort.reduce((sum, item) => sum + (item.delta - delta) ** 2, 0) / 24 / 25);
  const interval = [delta - decision.criticalValue * standardError, delta + decision.criticalValue * standardError];
  const passes = delta > 0 && interval[0] > 0 && bySeed.every(item => item.delta > 0);
  comparisons.push({ candidate, reference, meanDelta: delta, approximate99CohortInterval: interval, standardError, cohortCount: 25,
    bySeed, byCohort, passes });
}
const passedCandidates = decision.candidates.filter(candidate => comparisons.filter(c => c.candidate === candidate).every(c => c.passes));
console.log(JSON.stringify({ status: 'VALIDATED_FRESH_HOLDOUT', manifestSha256: manifestHash, source: 'four explicitly supplied accelerated result directories, matched to frozen original configs; no old-result pooling',
  arms: details, blocks: 200, battleExecutions: 10000, comparisons, passedCandidates, decision,
  integrityChecks: { archivedPairAudits: integrityAudits.length, pairedCohortSeedBlocksPerComparison: 50 },
  interpretation: decision.interpretation }, null, 2));
