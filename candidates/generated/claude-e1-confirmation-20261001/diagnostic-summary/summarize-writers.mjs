import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';

// Read-only inputs; only one new compact output. Do not invoke before replay PASS.
if (process.argv.length !== 2) throw new Error('usage: node summarize-writers.mjs');
const here = import.meta.dirname;
const replay = path.resolve(here, '../diagnostic-retry/replay');
const executionPath = path.join(replay, 'execution.json');
const summaryPath = path.join(here, 'summary.json');
const expectedEngine = '31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d';
const expectedExecution = 'c89310c2c60a8ae206c5e5fabbb5f0850713de0ddd879215640168d980a8ee85';
const expectedSeed = 'claude-synthesis-duel-1-cfec1882f8ac1f4fc47a2263';
const watched = new Set(['COD_B1', 'COD_B2']);
const allNames = new Set(['COD_A1', 'COD_A2', 'COD_B1', 'COD_B2', 'zom20a', 'zom20b', 'zom20c', 'zom20d']);
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const recordSmall = file => {
  const bytes = fs.readFileSync(file);
  return { path: path.resolve(file), bytes: bytes.length, sha256: hash(bytes) };
};
const verifySmall = item => {
  const actual = recordSmall(item.path);
  assert(actual.bytes === item.bytes && actual.sha256 === item.sha256, 'Frozen file changed: ' + item.path);
};
const executionBytes = fs.readFileSync(executionPath);
const executionRecord = { path: executionPath, bytes: executionBytes.length, sha256: hash(executionBytes) };
assert(executionRecord.sha256 === expectedExecution, 'Not the accepted 125-war writer replay execution');
const execution = JSON.parse(executionBytes);
assert(execution.status === 'PASS' && execution.failure === null
  && execution.validation?.completedWars === 125 && execution.validation.rawScoresEqual === true
  && execution.validation.observerOnly === true, 'Only a completed PASS replay may be summarized');
assert(execution.process?.status === 0 && execution.process.signal === null && execution.process.error === null, 'Replay process did not finish cleanly');
assert(!fs.existsSync(summaryPath), 'Refusing to overwrite a previous summary');
verifySmall(execution.plan);
const plan = JSON.parse(fs.readFileSync(execution.plan.path));
assert(path.resolve(execution.plan.path) === path.resolve(here, '../diagnostic-retry/prepared-plan.json'), 'Unexpected replay plan');
assert(plan.frozen.engineJar.sha256 === expectedEngine && plan.frozen.frozen.expectedWars === 125
  && plan.frozen.frozen.seed === expectedSeed, 'Unexpected fixture in replay plan');
assert(JSON.stringify(execution.command) === JSON.stringify(plan.command), 'Execution differs from prepared command');
verifySmall(execution.outputs.scores);
verifySmall(plan.frozen.baselineScores);
assert(execution.outputs.scores.sha256 === plan.frozen.baselineScores.sha256
  && execution.outputs.scores.bytes === plan.frozen.baselineScores.bytes, 'Score equality evidence mismatch');
const eventRecord = execution.outputs.events;
assert(path.resolve(eventRecord.path) === path.join(replay, 'writers.jsonl'), 'Unexpected event input');
assert(fs.statSync(eventRecord.path).size === eventRecord.bytes, 'Trace size differs from completed execution');
let initialSeed = 0;
for (let i = 0; i < expectedSeed.length; i++) initialSeed = (Math.imul(initialSeed, 31) + expectedSeed.charCodeAt(i)) | 0;

const increment = (object, key) => { object[key] = (object[key] ?? 0) + 1; };
const ordered = object => Object.fromEntries(Object.entries(object).sort((a, b) => a[0].localeCompare(b[0])));
const deaths = [], captures = [], hookSummaries = [], samples = [];
const counts = Object.fromEntries(Object.keys(execution.validation.events).map(key => [key, 0]));
const byReason = {}, byOpcode = {}, byWarrior = {};
const ffA5 = { count: 0, byWarrior: {}, lastLowByteModificationRoles: {}, lastHighByteModificationRoles: {},
  highByteWriters: {}, withPrivateDsFromBirth: 0, withSiZeroCxNine: 0 };
