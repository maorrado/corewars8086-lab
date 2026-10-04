// Complete-suite integrity/statistics reader. Never launches a battle or tunes code.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { arms, duelOpponents, candidateNames, design, analysisPlan, weights, assert, equal,
  sha, mean, summarize, weightedSummary } from './model.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../..');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => sha(fs.readFileSync(file));
const record = file => ({ path: path.resolve(file), bytes: fs.statSync(file).size, sha256: hash(file) });
const near = (a, b, label) => assert(Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-12, label);
const args = process.argv.slice(2), options = new Map();
if (args.length === 1 && args[0] === '--self-test') {
  const raw = 'Groups:\nDUEL_A,0.75\nDUEL_B,0.25\n\nWarriors:\nDUEL_A1,0.5\nDUEL_A2,0.25\nDUEL_B1,0.25\nDUEL_B2,0\n';
  const parsed = parseScores(raw, ['DUEL_A', 'DUEL_B'], 1);
  equal(parsed.conservation.unawardedBattles, 0, 'score parser author test');
  const zero = parseScores(raw.replace(/,0\.(75|25|5)/g, ',0'), ['DUEL_A', 'DUEL_B'], 1);
  equal(zero.conservation.unawardedBattles, 1, 'legitimate unawarded battle');
  for (const invalid of [raw + 'DUEL_A1,0\n', raw.replace('DUEL_B2,0\n', ''), raw.replace('DUEL_A,0.75', 'DUEL_A,NaN'),
    raw.replace('DUEL_B,0.25', 'DUEL_B,0.5')]) {
    let rejected = false; try { parseScores(invalid, ['DUEL_A', 'DUEL_B'], 1); } catch { rejected = true; }
    assert(rejected, 'invalid score author test must fail');
  }
  const jobs = [{ id: 'job-1', battles: 1 }], runs = [{ stdout: 'hello\n', elapsedSeconds: 1 }];
  const framed = 'BATCH_V1_BEGIN job-1\r\nhello\r\nBATCH_V1_DONE job-1 1 1000000000\r\n';
  checkBatchStdout(framed, jobs, runs);
  for (const bad of [framed.replace('job-1 1 100', 'job-1 2 100'), `${framed}unexpected\n`]) {
    let rejected = false; try { checkBatchStdout(bad, jobs, runs); } catch { rejected = true; }
    assert(rejected, 'invalid framing author test must fail');
  }
  console.log(JSON.stringify({ status: 'PASS_ANALYZER_AUTHOR_TESTS_ONLY', filesWritten: 0, entropyDraws: 0, wars: 0 })); process.exit(0);
}
assert(args.length % 2 === 0, 'option/value pairs required');
for (let i = 0; i < args.length; i += 2) {
  assert(['--manifest-sha256', '--results-dir'].includes(args[i]) && !options.has(args[i]), 'unknown/duplicate option');
  options.set(args[i], args[i + 1]);
}
assert(/^[a-f0-9]{64}$/.test(options.get('--manifest-sha256') ?? ''),
  'usage: node analyze.mjs --manifest-sha256 <root-reviewed stress freeze hash> [--results-dir <668-config run root>]');
