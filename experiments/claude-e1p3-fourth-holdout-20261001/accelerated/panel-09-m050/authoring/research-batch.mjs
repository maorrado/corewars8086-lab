import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { encodeBatch } from './batch-format.mjs';

// Separate research executor, not a replacement for official-benchmark.mjs.
const self = fileURLToPath(import.meta.url);
const here = path.dirname(self);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const hash = file => sha(fs.readFileSync(file));
const safe = value => value.replace(/[^A-Za-z0-9_.-]/g, '_');
const fail = message => { throw new Error(message); };
const write = (file, bytes) => fs.writeFileSync(file, bytes, { flag: 'wx' });
const json = (file, value) => write(file, `${JSON.stringify(value, null, 2)}\n`);
const identify = file => ({ path: path.resolve(file), bytes: fs.statSync(file).size, sha256: hash(file) });
const same = (file, expected) => {
  if (!fs.statSync(file).isFile() || fs.statSync(file).size !== expected.bytes || hash(file) !== expected.sha256) fail(`input changed: ${file}`);
};

function classFiles(directory) {
  const found = [];
  function walk(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isSymbolicLink()) fail(`class directory contains symlink: ${file}`);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile() && entry.name.endsWith('.class')) found.push(file);
      else fail(`class directories must contain only classes: ${file}`);
    }
  }
  walk(directory);
  if (!found.length) fail(`empty class directory: ${directory}`);
  return found.sort();
}