const lastModificationRoles = { low: {}, high: {} };
const capturePrograms = {}, captureProgramsWithIntactPrefix = {};
const lastEntryValuedHighByteWritePrograms = {}, finalHookValuePrograms = {};
const sampleCounts = { ffA5: 0, other: 0 };
const seenBirths = new Set(), seenDeaths = new Set(), seenCaptures = new Set();
let currentWar = 0, readyInWar = false, firstEvent, lastEvent, starts = 0, completes = 0;
let rings = new Map(), hookRing = [], entryOffsets = {}, finalHook = null, lastEntryWrite = null;
let birthStates = new Map(), hookEventCount = 0, anchorEventCount = 0;
const identity = (war, name) => war + ':' + name;
const role = (name, watch) => name == null ? 'no-recorded-modification'
  : name === watch ? 'self' : watched.has(name) ? 'partner'
  : name === 'COD_A1' || name === 'COD_A2' ? 'opposing-survivor'
  : name.startsWith('zom20') ? 'zombie' : 'unknown';
const state = value => value == null ? null : { ...value };
const compactChange = (change, watch) => change == null ? null : {
  war: change.war, round: change.round, sequence: change.sequence, linear: change.linear,
  before: change.before, after: change.after, writer: {
    name: change.writer.name, group: change.writer.group, type: change.writer.type,
    roleRelativeToWatchedWarrior: watch ? role(change.writer.name, watch) : null,
    state: state(change.writer.state), nearIpHex: change.writer.nearIpHex,
    ipMeaning: change.writer.ipMeaning,
  },
};
const compactAnchor = (anchor, watch) => anchor == null ? null : {
  generation: anchor.generation, pointer: anchor.pointer, linear: anchor.linear,
  onExpectedLattice: anchor.onExpectedLattice, hex6: anchor.hex6,
  lastRecordedByteModifications: anchor.lastChanges?.map(change => compactChange(change, watch)) ?? null,
};
const compactTimeline = row => ({
  event: row.event, war: row.war, round: row.round, watch: row.watch ?? null,
  reason: row.reason ?? null, pointerSegment: row.pointerSegment ?? null,
  anchor: row.anchor ? {
    generation: row.anchor.generation, pointer: row.anchor.pointer, linear: row.anchor.linear,
    onExpectedLattice: row.anchor.onExpectedLattice, hex6: row.anchor.hex6,
  } : null,
  change: row.change ? {
    sequence: row.change.sequence, linear: row.change.linear, before: row.change.before, after: row.change.after,
    writer: row.change.writer.name, writerCs: row.change.writer.state.cs, writerCurrentIp: row.change.writer.state.ip,
    writerDs: row.change.writer.state.ds, writerSi: row.change.writer.state.si, writerDi: row.change.writer.state.di,
  } : null,
  wordAfterByte: row.wordAfterByte ?? null, wordMayBePartiallyWritten: row.wordMayBePartiallyWritten ?? null,
});
const remember = (watch, row) => {
  const ring = rings.get(watch) ?? [];
  ring.push(compactTimeline(row));
  if (ring.length > 6) ring.shift();
  rings.set(watch, ring);
};
const entryProgram = value => Object.entries(entryOffsets).find(([, offset]) => offset === value)?.[0] ?? 'not-a-frozen-entry';
const validateChange = (change, row) => {
  if (change == null) return;
  assert(change.war === row.war && change.round >= 0 && change.round <= row.round
    && Number.isInteger(change.sequence) && change.sequence > 0, 'Invalid modification timeline');
  assert(allNames.has(change.writer.name) && seenBirths.has(identity(row.war, change.writer.name)), 'Unknown modification writer');
  assert(change.writer.ipMeaning === 'register value during post-byte-write callback; not opcode-start address', 'Incorrect writer-IP interpretation');
  assert(Number.isInteger(change.writer.state.ip), 'Missing recorded writer IP');
};