const expectedHash = options.get('--manifest-sha256');
const resultsDir = path.resolve(options.get('--results-dir') ?? path.join(root, 'experiments/claude-family-stress-20261001/accelerated'));
const manifestFile = path.join(here, 'frozen/manifest.json'), output = path.join(here, 'analysis.json');
assert(!fs.existsSync(output), 'refusing existing analysis');
equal(hash(manifestFile), expectedHash, 'explicit stress input manifest pin');
const m = read(manifestFile), evidence = new Map(), commands = [];
function observe(file) {
  const absolute = path.resolve(file);
  if (!evidence.has(absolute)) evidence.set(absolute, record(absolute));
  return evidence.get(absolute);
}
function checked(item) { equal(observe(item.path), { path: item.path, bytes: item.bytes, sha256: item.sha256 }, `changed evidence: ${item.path}`); }
observe(manifestFile); observe(fileURLToPath(import.meta.url));
equal(m.suite, 'claude-family-stress-20261001', 'stress suite identity');
equal(m.design, design, 'fixed bounded allocation'); equal(m.analysisPlan, analysisPlan, 'prespecified analysis');
equal(m.weights, weights, 'exact hypergeometric weights');
equal(m.configs.length, 668, '640 population and 28 physical duel configurations');
equal(m.configs.reduce((sum, c) => sum + c.executions, 0), 12000, 'complete physical battle budget');
equal(new Set(m.configs.map(c => c.id)).size, 668, 'unique config IDs');
// One integrity-only Node subprocess, never a Java/battle invocation. The
// generator reconstructs every config, its metadata, names, routing and seeds.
const verifyArgs = [path.join(here, 'generate.mjs'), '--verify', '--general-sha256', m.generalManifest.sha256];
const verify = spawnSync(process.execPath, verifyArgs, { encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
commands.push({ executable: process.execPath, args: verifyArgs, exitCode: verify.status,
  stdout: verify.stdout, stderr: verify.stderr, error: verify.error?.message ?? null });
assert(verify.status === 0 && !verify.error && !verify.stderr, 'frozen input reconstruction failed');
equal(JSON.parse(verify.stdout).status, 'VERIFIED_NO_RUNS', 'successful reconstruction status');
for (const item of m.files) checked(item);
// No partial-arm statistics: every one of the 864 physical blocks must exist
// before any candidate comparison is computed (640 population + 28*8 duels).
for (const item of m.configs) for (const file of ['result.json', 'execution-plan.json', 'execution-plan.sha256',
  'execution-started.json', 'execution-finished.json', 'batch.stdout.txt', 'batch.stderr.txt', 'jobs.nul']) {
  assert(fs.existsSync(path.join(resultsDir, item.id, file)), `incomplete study: ${item.id}/${file}`);
}

const stable = records => records.map(r => ({ path: r.path, bytes: r.bytes, sha256: r.sha256 }))
  .sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
const roster = teams => teams.map(t => t.name).sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0);
function exactFiles(folder, expectedPaths) {
  const found = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name); assert(!entry.isSymbolicLink(), 'unexpected staged symlink');
      if (entry.isDirectory()) walk(file); else { assert(entry.isFile(), 'unexpected staged special file'); found.push(file); }
    }
  }
  walk(folder); equal(found.sort(), [...expectedPaths].sort(), `unexpected/missing staged files: ${folder}`);
}
function parseScores(raw, teamNames, battles) {
  const scores = { groups: {}, warriors: {} }; let section;
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim(); if (!line) continue;
    if (line === 'Groups:') { section = 'groups'; continue; }
    if (line === 'Warriors:') { section = 'warriors'; continue; }
    const at = line.lastIndexOf(','), name = line.slice(0, at), value = Number(line.slice(at + 1));
    assert(section && at > 0 && Number.isFinite(value) && value >= 0 && value <= battles + .001 &&
      !Object.hasOwn(scores[section], name), 'invalid/duplicate/nonfinite score row');
    scores[section][name] = value;
  }
  equal(Object.keys(scores.groups).sort(), [...teamNames].sort(), 'raw group membership');
  equal(Object.keys(scores.warriors).sort(), teamNames.flatMap(n => [`${n}1`, `${n}2`]).sort(), 'raw warrior membership');
  const tolerance = Math.max(.0001, battles * .00001);
  for (const name of teamNames) assert(Math.abs(scores.groups[name] - scores.warriors[`${name}1`] - scores.warriors[`${name}2`]) <= tolerance,
    'warrior/team score conservation');
  const totalPoints = Object.values(scores.groups).reduce((s, x) => s + x, 0), missing = battles - totalPoints;
  assert(missing >= -tolerance && Math.abs(missing - Math.round(missing)) <= tolerance, 'noninteger unawarded score deficit');
  return { scores, conservation: { totalPoints, unawardedBattles: Math.round(missing), tolerance } };
}
function checkBatchStdout(raw, jobs, runs) {
  let index = 0, active = null;
  for (const line of raw.replace(/\r\n/g, '\n').split('\n')) {
    const begin = /^BATCH_V1_BEGIN ([A-Za-z0-9_.-]+)$/.exec(line);
    const done = /^BATCH_V1_DONE ([A-Za-z0-9_.-]+) (\d+) (\d+)$/.exec(line);
    if (begin) { assert(!active && jobs[index]?.id === begin[1], 'raw batch start/order'); active = []; }
    else if (done) {
      assert(active && jobs[index]?.id === done[1], 'raw batch completion/order');
      equal(Number(done[2]), jobs[index].battles, 'raw batch completion count');
      equal(`${active.join('\n')}\n`, runs[index].stdout, 'raw stdout agrees with retained per-run output');
      near(Number(done[3]) / 1e9, runs[index].elapsedSeconds, 'raw wrapper elapsed-time binding');
      index++; active = null;
    } else if (active) active.push(line); else assert(!line.trim(), 'unexpected output outside batch markers');
  }
  equal(index, jobs.length, 'all raw completion markers'); equal(active, null, 'unfinished raw output block');
}
function inspect(item) {
  const directory = path.join(resultsDir, item.id), planFile = path.join(directory, 'execution-plan.json');
  const result = read(path.join(directory, 'result.json')), plan = read(planFile), config = read(item.path);
  const started = read(path.join(directory, 'execution-started.json')), finished = read(path.join(directory, 'execution-finished.json'));
  for (const file of ['result.json', 'execution-plan.json', 'execution-plan.sha256', 'execution-started.json',
    'execution-finished.json', 'batch.stdout.txt', 'batch.stderr.txt', 'jobs.nul']) observe(path.join(directory, file));
  checked(item);
  const planHash = observe(planFile).sha256, jobsExpected = config.cohorts.length * config.seeds.length;
  equal(fs.readFileSync(path.join(directory, 'execution-plan.sha256'), 'utf8').trim(), planHash, 'plan checksum');
  equal([plan.mode, plan.output], ['isolated-persistent-serial', directory], 'isolated serial execution location');
  equal([result.schemaVersion, result.experimentId], [2, config.experimentId], 'research result schema/id');
  equal([result.configPath, result.configSha256, result.config], [item.path, item.sha256, config], 'exact result config');
  equal(plan.baseConfig, { path: item.path, sha256: item.sha256, config }, 'exact prepared config');
  equal([config.threads, config.parallel, config.telemetry], [1, false, false], 'prespecified execution settings');
  equal([result.runs.length, plan.jobs.length, result.aggregate.battles], [jobsExpected, jobsExpected, item.executions], 'complete run count');
  equal([finished.code, finished.signal, finished.failure, finished.completedJobs, finished.expectedJobs],
    [0, null, null, jobsExpected, jobsExpected], 'completed successful process');
  equal(started.planSha256, planHash, 'start record plan binding');
  equal(result.researchExecution.planSha256, planHash, 'result plan binding');
  equal(result.researchExecution.planPath, planFile, 'result plan path');
  equal(result.researchExecution.mode, plan.mode, 'actual research mode');
  equal(result.researchExecution.java, m.java, 'result Java binding');
  near(result.researchExecution.processElapsedSeconds, finished.processElapsedSeconds, 'process duration binding');
  equal(fs.readFileSync(path.join(directory, 'batch.stderr.txt'), 'utf8').trim(), '', 'unexpected process stderr');

  const runtime = m.researchRuntime, dirs = runtime.directories;
  equal(plan.java, m.java, 'reviewed Java runtime'); checked(m.java);
  equal([plan.baseEngine.source, plan.baseEngine.bytes, plan.baseEngine.sha256], [m.engine.path, m.engine.bytes, m.engine.sha256], 'original engine identity');
  equal(plan.baseEngine.target, path.join(directory, 'runtime/base-engine.jar'), 'isolated JAR path');
  equal(result.engineJar, { path: plan.baseEngine.target, sha256: m.engine.sha256 }, 'result original JAR identity');
  equal(plan.overlays.map(o => o.source), dirs.slice(1), 'exact reviewed overlay policy');
  const classpaths = dirs.map((_, i) => path.join(directory, 'runtime', i === 0 ? 'wrapper' : `overlay-${i}`));
  equal([plan.wrapper.staged, ...plan.overlays.map(o => o.staged)], classpaths, 'isolated reviewed classpaths');
  equal(plan.wrapper.mainClass, 'SerialBatchMain', 'reviewed wrapper entry');
  equal(plan.command, { executable: m.java.path, args: ['-cp', [...classpaths, plan.baseEngine.target].join(path.delimiter),
    'SerialBatchMain', path.join(directory, 'jobs.nul')] }, 'exact process command; no JVM/game overrides');
  equal(started.command, plan.command, 'actual launched command'); equal(result.researchExecution.command, plan.command, 'recorded command');
  equal(result.researchExecution.baseEngine, plan.baseEngine, 'result base engine binding');
  equal(result.researchExecution.wrapper, plan.wrapper, 'result wrapper binding');
  equal(result.researchExecution.overlays, plan.overlays, 'result overlays binding');
  const stagedRuntime = plan.frozen.filter(r => r.path.startsWith(path.join(directory, 'runtime') + path.sep));
  equal(stable(stagedRuntime.map(r => ({ ...r, path: r.source }))), stable([m.engine, ...runtime.classes]), 'only reviewed runtime inputs');
  equal(result.researchExecution.runtimeFiles, stagedRuntime, 'result runtime inventory');
  equal(stable(plan.wrapper.authoring.map(r => ({ ...r, path: r.source }))),
    stable(runtime.sources.filter(r => path.basename(r.path) !== 'audit-derived.mjs')), 'reviewed adapter authoring');
  exactFiles(path.join(directory, 'runtime'), stagedRuntime.map(r => r.path));
  for (const r of plan.frozen) {
    assert(r.path.startsWith(directory + path.sep), 'frozen file escapes prepared directory'); checked(r);
    if (r.source) equal([observe(r.source).bytes, observe(r.source).sha256], [r.bytes, r.sha256], 'original source unchanged');
  }
  for (const r of plan.sourceFiles) checked(r);
  equal(observe(path.join(directory, 'source-config.json')).sha256, item.sha256, 'staged source config bytes');
  equal(result.researchExecution.derivedConfig, plan.derivedConfig, 'derived config binding'); checked(plan.derivedConfig);
  const fields = ['CW8086-SERIAL-BATCH-V1', String(plan.jobs.length)];
  for (const job of plan.jobs) fields.push(job.id, String(job.args.length), ...job.args);
  equal(fs.readFileSync(path.join(directory, 'jobs.nul')).toString('hex'), Buffer.from(`${fields.join('\0')}\0`, 'utf8').toString('hex'), 'actual batch framing and arguments');

  let totalBattles = 0, totalPoints = 0, totalA = 0, totalB = 0;
  const ids = new Set(), summaryRuns = [];
  for (let i = 0; i < jobsExpected; i++) {
    const run = result.runs[i], job = plan.jobs[i], cohort = config.cohorts[Math.floor(i / config.seeds.length)], seed = config.seeds[i % config.seeds.length];
    const runId = `${cohort.id}__${seed}`, runFolder = path.join(directory, 'runs', runId), teams = [config.candidate, ...cohort.opponents];
    equal([job.id, job.runId, job.cohortId, job.seed, job.battles, job.folder], [`job-${i + 1}`, runId, cohort.id, seed, config.battles, runFolder], 'prepared job schedule');
    equal([run.runId, run.cohortId, run.seed, run.battles], [runId, cohort.id, seed, config.battles], 'actual run schedule');
    assert(!ids.has(runId), 'duplicate executed run'); ids.add(runId);
    equal(job.scorePath, path.join(runFolder, 'scores.csv'), 'raw score location'); equal(job.telemetryPath, null, 'unchanged telemetry policy');
    const expectedArgs = ['--headless', '--comboSize', String(teams.length), '--battlesPerCombo', String(config.battles), '--seed', seed,
      '--threads', '1', '--warriorsDir', path.join(runFolder, 'survivors'), '--zombiesDir', path.join(runFolder, 'zombies'),
      '--outputFile', job.scorePath, '--parallel=false'];
    equal(job.args, expectedArgs, 'actual engine flags, combination size and full battle count');
    equal(run.engineArguments, job.args, 'retained engine arguments'); equal(run.command, plan.command, 'retained process command');
    equal(run.execution, { planSha256: planHash, jobId: job.id, baseConfigSha256: item.sha256, researchMode: plan.mode }, 'per-run provenance');
    equal(run.inputs, job.inputs, 'staged input records'); equal(run.zombies, job.zombies, 'staged Zombie records');
    equal(Object.keys(job.inputs).sort(), teams.map(t => t.name).sort(), 'exact team membership');
    const expectedInputs = [];
    for (const team of teams) {
      equal(job.inputs[team.name].length, 2, 'two original team components');
      for (let side = 0; side < 2; side++) {
        const input = job.inputs[team.name][side], source = team.warriors[side], target = path.join(runFolder, 'survivors', `${team.name}${side + 1}`);
        const identity = observe(source);
        equal(input, { source, target, bytes: identity.bytes, sha256: identity.sha256 }, 'exact A/B binary-to-name mapping');
        equal(observe(target), { path: target, bytes: identity.bytes, sha256: identity.sha256 }, 'actual staged warrior bytes'); expectedInputs.push(target);
      }
    }
    exactFiles(path.join(runFolder, 'survivors'), expectedInputs);
    const expectedZombies = config.zombies.map(z => { const r = observe(z.path); return { name: z.name, source: z.path,
      target: path.join(runFolder, 'zombies', z.name), bytes: r.bytes, sha256: r.sha256 }; });
    equal(job.zombies, expectedZombies, 'exact Zombie identities/order');
    for (const z of expectedZombies) equal(observe(z.target), { path: z.target, bytes: z.bytes, sha256: z.sha256 }, 'actual staged Zombie bytes');
    exactFiles(path.join(runFolder, 'zombies'), expectedZombies.map(z => z.target));
    equal(fs.readdirSync(path.join(runFolder, 'zombies')), job.zombieDirectoryEntries, 'preserved unsorted Zombie enumeration');
    const raw = fs.readFileSync(job.scorePath, 'utf8'); observe(job.scorePath);
    equal(raw, run.rawScoreText, 'retained raw CSV text'); equal(observe(job.scorePath), run.scoreFile, 'retained raw CSV hash');
    const { scores, conservation } = parseScores(raw, teams.map(t => t.name), config.battles);
    equal(scores, run.scores, 'scores reparsed from raw CSV'); equal(conservation, run.conservation, 'recomputed score conservation');
    equal(run.telemetry, null, 'no undeclared telemetry');
    const name = config.candidate.name, points = scores.groups[name];
    equal(run.candidate, { teamRaw: points, teamPerBattle: points / config.battles,
      warrior1Raw: scores.warriors[`${name}1`], warrior1PerBattle: scores.warriors[`${name}1`] / config.battles,
      warrior2Raw: scores.warriors[`${name}2`], warrior2PerBattle: scores.warriors[`${name}2`] / config.battles }, 'candidate score normalization');
    const starts = [...run.stdout.matchAll(/^Starting competition \((\d+) wars\)\.$/gm)].map(x => Number(x[1]));
    const ends = [...run.stdout.matchAll(/^Competition is over\. Ran (\d+) wars$/gm)].map(x => Number(x[1]));
    equal(starts, [config.battles], 'actual engine starts'); equal(ends, [config.battles], 'actual engine completions');
    equal([...run.stdout.matchAll(/^Loaded warriors: (.+)$/gm)].map(x => x[1]), [`[${roster(teams).join(', ')}]`], 'actual loaded survivor names');
    const runFile = path.join(runFolder, 'run.json'); observe(runFile); equal(read(runFile), run, 'per-run record unchanged');
    totalBattles += config.battles; totalPoints += points; totalA += run.candidate.warrior1Raw; totalB += run.candidate.warrior2Raw;
    summaryRuns.push({ seed, cohortId: cohort.id, battles: config.battles, groupPoints: scores.groups, warriorPoints: scores.warriors,
      opponentIdentities: cohort.opponents.map(t => ({ name: t.name, sha256: job.inputs[t.name].map(r => r.sha256) })),
      zombieIdentities: expectedZombies.map(z => ({ name: z.name, sha256: z.sha256 })),
      candidateName: name, candidateHashes: job.inputs[name].map(r => r.sha256), unawardedBattles: conservation.unawardedBattles });
  }
  equal(result.aggregate, { battles: totalBattles, teamPerBattle: totalPoints / totalBattles,
    warrior1PerBattle: totalA / totalBattles, warrior2PerBattle: totalB / totalBattles }, 'fully reconstructed aggregate');
  checkBatchStdout(fs.readFileSync(path.join(directory, 'batch.stdout.txt'), 'utf8'), plan.jobs, result.runs);
  return { id: item.id, kind: item.kind, config, runs: summaryRuns, planSha256: planHash, resultSha256: observe(path.join(directory, 'result.json')).sha256,
    executionCount: totalBattles, processElapsedSeconds: finished.processElapsedSeconds };
}

