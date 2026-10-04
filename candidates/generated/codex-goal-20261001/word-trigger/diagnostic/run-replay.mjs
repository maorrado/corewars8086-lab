import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

// Execution is intentional only when root invokes this after reviewing the plan.
// No alternate plan/command arguments or runtime overlays are accepted.
if (process.argv.length !== 2) throw new Error('usage: node run-replay.mjs');
const here = import.meta.dirname;
const planPath = path.join(here, 'replay-plan-reviewed.json');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const record = file => ({ path: file, sha256: hash(file), bytes: fs.statSync(file).size });
const planRecord = record(planPath);
const plan = JSON.parse(fs.readFileSync(planPath));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const verifyRecords = () => {
  assert(hash(planPath) === planRecord.sha256, 'Reviewed plan changed during replay');
  for (const item of [plan.originalPlan, plan.supersededSource, plan.originalBuilder, plan.metadata,
    plan.engineJar, plan.baselineScores, plan.baselineTelemetry, plan.source, plan.builder, plan.launcher,
    plan.runtime, plan.compiler, ...plan.inputs, ...plan.originalCompiledClasses, ...plan.compiledClasses]) {
    assert(fs.statSync(item.path).isFile() && fs.statSync(item.path).size === item.bytes
      && hash(item.path) === item.sha256, `Frozen record changed: ${item.path}`);
  }
};
verifyRecords();
assert(plan.launcher.path === import.meta.filename, 'Wrong launcher path');
assert(plan.engineJar.sha256 === '31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d', 'Wrong engine JAR');
assert(plan.expectedWars === 50 && plan.baselineJobId === 'baseline-r1-forward-median', 'Wrong baseline fixture');
assert(plan.classesDirectory === path.join(here, 'reviewed-classes'), 'Unexpected reviewed class directory');
assert(plan.outputDirectory === path.join(here, 'replay-reviewed'), 'Unexpected replay directory');
assert(plan.compiledClasses.length === 1 && path.basename(plan.compiledClasses[0].path) === 'DeathDiagnosticMain.class', 'Unexpected compiled classes');
assert(plan.compiledClasses[0].path === path.join(plan.classesDirectory, 'DeathDiagnosticMain.class'), 'Wrong compiled class path');
assert(JSON.stringify(fs.readdirSync(plan.classesDirectory)) === JSON.stringify(['DeathDiagnosticMain.class']), 'Unexpected classpath content');
const oldPlan = JSON.parse(fs.readFileSync(plan.originalPlan.path));
assert(plan.supersededSource.sha256 === oldPlan.source.sha256, 'Original source archive mismatch');
const metadata = JSON.parse(fs.readFileSync(plan.metadata.path));
const job = metadata.jobs.find(job => job.id === plan.baselineJobId);
assert(job && job.battles === 50 && job.seed === plan.seed, 'Archived fixture mismatch');
assert(JSON.stringify(job.inputs.map(({ path, sha256 }) => ({ path, sha256 })))
  === JSON.stringify(plan.inputs.map(({ path, sha256 }) => ({ path, sha256 }))), 'Archived input set mismatch');
assert(job.scoreSha256 === plan.baselineScores.sha256 && job.telemetrySha256 === plan.baselineTelemetry.sha256, 'Archived output hashes mismatch');
const jarIndex = job.command.args.indexOf('-jar');
assert(jarIndex === 0 && job.command.args[1] === plan.engineJar.path, 'Unexpected original command');
const originalArgs = job.command.args.slice(2);
const value = (args, flag) => args[args.indexOf(flag) + 1];
assert(value(originalArgs, '--outputFile') === plan.baselineScores.path
  && value(originalArgs, '--telemetryFile') === plan.baselineTelemetry.path, 'Archived CSV path mismatch');
const expectedArgs = [...originalArgs];
expectedArgs[expectedArgs.indexOf('--outputFile') + 1] = plan.outputs.scores;
expectedArgs[expectedArgs.indexOf('--telemetryFile') + 1] = plan.outputs.telemetry;
const expectedCommand = { executable: job.command.java,
  args: ['-cp', plan.classesDirectory + path.delimiter + plan.engineJar.path, 'DeathDiagnosticMain', ...expectedArgs] };
assert(JSON.stringify(plan.command) === JSON.stringify(expectedCommand), 'Replay command differs from frozen original-only command');
assert(plan.runtime.path === plan.command.executable, 'Runtime record mismatch');

// Additional files could change group parsing or the unsorted Zombie enumeration.
for (const flag of ['--warriorsDir', '--zombiesDir']) {
  const directory = value(originalArgs, flag);
  const expected = plan.inputs.filter(item => path.dirname(item.path) === directory).map(item => path.basename(item.path)).sort();
  const actual = fs.readdirSync(directory).sort();
  assert(expected.length > 0 && JSON.stringify(actual) === JSON.stringify(expected), `Input directory membership changed: ${directory}`);
  for (const name of actual) assert(!name.includes('.') && fs.statSync(path.join(directory, name)).isFile(), `Unsafe staged input: ${name}`);
}
const outputNames = { scores: 'scores.csv', telemetry: 'telemetry.csv', diagnosticsJsonl: 'deaths.jsonl',
  stderr: 'process.stderr.txt', execution: 'execution.json' };
assert(JSON.stringify(Object.keys(plan.outputs).sort()) === JSON.stringify(Object.keys(outputNames).sort()), 'Unexpected output keys');
for (const [key, name] of Object.entries(outputNames)) {
  assert(plan.outputs[key] === path.join(plan.outputDirectory, name), `Unexpected output path: ${key}`);
  assert(!fs.existsSync(plan.outputs[key]), `Refusing to overwrite ${plan.outputs[key]}`);
}
assert(fs.statSync(plan.outputDirectory).isDirectory() && fs.readdirSync(plan.outputDirectory).length === 0, 'Replay directory is not empty');