function prepare(configFile, destination, options) {
  const sourcePath = path.resolve(configFile);
  const configBytes = fs.readFileSync(sourcePath);
  const config = JSON.parse(configBytes);
  const resolve = file => path.resolve(path.dirname(sourcePath), file);
  if (config.threads !== 1 || config.parallel !== false) fail('source config must explicitly use threads=1 and parallel=false; no silent execution-mode conversion');
  if (!Number.isInteger(config.battles) || config.battles < 1) fail('positive integer battles required');
  if (!Array.isArray(config.cohorts) || !config.cohorts.length || !Array.isArray(config.seeds) || !config.seeds.length
      || config.seeds.some(seed => typeof seed !== 'string' || seed.includes('\0'))) fail('cohorts and string seeds required');
  if (!Array.isArray(config.zombies)) fail('zombies array required');
  const overlays = [], jvmOptions = [];
  for (let index = 0; index < options.length; index += 2) {
    if (!options[index + 1]) fail('option requires value');
    if (options[index] === '--overlay') overlays.push(path.resolve(options[index + 1]));
    else if (options[index] === '--jvm-option') {
      const value = options[index + 1];
      // Reject classpath, agents, system-property and executable overrides.
      if (!/^-X(?:ms\d+[kKmMgG]?|mx\d+[kKmMgG]?|X:(?:\+UseSerialGC|CICompilerCount=\d+|TieredStopAtLevel=[1-4]))$/.test(value)) fail(`unsupported experimental JVM option: ${value}`);
      jvmOptions.push(value);
    } else fail(`unknown option: ${options[index]}`);
  }
  const java = resolve(config.java ?? 'tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe');
  const jar = resolve(config.jar ?? 'repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar');
  const output = path.resolve(destination);
  if (fs.existsSync(output)) fail(`refusing existing output directory: ${output}`);
  const classSources = [path.join(here, 'classes'), ...overlays];
  const classLists = classSources.map(classFiles);
  const classNames = new Set();
  for (let group = 0; group < classSources.length; group++) for (const file of classLists[group]) {
    const name = path.relative(classSources[group], file).toLowerCase();
    if (classNames.has(name)) fail(`overlapping wrapper/overlay class: ${name}`);
    classNames.add(name);
  }
  if (!classLists[0].some(file => path.basename(file) === 'SerialBatchMain.class')) fail('compiled SerialBatchMain is missing');
  // All engine inputs are copied before the first JVM. Outputs never use the
  // original config's outputPath or runDirectory.
  fs.mkdirSync(output, { recursive: true });
  const frozen = [], sources = new Map();
  function snapshot(source, target) {
    const identity = sources.get(source) ?? identify(source);
    sources.set(source, identity);
    same(source, identity);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
    same(target, identity);
    frozen.push({ ...identity, path: target, source });
    return { source, target, bytes: identity.bytes, sha256: identity.sha256 };
  }
  write(path.join(output, 'source-config.json'), configBytes);
  frozen.push(identify(path.join(output, 'source-config.json')));
  const baseJar = snapshot(jar, path.join(output, 'runtime', 'base-engine.jar'));
  const classpath = classSources.map((source, index) => {
    const target = path.join(output, 'runtime', index === 0 ? 'wrapper' : `overlay-${index}`);
    for (const file of classLists[index]) snapshot(file, path.join(target, path.relative(source, file)));
    return target;
  });
  const authoring = [self, path.join(here, 'batch-format.mjs'), path.join(here, 'SerialBatchMain.java')]
    .map(file => snapshot(file, path.join(output, 'authoring', path.basename(file))));
  const jobs = [], ids = new Set();
  for (const cohort of config.cohorts) {
    if (typeof cohort.id !== 'string' || !Array.isArray(cohort.opponents) || cohort.opponents.length < 1 || cohort.opponents.length > 3) fail('each cohort requires id and one to three opponents');
    for (const seed of config.seeds) {
      const runId = `${safe(cohort.id)}__${safe(seed)}`;
      if (ids.has(runId)) fail(`duplicate staged run ID: ${runId}`);
      ids.add(runId);
      const folder = path.join(output, 'runs', runId);
      const survivors = path.join(folder, 'survivors'), zombies = path.join(folder, 'zombies');
      fs.mkdirSync(survivors, { recursive: true });
      fs.mkdirSync(zombies);
      const inputs = {}, names = new Set();
      for (const team of [config.candidate, ...cohort.opponents]) {
        if (typeof team?.name !== 'string' || !Array.isArray(team.warriors) || team.warriors.length !== 2) fail('each team requires name and two warriors');
        const name = safe(team.name);
        if (!name || name.includes('.') || names.has(name.toLowerCase())) fail(`unsafe/colliding staged team name: ${name}`);
        names.add(name.toLowerCase());
        inputs[team.name] = team.warriors.map((file, index) => snapshot(resolve(file), path.join(survivors, `${name}${index + 1}`)));
      }
      const zombieNames = new Set();
      const zombieInputs = config.zombies.map(zombie => {
        const name = safe(zombie.name);
        if (!name || zombieNames.has(name.toLowerCase())) fail(`duplicate/empty zombie name: ${name}`);
        zombieNames.add(name.toLowerCase());
        return { name: zombie.name, ...snapshot(resolve(zombie.path), path.join(zombies, name)) };
      });
      const scorePath = path.join(folder, 'scores.csv');
      const telemetryPath = config.telemetry ? path.join(folder, 'telemetry.csv') : null;
      const args = ['--headless', '--comboSize', String(1 + cohort.opponents.length), '--battlesPerCombo', String(config.battles),
        '--seed', seed, '--threads', '1', '--warriorsDir', survivors, '--zombiesDir', zombies, '--outputFile', scorePath, '--parallel=false'];
      if (telemetryPath) args.push('--telemetryFile', telemetryPath);
      jobs.push({ id: `job-${jobs.length + 1}`, runId, cohortId: cohort.id, seed, battles: config.battles, folder, inputs, zombies: zombieInputs,
        zombieDirectoryEntries: fs.readdirSync(zombies), scorePath, telemetryPath, args });
    }
  }
  const batchFile = path.join(output, 'jobs.nul');
  write(batchFile, encodeBatch(jobs));
  frozen.push(identify(batchFile));
  const derived = { ...config, java, jar: baseJar.target, outputPath: path.join(output, 'result.json'), runDirectory: path.join(output, 'runs'),
    candidate: { ...config.candidate, warriors: config.candidate.warriors.map(resolve) },
    cohorts: config.cohorts.map(cohort => ({ ...cohort, opponents: cohort.opponents.map(team => ({ ...team, warriors: team.warriors.map(resolve) })) })),
    zombies: config.zombies.map(zombie => ({ ...zombie, path: resolve(zombie.path) })),
    researchExecution: { mode: 'isolated-persistent-serial', plan: path.join(output, 'execution-plan.json'), authoritativeInputs: 'per-job frozen staged files in execution-plan.json' } };
  json(path.join(output, 'derived-config.json'), derived);
  frozen.push(identify(path.join(output, 'derived-config.json')));
  for (const source of sources.values()) same(source.path, source);
  if (hash(sourcePath) !== sha(configBytes)) fail('source config changed during preparation');
  const plan = { schemaVersion: 1, mode: 'isolated-persistent-serial', createdAt: new Date().toISOString(), output,
    baseConfig: { path: sourcePath, sha256: sha(configBytes), config }, derivedConfig: identify(path.join(output, 'derived-config.json')),
    java: identify(java), baseEngine: baseJar, overlays: overlays.map((source, index) => ({ source, staged: classpath[index + 1] })),
    wrapper: { mainClass: 'SerialBatchMain', staged: classpath[0], authoring }, frozen, sourceFiles: [...sources.values()], jobs,
    command: { executable: java, args: [...jvmOptions, '-cp', [...classpath, baseJar.target].join(path.delimiter), 'SerialBatchMain', batchFile] },
    conventions: { order: 'original cohort-major, seed-minor order, one synchronous fresh Competition/Options/Repository per block',
      timing: 'per-job elapsedSeconds is in-JVM wrapper time; processElapsedSeconds includes JVM startup and shutdown; do not compare the two as equal quantities',
      zombies: 'copied in original config order without renaming beyond official safeName; directory listing captured; engine itself retains its unsorted enumeration' } };
  const planFile = path.join(output, 'execution-plan.json');
  json(planFile, plan);
  write(path.join(output, 'execution-plan.sha256'), `${hash(planFile)}\n`);
  console.log(JSON.stringify({ prepared: output, jobs: jobs.length, battles: jobs.length * config.battles, planSha256: hash(planFile), command: `node "${self}" run "${output}"` }));
}

