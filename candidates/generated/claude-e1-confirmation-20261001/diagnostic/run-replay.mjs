import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { spawnSync } from 'node:child_process';
import { here, preparedPath, classesDirectory, outputDirectory, sourceNames, assert, equal, record,
  checkRecord, verifyFrozen, makeCommand, javaSeed } from './protocol.mjs';

// ROOT REVIEW REQUIRED. Only this exact, preselected 125-war archived batch.
if (process.argv.length !== 2) throw new Error('usage: node run-replay.mjs');
const planRecord = record(preparedPath);
const plan = JSON.parse(fs.readFileSync(preparedPath));
const fixture = verifyFrozen();
assert(plan.schemaVersion === 1 && plan.status === 'COMPILED_NOT_EXECUTED', 'Invalid compiled plan');
equal(plan.frozen, fixture, 'Frozen fixture changed after compilation');
equal(plan.sources.map(item => item.path), sourceNames.map(name => path.join(here, name)), 'Unexpected source list');
equal(plan.classes.map(item => path.basename(item.path)), ['WriterAttributionMain$Watch.class', 'WriterAttributionMain.class'], 'Unexpected class list');
assert(plan.classesDirectory === classesDirectory && plan.outputDirectory === outputDirectory, 'Unexpected output location');
equal(fs.readdirSync(classesDirectory).sort(), plan.classes.map(item => path.basename(item.path)), 'Unexpected classpath files');
for (const item of plan.classes) assert(path.dirname(item.path) === classesDirectory, 'Class outside isolated directory');
for (const item of [...plan.sources, ...plan.classes]) checkRecord(item);
equal(plan.command, makeCommand(fixture), 'Replay command changed');
for (const key of ['JAVA_TOOL_OPTIONS', '_JAVA_OPTIONS', 'JDK_JAVA_OPTIONS']) assert(!process.env[key], 'Unexpected injected JVM options: ' + key);
assert(fs.statSync(outputDirectory).isDirectory() && fs.readdirSync(outputDirectory).length === 0, 'Replay output directory not empty');
const outputs = Object.fromEntries(Object.entries({ scores: 'scores.csv', events: 'writers.jsonl', stderr: 'process.stderr.txt', execution: 'execution.json' })
  .map(([key, name]) => [key, path.join(outputDirectory, name)]));