const eventHasher = crypto.createHash('sha256');
let eventBytes = 0;
const input = fs.createReadStream(eventRecord.path);
input.on('data', chunk => { eventBytes += chunk.length; eventHasher.update(chunk); });
const lines = readline.createInterface({ input, crlfDelay: Infinity });
for await (const line of lines) {
  if (!line) continue;
  const row = JSON.parse(line);
  firstEvent ??= row.event; lastEvent = row.event;
  increment(counts, row.event);
  if (row.event === 'competitionStart') {
    assert(++starts === 1 && row.wars === 125 && row.initialSeed === initialSeed
      && row.seedText === expectedSeed && row.engineSha256 === expectedEngine, 'Wrong competition start');
    continue;
  }
  if (row.event === 'complete') {
    assert(++completes === 1 && row.wars === 125 && currentWar === 125
      && row.scoreFile === execution.outputs.scores.path, 'Premature/wrong completion');
    continue;
  }
  assert(Number.isInteger(row.war) && row.war === currentWar && currentWar < 125
    && row.seed === initialSeed + row.war, 'Missing/reordered battle in trace');
  assert(Number.isInteger(row.round) && row.round >= -1 && row.round <= 200000, 'Invalid round');
  if (row.event === 'birth') {
    const key = identity(row.war, row.name);
    assert(row.round === -1 && allNames.has(row.name) && !seenBirths.has(key), 'Bad birth');
    seenBirths.add(key); birthStates.set(row.name, row.state);
  } else if (row.event === 'observerReady') {
    assert(row.round === 0 && !readyInWar && row.latticeBytes === 128, 'Bad observer initialization');
    for (const name of allNames) assert(seenBirths.has(identity(row.war, name)), 'Incomplete births before observation');
    readyInWar = true; entryOffsets = Object.fromEntries(row.captureEntries.map(entry => [entry.name, entry.offset]));
  } else if (row.event === 'hookWrite') {
    validateChange(row.change, row); hookEventCount++;
    finalHook = { round: row.round, wordAfterByte: row.wordAfterByte,
      writer: row.change.writer.name, linear: row.change.linear,
      wordMayBePartiallyWritten: row.wordMayBePartiallyWritten };
    hookRing.push(compactTimeline(row)); if (hookRing.length > 2) hookRing.shift();
    const program = entryProgram(row.wordAfterByte);
    if (row.change.linear === 0x15d14 && program !== 'not-a-frozen-entry') {
      lastEntryWrite = { round: row.round, sequence: row.change.sequence, entryProgram: program,
        writer: row.change.writer.name, writerCurrentIp: row.change.writer.state.ip,
        hookWord: row.wordAfterByte };
    }
  } else if (row.event === 'anchorWrite' || row.event === 'anchorActivate') {
    assert(watched.has(row.watch), 'Unwatched anchor event');
    if (row.event === 'anchorWrite') { validateChange(row.change, row); anchorEventCount++; }
    remember(row.watch, row);
  } else if (row.event === 'captureEntryObserved') {
    const key = identity(row.war, row.name) + ':' + row.entryProgram;
    assert(row.name.startsWith('zom20') && entryOffsets[row.entryProgram] === row.entryOffset
      && !seenCaptures.has(key) && row.state.cs === 0x1000
      && ((row.state.ip - row.entryOffset) & 65535) < 14, 'Bad capture-range observation');
    assert(row.observation === 'first round-boundary IP in frozen entry-prefix range, not exact jump time', 'Capture timestamp overclaimed');
    seenCaptures.add(key);
    increment(capturePrograms, row.entryProgram);
    if (row.prefixStillMatches) increment(captureProgramsWithIntactPrefix, row.entryProgram);
    captures.push({ war: row.war, round: row.round, name: row.name, entryProgram: row.entryProgram,
      entryOffset: row.entryOffset, prefixStillMatches: row.prefixStillMatches,
      observedCs: row.state.cs, observedIp: row.state.ip, hookWordAtObservation: row.hookWord,
      previousBoundary: row.previousBoundary });
  } else if (row.event === 'death') {
    const key = identity(row.war, row.name);
    assert(seenBirths.has(key) && !seenDeaths.has(key), 'Bad death/birth linkage');
    seenDeaths.add(key);
    if (!watched.has(row.name)) continue;
    assert(Number.isInteger(row.state?.ip), 'Missing watched-death IP');
    const opcode = row.anchor?.hex6?.slice(0, 4) ?? 'no-anchor';
    const signature = row.reason === 'memory exception' && opcode === 'ffa5'
      && row.state.cs === 0xffc && row.anchor.pointer >= 0
      && row.state.ip === ((row.anchor.pointer + 4) & 65535);
    const privateDs = row.state.ds === birthStates.get(row.name)?.ss;
    const rawChanges = row.anchor?.lastChanges ?? [null, null];
    for (const change of rawChanges) validateChange(change, row);
    const lowRole = role(rawChanges[0]?.writer.name, row.name), highRole = role(rawChanges[1]?.writer.name, row.name);
    increment(byReason, row.reason); increment(byOpcode, opcode); increment(byWarrior, row.name);
    increment(lastModificationRoles.low, lowRole); increment(lastModificationRoles.high, highRole);
    let effectivePrivateOffset = null;
    if (signature) {
      ffA5.count++; increment(ffA5.byWarrior, row.name);
      increment(ffA5.lastLowByteModificationRoles, lowRole); increment(ffA5.lastHighByteModificationRoles, highRole);
      increment(ffA5.highByteWriters, rawChanges[1]?.writer.name ?? 'no-recorded-modification');
      if (privateDs) ffA5.withPrivateDsFromBirth++;
      if (row.state.si === 0 && row.state.cx === 9) ffA5.withSiZeroCxNine++;
      const bytes = Buffer.from(row.anchor.hex6, 'hex');
      effectivePrivateOffset = (row.state.di + bytes.readUInt16LE(2)) & 65535;
    }
    const death = { war: row.war, seed: row.seed, round: row.round, name: row.name, reason: row.reason,
      state: state(row.state), anchor: compactAnchor(row.anchor, row.name),
      matchesFfA5AnchorFaultSignature: signature, dsMatchesInitialPrivateStack: privateDs,
      decodedDiPlusDisp16Offset: effectivePrivateOffset,
      lastLowByteModificationRole: lowRole, lastHighByteModificationRole: highRole };
    deaths.push(death);
    const kind = signature ? 'ffA5' : 'other';
    if (sampleCounts[kind] < 4) {
      sampleCounts[kind]++;
      samples.push({ selection: 'First four watched deaths of this signature class in original protocol order',
        kind, death, precedingActiveAnchorEvents: [...(rings.get(row.name) ?? [])], lastTwoHookEvents: [...hookRing] });
    }
  } else if (row.event === 'warEnd') {
    assert(readyInWar && row.observerFailure === null && row.hookWrites === hookEventCount
      && row.activeAnchorChanges === anchorEventCount, 'Incomplete observer/count mismatch');
    if (lastEntryWrite) increment(lastEntryValuedHighByteWritePrograms, lastEntryWrite.entryProgram);
    else increment(lastEntryValuedHighByteWritePrograms, 'none-observed');
    increment(finalHookValuePrograms, finalHook ? entryProgram(finalHook.wordAfterByte) : 'no-hook-write');
    hookSummaries.push({ war: row.war, lastEntryValuedHighByteWrite: lastEntryWrite,
      lastObservedHookValue: finalHook, lastObservedHookEntryProgram: finalHook ? entryProgram(finalHook.wordAfterByte) : null });
    currentWar++; readyInWar = false; rings = new Map(); hookRing = []; entryOffsets = {};
    finalHook = null; lastEntryWrite = null; birthStates = new Map(); hookEventCount = anchorEventCount = 0;
  } else throw new Error('Unexpected trace event: ' + row.event);
}
const streamedHash = eventHasher.digest('hex');
assert(eventBytes === eventRecord.bytes && streamedHash === eventRecord.sha256, 'Completed trace bytes/hash mismatch');
assert(firstEvent === 'competitionStart' && lastEvent === 'complete' && starts === 1 && completes === 1
  && currentWar === 125 && counts.observerReady === 125 && seenBirths.size === 1000, 'Incomplete 125-war trace');