const audited = new Map(m.configs.map(item => [item.id, inspect(item)]));
equal([...audited.values()].reduce((s, a) => s + a.executionCount, 0), 12000, 'all physical executions audited');
equal([...audited.values()].reduce((s, a) => s + a.runs.length, 0), 864, '640 population plus 224 duel blocks audited');
const probability = weights.map(w => w.probability), baseline = [1, 0, 0, 0], densityCoefficients = probability.map((p, k) => p - baseline[k]);
const populationSamples = Object.fromEntries(arms.map(arm => [arm, m.schedule.map(c => {
  const oriented = candidateNames.map((name, orientation) => {
    const id = `population-${c.id}-${arm}-o${orientation + 1}`, result = audited.get(id); assert(result, 'missing population cell');
    equal(result.runs.length, 1, 'one population seed block per cell');
    const r = result.runs[0]; equal(r.candidateHashes, m.expectedHashes[arm], 'population actual contender identity');
    equal([r.seed, r.cohortId, r.candidateName, r.battles], [m.randomness.population[c.id], c.id, name, 10], 'population analysis mapping');
    return { orientation, name, seed: r.seed, points: r.groupPoints[name] / r.battles,
      warrior1: r.warriorPoints[`${name}1`] / r.battles, warrior2: r.warriorPoints[`${name}2`] / r.battles };
  });
  return { cohortId: c.id, k: c.k, publicNames: c.publicNames, counterNames: c.counterNames, oriented,
    points: mean(oriented.map(o => o.points)), warrior1: mean(oriented.map(o => o.warrior1)), warrior2: mean(oriented.map(o => o.warrior2)) };
})]));
const conditional = samples => [0, 1, 2, 3].map(k => {
  const list = samples.filter(s => s.k === k); equal(list.length, 20, 'twenty cohort clusters, not forty aliases');
  return { k, candidateAppearances: 400, ...summarize(list.map(s => s.points), analysisPlan.populationCritical95),
    meanWarrior1Points: mean(list.map(s => s.warrior1)), meanWarrior2Points: mean(list.map(s => s.warrior2)),
    byOrientation: candidateNames.map((name, i) => ({ name, mean: mean(list.map(s => s.oriented[i].points)) })),
    orientationDifference: summarize(list.map(s => s.oriented[1].points - s.oriented[0].points), analysisPlan.populationCritical95) };
});
const population = arms.map(arm => {
  const strata = conditional(populationSamples[arm]);
  const scenario0 = weightedSummary(strata, baseline, analysisPlan.populationCritical95);
  const scenario5 = weightedSummary(strata, probability, analysisPlan.populationCritical95);
  return { arm, strata, scenario0, scenario5,
    densityChange: weightedSummary(strata, densityCoefficients, analysisPlan.populationCritical95),
    expectedPointsPerUnconditionedBattle: { scenario0: scenario0.mean * 4 / 76, scenario5: scenario5.mean * 4 / 81,
      warning: 'Denominators differ; not a tournament rank prediction.' },
    byOrientation: candidateNames.map((name, i) => ({ name,
      scenario0: strata[0].byOrientation[i].mean,
      scenario5: strata.reduce((s, row, k) => s + probability[k] * row.byOrientation[i].mean, 0) })),
    scenario5OrientationDifference: weightedSummary(strata.map(s => s.orientationDifference), probability, analysisPlan.populationCritical95),
    samples: populationSamples[arm] };
});