function parseScores(text) {
  const scores = { groups: {}, warriors: {} };
  let section;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line === 'Groups:') { section = 'groups'; continue; }
    if (line === 'Warriors:') { section = 'warriors'; continue; }
    const separator = line.lastIndexOf(',');
    const name = line.slice(0, separator), value = Number(line.slice(separator + 1));
    if (!section || separator < 1 || Object.hasOwn(scores[section], name) || !Number.isFinite(value) || value < 0) fail(`invalid score row: ${line}`);
    scores[section][name] = value;
  }
  return scores;
}

function validateScores(scores, job) {
  const groups = Object.keys(job.inputs).map(safe).sort();
  const warriors = groups.flatMap(name => [`${name}1`, `${name}2`]).sort();
  if (JSON.stringify(Object.keys(scores.groups).sort()) !== JSON.stringify(groups)
      || JSON.stringify(Object.keys(scores.warriors).sort()) !== JSON.stringify(warriors)) fail(`score identities differ: ${job.id}`);
  const tolerance = Math.max(0.0001, job.battles * 0.00001);
  for (const name of groups) if (Math.abs(scores.groups[name] - scores.warriors[`${name}1`] - scores.warriors[`${name}2`]) > tolerance) fail(`warrior/group sum differs: ${job.id}`);
  const total = Object.values(scores.groups).reduce((sum, value) => sum + value, 0);
  const missing = job.battles - total;
  // Some engine end states award no points. Each completed battle awards one
  // point or zero, so integer deficits are legitimate, not shortened runs.
  if (missing < -tolerance || Math.abs(missing - Math.round(missing)) > tolerance) fail(`score conservation failure: ${job.id}`);
  return { totalPoints: total, unawardedBattles: Math.round(missing), tolerance };
}

