// Completed-suite integrity and statistics only. Node readers, never a battle launcher.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../..');
const assert = (ok, message) => { if (!ok) throw Error(message); };
const equal = (a, b, message) => assert(JSON.stringify(a) === JSON.stringify(b), message);
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const record = file => ({ path: path.resolve(file), bytes: fs.statSync(file).size, sha256: hash(file) });
const mean = values => values.reduce((sum, x) => sum + x, 0) / values.length;
const near = (a, b, message) => assert(Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1e-12, message);
const args = process.argv.slice(2), options = new Map();
assert(args.length % 2 === 0, 'option/value pairs required');
for (let i = 0; i < args.length; i += 2) {
  assert(['--manifest-sha256', '--results-dir', '--replay-dir'].includes(args[i]) && !options.has(args[i]), 'unknown/duplicate option');
  options.set(args[i], args[i + 1]);
}
assert(/^[a-f0-9]{64}$/i.test(options.get('--manifest-sha256') ?? ''),
  'usage: node analyze.mjs --manifest-sha256 <reviewed-freeze-hash> [--results-dir <32-run-root>] [--replay-dir <four-original-run-root>]');
const expectedHash = options.get('--manifest-sha256').toLowerCase();
const resultsDir = path.resolve(options.get('--results-dir') ?? path.join(root, 'experiments/claude-e1-confirmation-20261001/accelerated'));
const replayDir = path.resolve(options.get('--replay-dir') ?? path.join(root, 'experiments/claude-e1-confirmation-20261001/original-replay'));
const manifestFile = path.join(here, 'frozen/manifest.json'), output = path.join(here, 'analysis.json');
assert(!fs.existsSync(output), 'Refusing existing analysis'); equal(hash(manifestFile), expectedHash, 'explicit frozen manifest identity');
const manifest = read(manifestFile), arms = ['m049', 'm050', 'c090', 'e1'];
equal(manifest.design.arms, arms, 'fixed four-arm suite');
equal([manifest.panels.length, manifest.configs.length, manifest.design.totalBattles], [8, 32, 40000], 'fixed eight-panel suite');
const evidence = new Map(), commands = [];
const add = file => { const item = record(file); evidence.set(item.path, item); return item; };
add(manifestFile); add(fileURLToPath(import.meta.url));
function audit(args) {
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  commands.push({ executable: process.execPath, args, exitCode: r.status, stdout: r.stdout, stderr: r.stderr, error: r.error?.message ?? null });
  assert(r.status === 0 && !r.error && !r.stderr, 'integrity reader failed'); return JSON.parse(r.stdout);
}
audit([path.join(here, 'generate.mjs'), '--verify', '--inputs-sha256', manifest.inputs.expectedSha256]);
const replayConfigs = manifest.configs.filter(item => item.panel === 'panel-01');
equal(replayConfigs.map(item => item.arm), arms, 'preregistered whole-panel replay');
for (const [base, configs] of [[resultsDir, manifest.configs], [replayDir, replayConfigs]]) {
  for (const item of configs) for (const name of ['result.json', 'execution-plan.json', 'execution-finished.json']) {
    assert(fs.existsSync(path.join(base, item.id, name)), `entire suite and replay must complete first: ${item.id}/${name}`);
  }
}
const stable = records => records.map(item => ({ path: item.path, bytes: item.bytes, sha256: item.sha256 }))
  .sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