const populationComparisons = analysisPlan.contrasts.map(([candidate, reference]) => {
  const differences = populationSamples[candidate].map((sample, i) => {
    const control = populationSamples[reference][i]; equal([sample.cohortId, sample.k], [control.cohortId, control.k], 'paired population sample IDs');
    for (const orientation of [0, 1]) {
      const a = audited.get(`population-${sample.cohortId}-${candidate}-o${orientation + 1}`).runs[0];
      const b = audited.get(`population-${sample.cohortId}-${reference}-o${orientation + 1}`).runs[0];
      equal([a.seed, a.candidateName, a.opponentIdentities, a.zombieIdentities], [b.seed, b.candidateName, b.opponentIdentities, b.zombieIdentities],
        'paired seed, exact names, opposing bytes and Zombies');
    }
    return { ...sample, points: sample.points - control.points, warrior1: sample.warrior1 - control.warrior1, warrior2: sample.warrior2 - control.warrior2,
      oriented: sample.oriented.map((o, orientation) => ({ ...o, points: o.points - control.oriented[orientation].points })) };
  });
  const strata = conditional(differences);
  const scenario0 = weightedSummary(strata, baseline, analysisPlan.populationCritical95), scenario5 = weightedSummary(strata, probability, analysisPlan.populationCritical95);
  const ref = population.find(p => p.arm === reference), cand = population.find(p => p.arm === candidate);
  near(scenario0.mean, cand.scenario0.mean - ref.scenario0.mean, 'paired baseline delta agreement');
  near(scenario5.mean, cand.scenario5.mean - ref.scenario5.mean, 'paired natural-density delta agreement');
  return { candidate, reference, strata, scenario0, scenario5,
    relativePercent: { scenario0: ref.scenario0.mean > 0 ? 100 * scenario0.mean / ref.scenario0.mean : null,
      scenario5: ref.scenario5.mean > 0 ? 100 * scenario5.mean / ref.scenario5.mean : null },
    changeInRelativeAdvantage: weightedSummary(strata, densityCoefficients, analysisPlan.populationCritical95),
    byOrientation: candidateNames.map((name, i) => ({ name, scenario0: strata[0].byOrientation[i].mean,
      scenario5: strata.reduce((s, row, k) => s + probability[k] * row.byOrientation[i].mean, 0) })) };
});