// The wx execution file also prevents another launcher from reusing this plan's
// outputs. All created output files remain available if execution/validation fails.
const executionFd = fs.openSync(plan.outputs.execution, 'wx');
let stdoutFd;
let stderrFd;
let child;
let failure = null;
let validation = null;
const startedAt = new Date().toISOString();
const started = process.hrtime.bigint();
try {
  stdoutFd = fs.openSync(plan.outputs.diagnosticsJsonl, 'wx');
  stderrFd = fs.openSync(plan.outputs.stderr, 'wx');
  child = spawnSync(plan.command.executable, plan.command.args,
    { stdio: ['ignore', stdoutFd, stderrFd], windowsHide: true, timeout: 600000 });
  fs.closeSync(stdoutFd); stdoutFd = undefined;
  fs.closeSync(stderrFd); stderrFd = undefined;
  assert(!child.error && child.status === 0 && child.signal === null,
    `Java failed: status=${child.status} signal=${child.signal} error=${child.error?.message ?? ''}`);
  verifyRecords();
  const rows = fs.readFileSync(plan.outputs.diagnosticsJsonl, 'utf8').split(/\r?\n/).filter(line => line.length > 0).map(line => JSON.parse(line));
  const starts = rows.filter(row => row.event === 'competitionStart');
  const ends = rows.filter(row => row.event === 'warEnd');
  const complete = rows.filter(row => row.event === 'complete');
  let initialSeed = 0;
  for (const character of plan.seed) initialSeed = (Math.imul(initialSeed, 31) + character.charCodeAt(0)) | 0;
  assert(starts.length === 1 && starts[0].wars === 50 && starts[0].seedText === plan.seed
    && starts[0].initialSeed === initialSeed && starts[0].engineSha256 === plan.engineJar.sha256, 'Incorrect competition start');
  assert(ends.length === 50 && ends.every((row, i) => row.war === i && row.seed === initialSeed + i), 'Incomplete or misordered 50-war sequence');
  assert(complete.length === 1 && complete[0].wars === 50 && complete[0].scoreFile === plan.outputs.scores,
    'Missing exact 50-war completion');
  assert(rows[0].event === 'competitionStart' && rows.at(-1).event === 'complete', 'Invalid diagnostic event ordering');
  assert(rows.every(row => ['competitionStart', 'birth', 'death', 'warEnd', 'complete'].includes(row.event)), 'Unexpected diagnostic event');
  const births = rows.filter(row => row.event === 'birth');
  const deaths = rows.filter(row => row.event === 'death');
  const watched = new Set(['COD_pair1', 'COD_pair2']);
  const key = row => `${row.war}:${row.name}`;
  assert(births.length === 100 && new Set(births.map(key)).size === 100, 'Missing/duplicate watched births');
  const born = new Set(births.map(key));
  for (const row of [...births, ...deaths]) {
    assert(watched.has(row.name) && Number.isInteger(row.war) && row.war >= 0 && row.war < 50
      && row.seed === initialSeed + row.war && Number.isInteger(row.round) && row.round >= 0, 'Invalid watched event identity');
    assert(row.state && Number.isInteger(row.state.ip) && row.state.ip >= 0 && row.state.ip <= 65535, 'Missing explicit IP snapshot');
  }
  assert(new Set(deaths.map(key)).size === deaths.length && deaths.every(row => born.has(key(row))
    && row.loadState && Number.isInteger(row.loadState.ip)), 'Invalid watched death/birth linkage');
  const scoresEqual = fs.readFileSync(plan.outputs.scores).equals(fs.readFileSync(plan.baselineScores.path));
  const telemetryEqual = fs.readFileSync(plan.outputs.telemetry).equals(fs.readFileSync(plan.baselineTelemetry.path));
  validation = { completedWars: ends.length, watchedBirths: births.length, watchedDeaths: deaths.length,
    explicitIpPresent: true, rawScoresEqual: scoresEqual, rawTelemetryEqual: telemetryEqual };
  assert(scoresEqual && telemetryEqual, 'Original raw CSV differential failed');
} catch (error) {
  failure = error.stack ?? String(error);
} finally {
  if (stdoutFd !== undefined) fs.closeSync(stdoutFd);
  if (stderrFd !== undefined) fs.closeSync(stderrFd);
  const execution = { status: failure ? 'FAILED' : 'PASS', startedAt, endedAt: new Date().toISOString(),
    elapsedSeconds: Number(process.hrtime.bigint() - started) / 1e9, plan: planRecord,
    launcher: record(import.meta.filename), command: plan.command,
    process: child ? { status: child.status, signal: child.signal, error: child.error?.message ?? null } : null,
    validation, failure, outputs: Object.fromEntries(Object.entries(plan.outputs).filter(([key]) => key !== 'execution')
      .map(([key, file]) => [key, fs.existsSync(file) ? record(file) : null])),
    caveat: 'Diagnostic original-engine replay, not a score-improvement test. Interpret death records only after PASS.' };
  try { fs.writeFileSync(executionFd, JSON.stringify(execution, null, 2) + '\n'); }
  finally { fs.closeSync(executionFd); }
  console.log(JSON.stringify({ status: execution.status, validation, execution: record(plan.outputs.execution), failure }, null, 2));
}
if (failure) process.exitCode = 1;