assert(JSON.stringify(ordered(counts)) === JSON.stringify(ordered(execution.validation.events)), 'Event counts disagree with PASS execution');
assert(deaths.length === execution.validation.watchedDeaths && seenDeaths.size === execution.validation.deaths, 'Death counts disagree with PASS execution');
verifySmall(executionRecord); verifySmall(execution.plan); verifySmall(execution.outputs.scores);
assert(fs.statSync(eventRecord.path).size === eventBytes, 'Trace size changed during summarization');
const summary = {
  schemaVersion: 1, status: 'ACCEPTED_DIAGNOSTIC_SUMMARY', execution: executionRecord, plan: execution.plan,
  trace: { ...eventRecord, verifiedStreamSha256: streamedHash }, authoringScript: recordSmall(import.meta.filename),
  validation: { wars: 125, births: seenBirths.size, allDeaths: seenDeaths.size, watchedDeaths: deaths.length,
    rawScoreEquality: true, exactTraceHash: true, eventCounts: ordered(counts) },
  watchedDeathCounts: { byReason: ordered(byReason), byAnchorFirstTwoBytes: ordered(byOpcode), byWarrior: ordered(byWarrior),
    lastRecordedModificationRoles: { low: ordered(lastModificationRoles.low), high: ordered(lastModificationRoles.high) } },
  ffA5AnchorFaultSignature: ffA5,
  firstObservedCaptureEntries: { total: captures.length, byProgramAddress: ordered(capturePrograms),
    withIntactPrefixByProgramAddress: ordered(captureProgramsWithIntactPrefix), observations: captures },
  hookObservations: { lastEntryValuedHighByteWritePrograms: ordered(lastEntryValuedHighByteWritePrograms),
    finalObservedHookValuePrograms: ordered(finalHookValuePrograms), byWar: hookSummaries },
  watchedDeathSnapshots: deaths, boundedExampleTimelines: samples,
  limitations: [
    'Last recorded byte modification is not automatically a causal kill; a low-byte history may merely identify its own publication.',
    'FF A5 signature means memory-exception, CS=FFC, matching anchor bytes and IP=pointer+4. Decoded DI+disp16 is observational, not an independently simulated fault.',
    'Writer IP is the current/post-fetch value during a byte-write callback, not the opcode-start address.',
    'Capture entries are first observed round-boundary ranges, not exact jump times, and do not transfer team/scoring ownership.',
    'An entry-valued high-byte hook write is only a value observation; no atomic publication or capture ownership is inferred.',
    'Only the two bytes on the original 64-anchor lattice have complete post-loading modification history. Null means no recorded change, not proof of no writer.',
    'No extrapolation from this single duel batch to other opponents, broad-field strength, or immunity. No new competitive result is estimated.',
    'Inputs were read only. All watched deaths are retained; timelines are bounded to the first four FF-A5 and first four other deaths.',
  ],
};
assert(!fs.existsSync(summaryPath), 'Summary appeared during processing; refusing overwrite');
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ summary: recordSmall(summaryPath), validation: summary.validation,
  watchedDeathCounts: summary.watchedDeathCounts, ffA5AnchorFaultSignature: ffA5,
  capturePrograms: ordered(capturePrograms), lastEntryValuedHookWrites: ordered(lastEntryValuedHighByteWritePrograms) }, null, 2));