const duels = arms.flatMap(candidate => duelOpponents.map(opponent => {
  const mapping = m.logicalDuels.filter(d => d.candidate === candidate && d.opponent === opponent).sort((a, b) => a.orientation - b.orientation);
  equal(mapping.map(d => d.orientation), [0, 1], 'two logical orientations per duel');
  const bySeed = m.randomness.duel.map((seed, i) => {
    const orientations = mapping.map(d => {
      const physical = audited.get(d.physicalId); assert(physical, 'missing physical duel');
      const run = physical.runs[i], teams = [physical.config.candidate, ...physical.config.cohorts[0].opponents];
      equal([run.seed, run.battles], [seed, 25], 'duel seed index');
      for (const [name, variant] of [[d.candidateName, candidate], [d.opponentName, opponent]]) {
        const team = teams.find(t => t.name === name); assert(team, 'duel score column absent from actual config');
        equal(team.warriors.map(file => observe(file).sha256), m.expectedHashes[variant], 'duel column follows actual binary, not display/config candidate');
      }
      return { orientation: d.orientation, physicalId: d.physicalId, candidateName: d.candidateName, opponentName: d.opponentName,
        candidatePoints: run.groupPoints[d.candidateName] / 25, opponentPoints: run.groupPoints[d.opponentName] / 25,
        unawardedBattles: run.unawardedBattles };
    });
    return { seed, orientations, candidatePoints: mean(orientations.map(o => o.candidatePoints)),
      opponentPoints: mean(orientations.map(o => o.opponentPoints)),
      delta: mean(orientations.map(o => o.candidatePoints - o.opponentPoints)) };
  });
  const candidateScore = summarize(bySeed.map(s => s.candidatePoints), analysisPlan.duelCritical95);
  const opponentScore = summarize(bySeed.map(s => s.opponentPoints), analysisPlan.duelCritical95);
  const netScore = summarize(bySeed.map(s => s.delta), analysisPlan.duelCritical95);
  near(netScore.mean, candidateScore.mean - opponentScore.mean, 'duel net-score agreement');
  return { candidate, opponent, selfDuel: candidate === opponent, logicalAppearances: 400,
    physicalConfigurationsReferenced: [...new Set(mapping.map(d => d.physicalId))],
    candidateScore, opponentScore, netScore, bySeed,
    byOrientation: [0, 1].map(i => ({ orientation: i, candidateName: mapping[i].candidateName,
      candidatePoints: mean(bySeed.map(s => s.orientations[i].candidatePoints)), opponentPoints: mean(bySeed.map(s => s.orientations[i].opponentPoints)) })),
    orientationDifference: summarize(bySeed.map(s => s.orientations[1].candidatePoints - s.orientations[0].candidatePoints), analysisPlan.duelCritical95) };
}));
equal(duels.length, 16, 'all sixteen requested logical matchups');
for (const item of evidence.values()) equal(record(item.path), item, 'evidence changed during analysis');
const result = { status: 'COMPLETE_AUDITED_DESCRIPTIVE_STRESS', recordedAt: new Date().toISOString(), manifestSha256: expectedHash,
  resultsDir, design, analysisPlan, weights, physicalExecutions: 12000, populationExecutions: 6400, physicalDuelExecutions: 5600,
  logicalDuelExecutions: 6400, auditedPhysicalConfigs: 668, auditedPhysicalBlocks: 864,
  population, populationComparisons, duels,
  integrity: [...audited.values()].map(({ config, runs, ...summary }) => summary),
  limitations: ['Hypothetical mixed five-entry family, not worst-case five identical counters or actual 2026 rules.',
    'Natural scenario uses hypergeometric weighting; oversampled K strata are not averaged equally.',
    'Both name positions share one cluster; reused/mirrored duel records are not independent evidence.',
    'Approximate nominal intervals, not multiple-comparison-adjusted guarantees or proof of immunity.',
    'Validated accelerated research lane, not a new original-engine replay of these stress cases.',
    'No ranking prediction, automatic promotion, broad-generalization claim or final replacement.'],
  commands, files: [...evidence.values()] };
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output, sha256: hash(output), status: result.status,
  population: population.map(p => ({ arm: p.arm, scenario0: p.scenario0.mean, scenario5: p.scenario5.mean, densityChange: p.densityChange.mean })),
  comparisons: populationComparisons.map(c => ({ candidate: c.candidate, reference: c.reference,
    scenario0: c.scenario0, scenario5: c.scenario5 })),
  duels: duels.map(d => ({ candidate: d.candidate, opponent: d.opponent, candidatePoints: d.candidateScore.mean,
    opponentPoints: d.opponentScore.mean, netScore: d.netScore })) }));
