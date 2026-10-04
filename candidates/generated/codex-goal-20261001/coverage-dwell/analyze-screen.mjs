// Completed-screen analysis only. Invokes Node integrity readers, never Java.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../../..');
const assert = (ok, message) => { if (!ok) throw Error(message); };
const equal = (actual, expected, message) => assert(JSON.stringify(actual) === JSON.stringify(expected), message);
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const record = file => ({ path: path.resolve(file), bytes: fs.statSync(file).size, sha256: hash(file) });
const near = (actual, expected, message) => assert(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-12, message);
assert([4, 6].includes(process.argv.length) && process.argv[2] === '--manifest-sha256' && /^[a-f0-9]{64}$/i.test(process.argv[3]) &&
  (process.argv.length === 4 || process.argv[4] === '--results-dir'),
  'usage: node analyze-screen.mjs --manifest-sha256 <reviewed-frozen-hash> [--results-dir <three-arm-root>]');
const expectedManifestHash = process.argv[3].toLowerCase();
const folder = process.argv.length === 6 ? path.resolve(process.argv[5]) : path.join(root, 'experiments/codex-goal-20261001/accelerated-coverage-dwell');
const manifestFile = path.join(here, 'screen/manifest.json'), output = path.join(here, 'screen/analysis.json');
assert(!fs.existsSync(output), 'Refusing an existing analysis artifact');
equal(hash(manifestFile), expectedManifestHash, 'frozen screen differs from explicitly reviewed manifest hash');
const manifest = read(manifestFile), arms = ['m050', 'lower-strides', 'upper-strides'];
equal(manifest.protocol.arms, arms, 'exact three-arm design');
equal(manifest.protocol.totalBattles, 1500, 'fixed total battle count');
assert(/^[a-f0-9]{64}$/.test(manifest.validation.expectedSha256), 'missing frozen validation pin');
const commands = [], evidence = new Map();
const add = file => { const item = record(file); evidence.set(item.path, item); return item; };
add(manifestFile); add(fileURLToPath(import.meta.url));
function audit(args) {
  const result = spawnSync(process.execPath, args, { encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  commands.push({ executable: process.execPath, args, exitCode: result.status, stdout: result.stdout, stderr: result.stderr, error: result.error?.message ?? null });
  assert(result.status === 0 && !result.error && !result.stderr, 'integrity reader failed');
  return JSON.parse(result.stdout);
}
audit([path.join(here, 'generate-screen.mjs'), '--verify', '--validation-sha256', manifest.validation.expectedSha256]);
equal(manifest.configs.map(item => item.arm), arms, 'exact config order');
// Do not begin numerical comparisons while any arm lacks completion artifacts.
for (const arm of arms) for (const name of ['result.json', 'execution-plan.json', 'execution-finished.json']) {
  assert(fs.existsSync(path.join(folder, arm, name)), `all arms must complete first: ${arm}/${name}`);
}
const scores = {}, loaded = {};
const runtime = manifest.researchRuntime;
const stableRecords = records => records.map(item => ({ path: item.path, bytes: item.bytes, sha256: item.sha256 }))
  .sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
for (const item of manifest.configs) {
  const directory = path.join(folder, item.arm), resultFile = path.join(directory, 'result.json');
  const planFile = path.join(directory, 'execution-plan.json'), finishedFile = path.join(directory, 'execution-finished.json');
  const result = read(resultFile), plan = read(planFile), finished = read(finishedFile), config = read(item.path);
  add(resultFile); add(planFile); add(finishedFile);
  equal(record(item.path), { path: item.path, bytes: item.bytes, sha256: item.sha256 }, 'unchanged frozen arm config');
  equal(result.configSha256, item.sha256, 'result config hash'); equal(result.config, config, 'result config content');
  equal(plan.baseConfig, { path: item.path, sha256: item.sha256, config }, 'execution plan source config');
  equal(result.aggregate.battles, 500, 'complete 500-battle arm'); equal(result.runs.length, 25, 'complete 25-block arm');
  equal(plan.jobs.length, 25, 'complete 25-job plan');
  equal([finished.code, finished.signal, finished.failure, finished.completedJobs, finished.expectedJobs], [0, null, null, 25, 25], 'successful complete process');
  equal(plan.mode, 'isolated-persistent-serial', 'reviewed serial runtime mode');
  equal(plan.java, manifest.java, 'reviewed Java runtime');
  equal(plan.baseEngine.source, manifest.engine.path, 'original engine source');
  equal([plan.baseEngine.bytes, plan.baseEngine.sha256], [manifest.engine.bytes, manifest.engine.sha256], 'original engine identity');
  equal(plan.overlays.map(overlay => overlay.source), runtime.directories.slice(1), 'exact reviewed overlay order');
  equal(plan.wrapper.mainClass, 'SerialBatchMain', 'reviewed batch wrapper');
  const expectedClassPaths = [path.join(directory, 'runtime/wrapper'), path.join(directory, 'runtime/overlay-1'), path.join(directory, 'runtime/overlay-2')];
  equal([plan.wrapper.staged, ...plan.overlays.map(overlay => overlay.staged)], expectedClassPaths, 'isolated runtime locations');
  equal(plan.baseEngine.target, path.join(directory, 'runtime/base-engine.jar'), 'isolated original engine location');
  equal(plan.command, { executable: manifest.java.path, args: ['-cp', [...expectedClassPaths, plan.baseEngine.target].join(path.delimiter),
    'SerialBatchMain', path.join(directory, 'jobs.nul')] }, 'exact reviewed command, no JVM overrides');
  equal(result.researchExecution.command, plan.command, 'recorded runtime command');
  const stagedRuntime = plan.frozen.filter(entry => entry.path.startsWith(path.join(directory, 'runtime') + path.sep));
  equal(stableRecords(stagedRuntime.map(entry => ({ ...entry, path: entry.source }))),
    stableRecords([manifest.engine, ...runtime.classes]), 'exact engine/wrapper/overlay files, no extra classes');
  equal(stableRecords(plan.wrapper.authoring.map(entry => ({ ...entry, path: entry.source }))),
    stableRecords(runtime.sources.filter(entry => path.basename(entry.path) !== 'audit-derived.mjs')), 'reviewed adapter authoring sources');
  for (let i = 0; i < 25; i++) {
    const run = result.runs[i], job = plan.jobs[i];
    equal([run.cohortId, run.seed, run.battles], [manifest.cohorts[i].id, manifest.randomness.seed, 20], 'complete exact cohort/seed schedule');
    equal([job.cohortId, job.seed, job.battles], [manifest.cohorts[i].id, manifest.randomness.seed, 20], 'matching execution job schedule');
    for (const [flag, value] of [['--seed', manifest.randomness.seed], ['--battlesPerCombo', '20']]) {
      assert(job.args.filter(arg => arg === flag).length === 1, `one ${flag} engine argument required`);
      equal(job.args[job.args.indexOf(flag) + 1], value, 'actual engine seed/battle argument');
    }
  }
  loaded[item.arm] = result; scores[item.arm] = result.aggregate;
}
const auditFile = path.join(root, 'tools/engine-acceleration-20261001/audit-derived.mjs');
const comparisons = arms.slice(1).map(arm => {
  // This existing reader verifies plan/config/input hashes, actual starts/ends,
  // retained score CSVs, per-run records, parsing, normalization and pairing.
  const metrics = audit([auditFile, 'pair', path.join(folder, arm), path.join(folder, 'm050')]);
  equal(metrics.cohortCount, 25, 'exact cohort clustering');
  near(metrics.candidate, scores[arm].teamPerBattle, 'candidate aggregate agreement');
  near(metrics.reference, scores.m050.teamPerBattle, 'reference aggregate agreement');
  const cohortDeltas = loaded[arm].runs.map((run, i) => ({ cohortId: run.cohortId, seed: run.seed,
    delta: run.candidate.teamPerBattle - loaded.m050.runs[i].candidate.teamPerBattle }));
  const meanDelta = cohortDeltas.reduce((sum, item) => sum + item.delta, 0) / 25;
  const se = Math.sqrt(cohortDeltas.reduce((sum, item) => sum + (item.delta - meanDelta) ** 2, 0) / 24 / 25);
  const interval = [meanDelta - 2.0638985616280205 * se, meanDelta + 2.0638985616280205 * se];
  near(metrics.meanDelta, meanDelta, 'independent paired mean');
  metrics.descriptive95CohortInterval.forEach((value, i) => near(value, interval[i], 'independent df=24 interval'));
  near(meanDelta, metrics.candidate - metrics.reference, 'equal-weight/pooled agreement');
  return { arm, ...metrics, cohortDeltas };
});
// Ensure inputs/results did not change while the two integrity readers ran.
for (const item of evidence.values()) equal(record(item.path), item, 'analysis evidence changed during audit');
const result = { status: 'AUDITED_COMPLETE', recordedAt: new Date().toISOString(), manifestSha256: expectedManifestHash,
  validationSha256: manifest.validation.expectedSha256, resultDirectory: folder, battles: 1500, scores, comparisons,
  selectedForFreshHoldout: comparisons.filter(item => item.meanDelta > 0).map(item => item.arm),
  interpretation: 'Exploratory complete paired screen only. Each strictly positive arm needs a fresh matched holdout against BOTH exact m049 and m050. Descriptive cohort intervals are not a significance gate; no screen promotion or universal claim.',
  commands, files: [...evidence.values()] };
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output, sha256: hash(output), battles: 1500, scores, comparisons,
  selectedForFreshHoldout: result.selectedForFreshHoldout }));