const executionFd = fs.openSync(outputs.execution, 'wx');
let stdoutFd, stderrFd, child, failure = null, validation = null;
const startedAt = new Date().toISOString(), started = process.hrtime.bigint();
try {
  stdoutFd = fs.openSync(outputs.events, 'wx'); stderrFd = fs.openSync(outputs.stderr, 'wx');
  child = spawnSync(plan.command.executable, plan.command.args,
    { stdio: ['ignore', stdoutFd, stderrFd], windowsHide: true, timeout: 1800000 });
  fs.closeSync(stdoutFd); stdoutFd = undefined;
  fs.closeSync(stderrFd); stderrFd = undefined;
  assert(!child.error && child.status === 0 && child.signal === null,
    'Diagnostic Java failed: ' + child.status + '/' + child.signal + '/' + (child.error?.message ?? ''));
  checkRecord(planRecord);
  for (const item of [...plan.sources, ...plan.classes]) checkRecord(item);
  equal(verifyFrozen(), fixture, 'Original inputs changed during replay');
  const initialSeed = javaSeed(fixture.frozen.seed);
  const names = new Set(['COD_A1', 'COD_A2', 'COD_B1', 'COD_B2', 'zom20a', 'zom20b', 'zom20c', 'zom20d']);
  const watched = new Set(fixture.frozen.watched);
  const events = new Set(['competitionStart', 'birth', 'observerReady', 'hookWrite', 'anchorWrite',
    'anchorActivate', 'captureEntryObserved', 'death', 'warEnd', 'complete']);
  const counts = Object.fromEntries([...events].map(key => [key, 0]));
  const births = new Set(), deaths = new Set(), captureKeys = new Set();
  const hookCounts = new Array(125).fill(0), anchorCounts = new Array(125).fill(0);
  let ended = 0, firstEvent, lastEvent, watchedDeaths = 0;
  const identity = (war, name) => war + ':' + name;
  const checkState = state => {
    assert(state && Number.isInteger(state.ip) && state.ip >= 0 && state.ip <= 65535, 'Missing explicit CPU IP');
    for (const value of Object.values(state)) assert(Number.isInteger(value) && value >= 0 && value <= 65535, 'Invalid CPU state value');
  };
  const checkChange = (change, row) => {
    assert(change && change.war === row.war && change.round <= row.round && change.round >= 0
      && Number.isInteger(change.sequence) && change.sequence >= 1, 'Invalid change timeline');
    assert(Number.isInteger(change.linear) && change.linear >= 0 && change.linear < 1048576, 'Invalid change address');
    assert(Number.isInteger(change.before) && change.before >= 0 && change.before <= 255
      && Number.isInteger(change.after) && change.after >= 0 && change.after <= 255, 'Invalid before/after byte');
    assert(names.has(change.writer.name) && births.has(identity(row.war, change.writer.name)), 'Unborn or unknown writer');
    assert(change.writer.ipMeaning === 'register value during post-byte-write callback; not opcode-start address', 'Writer IP semantics changed');
    checkState(change.writer.state);
  };
  const checkAnchor = (anchor, row) => {
    if (!anchor) return;
    assert(Number.isInteger(anchor.pointer) && Number.isInteger(anchor.linear), 'Invalid anchor');
    if (anchor.lastChanges) {
      assert(anchor.lastChanges.length === 2, 'Invalid anchor history length');
      for (const change of anchor.lastChanges) if (change) checkChange(change, row);
    }
  };
  const lines = readline.createInterface({ input: fs.createReadStream(outputs.events), crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line) continue;
    const row = JSON.parse(line);
    assert(events.has(row.event), 'Unknown diagnostic event ' + row.event);
    firstEvent ??= row.event; lastEvent = row.event; counts[row.event]++;
    if (row.event === 'competitionStart') {
      assert(counts.competitionStart === 1 && row.wars === 125 && row.initialSeed === initialSeed
        && row.seedText === fixture.frozen.seed && row.engineSha256 === fixture.engineJar.sha256, 'Invalid competition start');
      continue;
    }
    if (row.event === 'complete') {
      assert(row.wars === 125 && row.scoreFile === outputs.scores && ended === 125, 'Invalid completion');
      continue;
    }
    assert(Number.isInteger(row.war) && row.war === ended && row.war < 125 && row.seed === initialSeed + row.war, 'Misordered war/seed');
    assert(Number.isInteger(row.round) && row.round >= -1 && row.round <= 200000, 'Invalid observed round');
    const key = identity(row.war, row.name);
    if (row.event === 'birth') {
      assert(names.has(row.name) && row.round === -1 && !births.has(key), 'Invalid/duplicate birth');
      checkState(row.state); births.add(key);
    } else if (row.event === 'observerReady') {
      assert(row.round === 0 && row.latticeBytes === 128, 'Observer did not initialize after loading');
      for (const name of names) assert(births.has(identity(row.war, name)), 'Observer initialized before all births');
    } else if (row.event === 'hookWrite' || row.event === 'anchorWrite') {
      checkChange(row.change, row);
      assert(row.change.round === row.round, 'Write event round differs from writer round');
      if (row.event === 'hookWrite') {
        assert([0x15d13, 0x15d14].includes(row.change.linear), 'Hook write outside hook');
        hookCounts[row.war]++;
      } else {
        assert(watched.has(row.watch), 'Unwatched anchor write'); checkAnchor(row.anchor, row); checkState(row.watchState);
        assert([row.anchor.linear, row.anchor.linear + 1].includes(row.change.linear), 'Write not at active anchor');
        anchorCounts[row.war]++;
      }
    } else if (row.event === 'anchorActivate') {
      assert(watched.has(row.watch), 'Unwatched activation'); checkAnchor(row.anchor, row); checkState(row.watchState);
    } else if (row.event === 'captureEntryObserved') {
      const captureKey = identity(row.war, row.name) + ':' + row.entryProgram;
      assert(row.name.startsWith('zom20') && ['COD_A1', 'COD_B1'].includes(row.entryProgram) && !captureKeys.has(captureKey), 'Invalid capture observation');
      captureKeys.add(captureKey); checkState(row.state);
      assert(row.observation === 'first round-boundary IP in frozen entry-prefix range, not exact jump time', 'Capture timestamp overstated');
      assert(row.state.cs === 0x1000 && ((row.state.ip - row.entryOffset) & 65535) < 14, 'Capture outside observed range');
      for (const change of row.hookLastChanges) if (change) checkChange(change, row);
    } else if (row.event === 'death') {
      assert(births.has(key) && !deaths.has(key), 'Invalid death/birth linkage');
      deaths.add(key); checkState(row.state); checkAnchor(row.anchor, row);
      if (watched.has(row.name)) watchedDeaths++;
    } else if (row.event === 'warEnd') {
      assert(row.observerFailure === null && row.hookWrites === hookCounts[row.war]
        && row.activeAnchorChanges === anchorCounts[row.war], 'Observer failure/event count mismatch');
      ended++;
    }
  }
  assert(firstEvent === 'competitionStart' && lastEvent === 'complete' && counts.complete === 1
    && counts.observerReady === 125 && ended === 125 && births.size === 1000, 'Incomplete replay event sequence');
  const scoresEqual = fs.readFileSync(outputs.scores).equals(fs.readFileSync(fixture.baselineScores.path));
  validation = { completedWars: ended, births: births.size, deaths: deaths.size, watchedDeaths, events: counts,
    rawScoresEqual: scoresEqual, rawTelemetryEquality: 'not available in archived fixture', observerOnly: true };
  assert(scoresEqual, 'Raw score CSV does not match the original archived run byte-for-byte');
} catch (error) {
  failure = error.stack ?? String(error);
} finally {
  if (stdoutFd !== undefined) fs.closeSync(stdoutFd);
  if (stderrFd !== undefined) fs.closeSync(stderrFd);
  const execution = { status: failure ? 'FAILED' : 'PASS', startedAt, endedAt: new Date().toISOString(),
    elapsedSeconds: Number(process.hrtime.bigint() - started) / 1e9, plan: planRecord,
    command: plan.command, validation, failure,
    process: child ? { status: child.status, signal: child.signal, error: child.error?.message ?? null } : null,
    outputs: Object.fromEntries(Object.entries(outputs).filter(([key]) => key !== 'execution')
      .map(([key, file]) => [key, fs.existsSync(file) ? record(file) : null])),
    caveat: 'Interpret writer attribution only after PASS. This is diagnostic replay, not a new competition result or advantage estimate.' };
  try { fs.writeFileSync(executionFd, JSON.stringify(execution, null, 2) + '\n'); }
  finally { fs.closeSync(executionFd); }
  console.log(JSON.stringify({ status: execution.status, validation, execution: record(outputs.execution), failure }, null, 2));
}
if (failure) process.exitCode = 1;