async function run(directory) {
  const output = path.resolve(directory), planFile = path.join(output, 'execution-plan.json');
  const expectedPlanHash = fs.readFileSync(path.join(output, 'execution-plan.sha256'), 'utf8').trim();
  if (hash(planFile) !== expectedPlanHash) fail('execution plan hash mismatch');
  const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
  if (plan.output !== output || plan.mode !== 'isolated-persistent-serial') fail('plan root/mode mismatch; prepared directories are not movable');
  const adapter = plan.wrapper.authoring.find(file => path.basename(file.source) === 'research-batch.mjs');
  if (!adapter || hash(self) !== adapter.sha256) fail('adapter version changed since preparation');
  same(plan.java.path, plan.java);
  for (const item of plan.frozen) same(item.path, item);
  for (const job of plan.jobs) {
    if (fs.existsSync(job.scorePath) || (job.telemetryPath && fs.existsSync(job.telemetryPath)) || fs.existsSync(path.join(job.folder, 'run.json'))) fail(`job already has output: ${job.id}`);
    const actual = fs.readdirSync(path.dirname(job.zombies[0]?.target ?? path.join(job.folder, 'zombies', '_')));
    if (JSON.stringify(actual) !== JSON.stringify(job.zombieDirectoryEntries)) fail(`Zombie directory enumeration changed: ${job.id}`);
  }
  json(path.join(output, 'execution-started.json'), { startedAt: new Date().toISOString(), planSha256: expectedPlanHash, command: plan.command });
  const stdoutFd = fs.openSync(path.join(output, 'batch.stdout.txt'), 'wx');
  const stderrFd = fs.openSync(path.join(output, 'batch.stderr.txt'), 'wx');
  const runs = [], started = process.hrtime.bigint();
  let partial = '', active = null, streamError = null, stderrError = false;
  const child = spawn(plan.command.executable, plan.command.args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  function consume(line) {
    const begin = /^BATCH_V1_BEGIN ([A-Za-z0-9_.-]+)$/.exec(line);
    if (begin) {
      const job = plan.jobs[runs.length];
      if (active || !job || job.id !== begin[1]) fail('unexpected batch start/order');
      active = { job, startedAt: new Date().toISOString(), lines: [] };
      return;
    }
    const done = /^BATCH_V1_DONE ([A-Za-z0-9_.-]+) (\d+) (\d+)$/.exec(line);
    if (!done) { if (active) active.lines.push(line); else if (line.trim()) fail(`unexpected batch output: ${line}`); return; }
    if (!active || active.job.id !== done[1] || Number(done[2]) !== active.job.battles) fail('unexpected batch completion/count');
    const { job } = active, stdout = `${active.lines.join('\n')}\n`;
    const starts = [...stdout.matchAll(/^Starting competition \((\d+) wars\)\.$/gm)];
    const ends = [...stdout.matchAll(/^Competition is over\. Ran (\d+) wars$/gm)];
    if (starts.length !== 1 || ends.length !== 1 || Number(starts[0][1]) !== job.battles || Number(ends[0][1]) !== job.battles) fail(`actual battle-count mismatch: ${job.id}`);
    for (const input of [...Object.values(job.inputs).flat(), ...job.zombies]) same(input.target, input);
    const rawScoreText = fs.readFileSync(job.scorePath, 'utf8'), scores = parseScores(rawScoreText);
    const conservation = validateScores(scores, job), name = safe(plan.baseConfig.config.candidate.name);
    const candidate = { teamRaw: scores.groups[name], teamPerBattle: scores.groups[name] / job.battles,
      warrior1Raw: scores.warriors[`${name}1`], warrior1PerBattle: scores.warriors[`${name}1`] / job.battles,
      warrior2Raw: scores.warriors[`${name}2`], warrior2PerBattle: scores.warriors[`${name}2`] / job.battles };
    const record = { runId: job.runId, cohortId: job.cohortId, seed: job.seed, battles: job.battles, startedAt: active.startedAt,
      elapsedSeconds: Number(done[3]) / 1e9, elapsedConvention: 'in-JVM wrapper job, not a cold process', command: plan.command, engineArguments: job.args,
      inputs: job.inputs, zombies: job.zombies, scores, candidate, rawScoreText, stdout, conservation,
      scoreFile: identify(job.scorePath), telemetry: job.telemetryPath ? identify(job.telemetryPath) : null,
      execution: { planSha256: expectedPlanHash, jobId: job.id, baseConfigSha256: plan.baseConfig.sha256, researchMode: plan.mode } };
    json(path.join(job.folder, 'run.json'), record);
    runs.push(record);
    active = null;
    console.log(`${job.runId}: team=${candidate.teamPerBattle.toFixed(6)} (${record.elapsedSeconds.toFixed(2)}s in JVM)`);
  }
  child.stdout.on('data', chunk => {
    fs.writeSync(stdoutFd, chunk);
    if (streamError) return;
    try {
      partial += chunk;
      let newline;
      while ((newline = partial.indexOf('\n')) >= 0) {
        consume(partial.slice(0, newline).replace(/\r$/, ''));
        partial = partial.slice(newline + 1);
      }
    } catch (error) { streamError = error; child.kill(); }
  });
  child.stderr.on('data', chunk => { fs.writeSync(stderrFd, chunk); if (/Exception|Error:/.test(chunk)) stderrError = true; });
  const status = await new Promise(resolve => {
    child.on('error', error => { streamError ??= error; });
    child.on('close', (code, signal) => resolve({ code, signal }));
  });
  fs.closeSync(stdoutFd); fs.closeSync(stderrFd);
  const processElapsedSeconds = Number(process.hrtime.bigint() - started) / 1e9;
  const failure = streamError?.message ?? (status.code !== 0 || stderrError || partial.trim() || active || runs.length !== plan.jobs.length ? 'incomplete/error batch process' : null);
  json(path.join(output, 'execution-finished.json'), { ...status, finishedAt: new Date().toISOString(), processElapsedSeconds, completedJobs: runs.length, expectedJobs: plan.jobs.length, failure });
  if (failure) fail(`${failure}; all logs and completed run records preserved at ${output}`);
  for (const item of plan.frozen) same(item.path, item);
  const battles = runs.reduce((sum, record) => sum + record.battles, 0);
  const aggregate = { battles, teamPerBattle: runs.reduce((sum, record) => sum + record.candidate.teamRaw, 0) / battles,
    warrior1PerBattle: runs.reduce((sum, record) => sum + record.candidate.warrior1Raw, 0) / battles,
    warrior2PerBattle: runs.reduce((sum, record) => sum + record.candidate.warrior2Raw, 0) / battles };
  const result = { schemaVersion: 2, experimentId: plan.baseConfig.config.experimentId, generatedAt: new Date().toISOString(),
    configPath: plan.baseConfig.path, configSha256: plan.baseConfig.sha256, config: plan.baseConfig.config,
    engineJar: { path: plan.baseEngine.target, sha256: plan.baseEngine.sha256 },
    researchExecution: { mode: plan.mode, planPath: planFile, planSha256: expectedPlanHash, baseEngine: plan.baseEngine,
      wrapper: plan.wrapper, overlays: plan.overlays, runtimeFiles: plan.frozen.filter(item => item.path.startsWith(path.join(output, 'runtime') + path.sep)),
      derivedConfig: plan.derivedConfig, java: plan.java, command: plan.command, processElapsedSeconds,
      disclaimer: 'Isolated research lane with persistent JVM/optional class overlay; not an official cold-engine result or a replacement for final original-engine validation.' },
    aggregate, runs };
  json(path.join(output, 'result.json'), result);
  console.log(JSON.stringify({ output: path.join(output, 'result.json'), planSha256: expectedPlanHash, aggregate, processElapsedSeconds }));
}

const [mode, first, second, ...options] = process.argv.slice(2);
if (mode === 'prepare' && first && second) prepare(first, second, options);
else if (mode === 'run' && first && second === undefined) await run(first);
else fail('usage: node research-batch.mjs prepare <original-config.json> <NEW-output-directory> [--overlay <classes>] [--jvm-option <flag>] | run <prepared-directory>');