function inspect(base, item, originalOnly) {
  const directory = path.join(base, item.id), resultFile = path.join(directory, 'result.json');
  const planFile = path.join(directory, 'execution-plan.json'), finishedFile = path.join(directory, 'execution-finished.json');
  const result = read(resultFile), plan = read(planFile), finished = read(finishedFile), config = read(item.path);
  add(resultFile); add(planFile); add(finishedFile);
  equal(record(item.path), { path: item.path, bytes: item.bytes, sha256: item.sha256 }, 'frozen config unchanged');
  equal(result.configSha256, item.sha256, 'result frozen config identity'); equal(result.config, config, 'result config content');
  equal(plan.baseConfig, { path: item.path, sha256: item.sha256, config }, 'execution source config');
  equal([result.aggregate.battles, result.runs.length, plan.jobs.length], [1250, 50, 50], 'complete partition/arm counts');
  equal([finished.code, finished.signal, finished.failure, finished.completedJobs, finished.expectedJobs], [0, null, null, 50, 50], 'successful complete process');
  equal(plan.mode, 'isolated-persistent-serial', 'reviewed serial mode'); equal(plan.java, manifest.java, 'reviewed Java');
  equal(plan.baseEngine.source, manifest.engine.path, 'original JAR source');
  equal([plan.baseEngine.bytes, plan.baseEngine.sha256], [manifest.engine.bytes, manifest.engine.sha256], 'original JAR identity');
  const runtime = manifest.researchRuntime, directories = originalOnly ? runtime.directories.slice(0, 1) : runtime.directories;
  equal(plan.overlays.map(item => item.source), directories.slice(1), 'exact overlay policy; none for original replay');
  const classpaths = directories.map((_, i) => path.join(directory, 'runtime', i === 0 ? 'wrapper' : `overlay-${i}`));
  equal([plan.wrapper.staged, ...plan.overlays.map(item => item.staged)], classpaths, 'isolated reviewed classpaths');
  equal(plan.wrapper.mainClass, 'SerialBatchMain', 'reviewed wrapper');
  equal(plan.baseEngine.target, path.join(directory, 'runtime/base-engine.jar'), 'staged original JAR');
  equal(plan.command, { executable: manifest.java.path, args: ['-cp', [...classpaths, plan.baseEngine.target].join(path.delimiter),
    'SerialBatchMain', path.join(directory, 'jobs.nul')] }, 'exact command without JVM overrides');
  equal(result.researchExecution.command, plan.command, 'recorded actual command');
  const classes = runtime.classes.filter(item => directories.some(dir => item.path.startsWith(dir + path.sep)));
  const staged = plan.frozen.filter(item => item.path.startsWith(path.join(directory, 'runtime') + path.sep));
  equal(stable(staged.map(item => ({ ...item, path: item.source }))), stable([manifest.engine, ...classes]), 'no additional engine/classes');
  equal(stable(plan.wrapper.authoring.map(item => ({ ...item, path: item.source }))),
    stable(runtime.sources.filter(item => path.basename(item.path) !== 'audit-derived.mjs')), 'reviewed adapter source');
  for (let i = 0; i < 50; i++) {
    const run = result.runs[i], job = plan.jobs[i], cohort = config.cohorts[Math.floor(i / 2)], seed = config.seeds[i % 2];
    equal([run.cohortId, run.seed, run.battles], [cohort.id, seed, 25], 'exact run schedule');
    equal([job.cohortId, job.seed, job.battles], [cohort.id, seed, 25], 'exact execution schedule');
    for (const [flag, value] of [['--seed', seed], ['--battlesPerCombo', '25']]) {
      equal(job.args.filter(arg => arg === flag).length, 1, 'one actual engine option'); equal(job.args[job.args.indexOf(flag) + 1], value, 'actual engine option matches schedule');
    }
    equal(run.inputs.COD_pair.map(item => item.sha256), manifest.expectedHashes[item.arm], 'same-name exact candidate mapping');
  }
  return result;
}
const data = {}, original = {};
for (const item of manifest.configs) data[item.id] = inspect(resultsDir, item, false);
for (const item of replayConfigs) original[item.id] = inspect(replayDir, item, true);
const auditor = path.join(root, 'tools/engine-acceleration-20261001/audit-derived.mjs');
// Two disjoint pairs per panel fully audit all four arms without re-reading
// each arm for every numerical contrast. Configs already bind identical schedules.
for (const panel of manifest.panels) for (const [candidate, reference] of [['c090', 'm050'], ['e1', 'm049']]) {
  const result = audit([auditor, 'pair', path.join(resultsDir, `${panel.id}-${candidate}`), path.join(resultsDir, `${panel.id}-${reference}`)]);
  equal(result.cohortCount, 25, 'fully audited paired panel');
}
for (const [candidate, reference] of [['c090', 'm050'], ['e1', 'm049']]) {
  audit([auditor, 'pair', path.join(replayDir, `panel-01-${candidate}`), path.join(replayDir, `panel-01-${reference}`)]);
}
const replays = replayConfigs.map(item => ({ arm: item.arm, ...audit([auditor, 'replay', path.join(resultsDir, item.id), path.join(replayDir, item.id, 'result.json')]) }));
assert(replays.every(item => item.status === 'EXACT_REPLAY' && item.blocks === 50 && item.battles === 1250), 'all-four complete original score replays required');
const panelScores = manifest.panels.map(panel => ({ panel: panel.id, scores: Object.fromEntries(arms.map(arm => [arm, data[`${panel.id}-${arm}`].aggregate.teamPerBattle])) }));
const pooled = Object.fromEntries(arms.map(arm => [arm, mean(panelScores.map(panel => panel.scores[arm]))]));
const comparisons = manifest.decision.contrasts.map(([candidate, reference]) => {
  const byPanel = [], bySeed = [], cohortMeans = [];
  for (const panel of manifest.panels) {
    const a = data[`${panel.id}-${candidate}`], b = data[`${panel.id}-${reference}`];
    const deltas = a.runs.map((run, i) => run.candidate.teamPerBattle - b.runs[i].candidate.teamPerBattle);
    const delta = mean(deltas); near(delta, a.aggregate.teamPerBattle - b.aggregate.teamPerBattle, 'panel score/delta agreement');
    byPanel.push({ panel: panel.id, delta });
    for (const seed of panel.seeds) bySeed.push({ panel: panel.id, seed, delta: mean(deltas.filter((_, i) => a.runs[i].seed === seed)) });
    for (let i = 0; i < 25; i++) cohortMeans.push(mean(deltas.slice(2 * i, 2 * i + 2)));
  }
  const values = byPanel.map(item => item.delta), delta = mean(values);
  const se = Math.sqrt(values.reduce((sum, value) => sum + (value - delta) ** 2, 0) / 7 / 8);
  const interval95 = [delta - manifest.decision.criticalValue * se, delta + manifest.decision.criticalValue * se];
  near(delta, pooled[candidate] - pooled[reference], 'pooled/equal-panel mean agreement');
  const sensitivity = values => ({ positive: values.filter(x => x > 0).length, negative: values.filter(x => x < 0).length,
    zero: values.filter(x => x === 0).length, min: Math.min(...values), max: Math.max(...values) });
  const classification = delta > 0 && interval95[0] > 0 ? 'SUPERIOR' : interval95[1] < 0 ? 'INFERIOR' : 'INCONCLUSIVE';
  return { candidate, reference, pooledDelta: delta, panelInterval95: interval95, classification, partitionCount: 8, degreesOfFreedom: 7,
    passesContrast: delta > 0 && interval95[0] > 0, byPanel, bySeed,
    sensitivity: { partitions: sensitivity(values), seedCells: sensitivity(bySeed.map(item => item.delta)),
      panelCohortMeans: sensitivity(cohortMeans), note: 'Seed/cohort summaries are sensitivity diagnostics, not extra independent primary samples.' } };
});
const conclusions = ['c090', 'e1'].map(candidate => {
  const controls = comparisons.filter(item => item.candidate === candidate && ['m049', 'm050'].includes(item.reference));
  equal(controls.length, 2, 'both controls required');
  const inferiorTo = controls.filter(item => item.classification === 'INFERIOR').map(item => item.reference);
  return { candidate, status: controls.every(item => item.passesContrast) ? 'VERIFIED_ADVANTAGE_ON_THIS_POOL' :
    inferiorTo.length ? 'SUPPORTED_INFERIOR_TO_AT_LEAST_ONE_CONTROL' : 'INCONCLUSIVE_UNDER_THIS_PROTOCOL',
    inferiorTo, scope: 'This fixed public pool and confirmation protocol, not universal superiority or inferiority.' };
});
for (const item of evidence.values()) equal(record(item.path), item, 'evidence changed during analysis');
const result = { status: 'COMPLETE_AUDITED_CONFIRMATION', recordedAt: new Date().toISOString(), manifestSha256: expectedHash,
  resultsDir, replayDir, scoredBattles: 40000, originalReplayBattles: 5000, pooled, panelScores, comparisons, conclusions, replays,
  limitation: 'Nominal per-contrast 95% partition t intervals on a fixed public pool; not simultaneous familywise confidence, universal superiority, or automatic final promotion. Replay battles are integrity checks, not pooled extra observations.',
  commands, files: [...evidence.values()] };
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output, sha256: hash(output), pooled, comparisons, conclusions }));
