import fs from 'node:fs';
import path from 'node:path';
import {
  here, root, audit, manifestPath, sha, hashFile, jsonText, readJson, rootPath, relativeRoot,
  assert, equal, variants, basePath, runnerPath, javaPath, enginePath,
  readProtocol, makeConfigs, inputPaths,
} from './protocol.mjs';
import { extraVariants, makeExtraConfigs, readExtrasManifest } from './extras-protocol.mjs';

const phase = process.argv[2] ?? 'all';
assert(process.argv.length <= 3 && ['screen', 'fresh', 'duels', 'all', 'extras', 'extras-core'].includes(phase), 'usage: node analyze.mjs [screen|fresh|duels|all|extras|extras-core]');
const extrasMode = phase === 'extras' || phase === 'extras-core';
const selectedExtraVariants = Object.keys(extraVariants).filter(variant => phase !== 'extras-core' || variant !== 'bomb-no-nrg');
const protocol = readProtocol();
const coreEntries = makeConfigs(protocol);
const entries = [...coreEntries, ...(extrasMode ? makeExtraConfigs(protocol) : [])];
const manifestBytes = fs.readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes);
const manifestHash = sha(manifestBytes);
equal(fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim(), manifestHash, 'manifest hash');
assert(manifest.schemaVersion === 1 && manifest.audit === audit, 'wrong manifest version or audit');
equal(manifest.variants, variants, 'manifest variants');
const normalizePath = file => process.platform === 'win32' ? path.resolve(file).toLowerCase() : path.resolve(file);
const samePath = (a, b, label) => equal(normalizePath(a), normalizePath(b), label);
samePath(manifest.root, root, 'manifest root');
const numericNear = (actual, expected, tolerance, label) => {
  assert(Number.isFinite(actual) && Number.isFinite(expected) && Math.abs(actual - expected) <= tolerance,
    `${label}: ${actual} differs from ${expected} (tolerance ${tolerance})`);
};
const recordByPath = new Map(manifest.binaries.map(record => [record.path, record]));
equal([...recordByPath.keys()].sort(), inputPaths(protocol).sort(), 'complete binary manifest');
assert(manifest.binaries.length === 160 && recordByPath.size === 160, 'duplicate or missing binary manifest records');
for (const [field, expectedPath] of Object.entries({ base: basePath, runner: runnerPath, java: javaPath, engine: enginePath })) {
  equal(manifest[field].path, expectedPath, `${field} path`);
}
equal(manifest.sources.map(record => record.path), ['SubmittedA.asm', 'SubmittedB.asm'].map(file => relativeRoot(path.join(here, file))), 'source manifest');
equal(manifest.authoringFiles.map(record => record.path), ['seeds.json', 'protocol.mjs', 'generate.mjs'].map(file => relativeRoot(path.join(here, file))), 'authoring manifest');
const checkedFiles = new Map();
function checkFile(file, expected, label) {
  const key = normalizePath(file);
  let actual = checkedFiles.get(key);
  if (!actual) {
    actual = { bytes: fs.statSync(file).size, sha256: hashFile(file) };
    checkedFiles.set(key, actual);
  }
  equal(actual.bytes, expected.bytes, `${label} length`);
  equal(actual.sha256, expected.sha256, `${label} hash`);
}
for (const record of [manifest.base, manifest.runner, manifest.java, manifest.engine, ...manifest.sources, ...manifest.authoringFiles, ...manifest.binaries]) {
  checkFile(rootPath(record.path), record, record.path);
}
equal(manifest.configs, coreEntries.map(({ config, ...metadata }) => ({ ...metadata, sha256: sha(jsonText(config)) })), 'complete configuration manifest');
let extras;
if (extrasMode) {
  extras = readExtrasManifest(manifestHash, protocol);
  equal(extras.manifest.reusedReferenceConfigs, manifest.configs.filter(entry => entry.phase === 'fresh'), 'extras reused reference configs');
  equal(extras.manifest.configs, makeExtraConfigs(protocol).map(({ config, ...metadata }) => ({ ...metadata, sha256: sha(jsonText(config)) })), 'complete extras configuration manifest');
  for (const record of [...extras.manifest.binaries, ...extras.manifest.sources, ...extras.manifest.authoringFiles]) {
    checkFile(rootPath(record.path), record, record.path);
  }
  for (const record of extras.manifest.binaries) {
    assert(!recordByPath.has(record.path), `duplicate extra binary ${record.path}`);
    recordByPath.set(record.path, record);
  }
}

const sum = values => values.reduce((total, value) => total + value, 0);
const mean = values => sum(values) / values.length;
const round = value => Number(value.toFixed(9));
function parseScores(text) {
  const scores = { groups: {}, warriors: {} };
  let section;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line === 'Groups:') { section = 'groups'; continue; }
    if (line === 'Warriors:') { section = 'warriors'; continue; }
    assert(section, 'score row before section');
    const comma = line.lastIndexOf(',');
    assert(comma > 0, 'invalid score row');
    const name = line.slice(0, comma);
    const value = Number(line.slice(comma + 1));
    assert(Number.isFinite(value) && !Object.hasOwn(scores[section], name), `invalid or duplicate score ${name}`);
    scores[section][name] = value;
  }
  return scores;
}

let validatedRuns = 0;
let maxConservationErrorRaw = 0;
let maxWarriorGroupErrorRaw = 0;
let scorelessBattles = 0;
function validateRun(entry, run, cohort, seed) {
  const config = entry.config;
  const runId = `${cohort.id}__${seed}`;
  equal(run.runId, runId, 'run ID');
  equal(run.cohortId, cohort.id, `${runId} cohort`);
  equal(run.seed, seed, `${runId} seed`);
  equal(run.battles, config.battles, `${runId} battles`);
  const frozenAt = entry.phase === 'extras' ? extras.manifest.frozenAt : manifest.frozenAt;
  assert(Number.isFinite(Date.parse(run.startedAt)) && Date.parse(run.startedAt) >= Date.parse(frozenAt), `${runId} started before input freeze`);
  assert(Number.isFinite(run.elapsedSeconds) && run.elapsedSeconds >= 0, `${runId} invalid elapsed time`);
  equal(run.telemetry, null, `${runId} telemetry`);
  const stdoutLines = run.stdout.split(/\r?\n/).map(line => line.trim());
  equal(stdoutLines.filter(line => line.startsWith('Starting competition ')), [`Starting competition (${config.battles} wars).`], `${runId} actual started battle count`);
  equal(stdoutLines.filter(line => line.startsWith('Competition is over.')), [`Competition is over. Ran ${config.battles} wars`], `${runId} actual completed battle count`);
  const runDir = path.resolve(here, config.runDirectory, runId);
  const warriorsDir = path.join(runDir, 'survivors');
  const zombiesDir = path.join(runDir, 'zombies');
  samePath(run.command.executable, rootPath(javaPath), `${runId} Java executable`);
  equal(run.command.args, [
    '-jar', rootPath(enginePath), '--headless', '--comboSize', String(1 + cohort.opponents.length),
    '--battlesPerCombo', String(config.battles), '--seed', seed, '--threads', '1',
    '--warriorsDir', warriorsDir, '--zombiesDir', zombiesDir,
    '--outputFile', path.join(runDir, 'scores.csv'), '--parallel=false',
  ], `${runId} command`);
  const teams = [config.candidate, ...cohort.opponents];
  const teamNames = teams.map(team => team.name);
  const warriorNames = teams.flatMap(team => [`${team.name}1`, `${team.name}2`]);
  equal(Object.keys(run.inputs).sort(), [...teamNames].sort(), `${runId} team membership`);
  equal(fs.readdirSync(warriorsDir).sort(), [...warriorNames].sort(), `${runId} warrior directory membership`);
  equal(fs.readdirSync(zombiesDir).sort(), config.zombies.map(zombie => zombie.name).sort(), `${runId} Zombie directory membership`);
  function validateInput(input, sourceRelative, target, label) {
    const source = path.resolve(here, sourceRelative);
    const expected = recordByPath.get(relativeRoot(source));
    assert(expected, `${label} absent from binary manifest`);
    samePath(input.source, source, `${label} source`);
    samePath(input.target, target, `${label} target`);
    equal(input.bytes, expected.bytes, `${label} recorded length`);
    equal(input.sha256, expected.sha256, `${label} recorded hash`);
    checkFile(target, expected, `${label} copied binary`);
  }
  for (const team of teams) {
    assert(run.inputs[team.name].length === 2, `${runId} wrong warrior count for ${team.name}`);
    team.warriors.forEach((file, index) => validateInput(run.inputs[team.name][index], file,
      path.join(warriorsDir, `${team.name}${index + 1}`), `${runId}:${team.name}${index + 1}`));
  }
  assert(run.zombies.length === 4, `${runId} wrong Zombie count`);
  config.zombies.forEach((zombie, index) => {
    equal(run.zombies[index].name, zombie.name, `${runId} Zombie name/order`);
    validateInput(run.zombies[index], zombie.path, path.join(zombiesDir, zombie.name), `${runId}:${zombie.name}`);
  });
  equal(run.rawScoreText, fs.readFileSync(path.join(runDir, 'scores.csv'), 'utf8'), `${runId} retained scores CSV`);
  const scores = parseScores(run.rawScoreText);
  for (const section of ['groups', 'warriors']) {
    const names = section === 'groups' ? teamNames : warriorNames;
    equal(Object.keys(run.scores[section]).sort(), [...names].sort(), `${runId} ${section} score membership`);
    equal(Object.keys(scores[section]).sort(), [...names].sort(), `${runId} raw ${section} membership`);
    for (const name of names) {
      numericNear(run.scores[section][name], scores[section][name], 0, `${runId}:${name} raw score`);
      assert(scores[section][name] >= 0 && scores[section][name] <= config.battles + 0.01, `${runId}:${name} score outside range`);
    }
  }
  // Java uses float accumulation. Allow 0.002% of battles in raw score units.
  const tolerance = Math.max(1e-4, config.battles * 2e-5);
  const awarded = sum(Object.values(scores.groups));
  const warriorAwarded = sum(Object.values(scores.warriors));
  const roundedAwarded = Math.round(awarded);
  const conservationError = Math.abs(awarded - roundedAwarded);
  maxConservationErrorRaw = Math.max(maxConservationErrorRaw, conservationError);
  // With no surviving non-Zombie warrior the engine awards zero points.
  // Otherwise it distributes one point, so the total is an integer <= battles.
  assert(roundedAwarded >= 0 && roundedAwarded <= config.battles, `${runId} awarded points outside battle bounds`);
  numericNear(awarded, roundedAwarded, tolerance, `${runId} integer awarded-point conservation`);
  numericNear(warriorAwarded, awarded, tolerance, `${runId} warrior/group total conservation`);
  scorelessBattles += config.battles - roundedAwarded;
  for (const name of teamNames) {
    const combined = scores.warriors[`${name}1`] + scores.warriors[`${name}2`];
    maxWarriorGroupErrorRaw = Math.max(maxWarriorGroupErrorRaw, Math.abs(combined - scores.groups[name]));
    numericNear(combined, scores.groups[name], tolerance, `${runId}:${name} warrior/team conservation`);
  }
  const candidate = config.candidate.name;
  for (const [field, score] of [
    ['team', scores.groups[candidate]],
    ['warrior1', scores.warriors[`${candidate}1`]],
    ['warrior2', scores.warriors[`${candidate}2`]],
  ]) {
    numericNear(run.candidate[`${field}Raw`], score, 1e-10, `${runId} ${field} raw`);
    numericNear(run.candidate[`${field}PerBattle`], score / config.battles, 1e-10, `${runId} ${field} normalization`);
  }
  equal(readJson(path.join(runDir, 'run.json')), run, `${runId} retained run record`);
  validatedRuns++;
}

function load(entry) {
  const configFile = path.join(here, entry.configPath);
  const configManifest = entry.phase === 'extras' ? extras.manifest : manifest;
  const expectedHash = configManifest.configs.find(config => config.id === entry.id).sha256;
  equal(hashFile(configFile), expectedHash, `${entry.id} configuration hash`);
  equal(readJson(configFile), entry.config, `${entry.id} exact protocol and cohorts`);
  const resultFile = path.resolve(here, entry.config.outputPath);
  const result = readJson(resultFile);
  assert(result.schemaVersion === 1, `${entry.id} result schema`);
  equal(result.experimentId, entry.config.experimentId, `${entry.id} experiment ID`);
  equal(result.configSha256, expectedHash, `${entry.id} recorded config hash`);
  samePath(result.configPath, configFile, `${entry.id} recorded config path`);
  equal(result.engineJar.sha256, manifest.engine.sha256, `${entry.id} engine hash`);
  samePath(result.engineJar.path, rootPath(enginePath), `${entry.id} engine path`);
  const expectedRuns = entry.config.cohorts.length * entry.config.seeds.length;
  assert(result.runs.length === expectedRuns, `${entry.id} incomplete run count`);
  const runMap = new Map(result.runs.map(run => [run.runId, run]));
  assert(runMap.size === expectedRuns, `${entry.id} duplicate runs`);
  for (const cohort of entry.config.cohorts) for (const seed of entry.config.seeds) {
    const run = runMap.get(`${cohort.id}__${seed}`);
    assert(run, `${entry.id} missing ${cohort.id}/${seed}`);
    validateRun(entry, run, cohort, seed);
  }
  equal(result.aggregate.battles, entry.totalBattles, `${entry.id} aggregate battles`);
  equal(sum(result.runs.map(run => run.battles)), entry.totalBattles, `${entry.id} total battles`);
  for (const field of ['team', 'warrior1', 'warrior2']) {
    numericNear(result.aggregate[`${field}PerBattle`], sum(result.runs.map(run => run.candidate[`${field}Raw`])) / entry.totalBattles,
      1e-10, `${entry.id} aggregate ${field}`);
  }
  return { entry, result, resultFile, runMap };
}

// Approximate two-sided 95% Student-t intervals over observed aggregate blocks.
// Every 50-battle result contributes one observed value, never fifty values.
function t975(df) {
  const exact = { 1: 12.706204736, 3: 3.182446305, 5: 2.570581836, 7: 2.364624252, 24: 2.063898562, 49: 2.009575237, 99: 1.984216952 };
  if (exact[df]) return exact[df];
  const z = 1.959963984540054;
  return z + (z ** 3 + z) / (4 * df)
    + (5 * z ** 5 + 16 * z ** 3 + 3 * z) / (96 * df ** 2)
    + (3 * z ** 7 + 19 * z ** 5 + 17 * z ** 3 - 15 * z) / (384 * df ** 3);
}
function interval(values) {
  const estimate = mean(values);
  if (values.length < 2) return { units: values.length, mean: round(estimate), ci95: null };
  const se = Math.sqrt(sum(values.map(value => (value - estimate) ** 2)) / (values.length - 1) / values.length);
  const margin = t975(values.length - 1) * se;
  return { units: values.length, mean: round(estimate), ci95: [round(estimate - margin), round(estimate + margin)] };
}
function grouped(blocks, key) {
  const groups = new Map();
  for (const block of blocks) {
    if (!groups.has(block[key])) groups.set(block[key], []);
    groups.get(block[key]).push(block.delta);
  }
  return [...groups].map(([name, values]) => ({ [key]: name, delta: mean(values), blocks: values.length }));
}
function seedRangeDiagnostics(seeds, battles) {
  const javaHash = seed => { let hash = 0; for (let i = 0; i < seed.length; i++) hash = (Math.imul(hash, 31) + seed.charCodeAt(i)) | 0; return hash; };
  const ranges = seeds.map(seed => ({ seed, firstWarSeed: javaHash(seed), lastWarSeed: javaHash(seed) + battles - 1 }));
  const overlaps = [];
  for (let i = 0; i < ranges.length; i++) for (let j = i + 1; j < ranges.length; j++) {
    const count = Math.min(ranges[i].lastWarSeed, ranges[j].lastWarSeed) - Math.max(ranges[i].firstWarSeed, ranges[j].firstWarSeed) + 1;
    if (count > 0) overlaps.push({ seeds: [ranges[i].seed, ranges[j].seed], sharedWarSeeds: count });
  }
  return { ranges, overlaps };
}
function deltaSummary(blocks) {
  const byCohort = grouped(blocks, 'cohort');
  const bySeed = grouped(blocks, 'seed');
  const seedInterval = interval(bySeed.map(group => group.delta));
  if (seedRangeDiagnostics(bySeed.map(group => group.seed), 50).overlaps.length) {
    seedInterval.ci95 = null;
    seedInterval.caveat = 'Suppressed: engine war-seed ranges overlap. Screen and pooled comparisons are descriptive.';
  }
  return {
    pairedBlockApproxT: interval(blocks.map(block => block.delta)),
    cohortClusterApproxT: interval(byCohort.map(group => group.delta)),
    seedClusterApproxT: seedInterval,
    byCohort: byCohort.map(group => ({ ...group, delta: round(group.delta) })),
    bySeed: bySeed.map(group => ({ ...group, delta: round(group.delta) })),
  };
}

const loaded = new Map(entries.filter(entry => {
  if (extrasMode) return entry.phase === 'fresh' || (entry.phase === 'extras' && selectedExtraVariants.includes(entry.variant));
  return phase === 'all' || entry.phase === phase;
}).map(entry => [entry.id, load(entry)]));
const fieldBlocks = new Map();
function soloComparison(fieldPhase, control, variant = 'submitted') {
  const submitted = loaded.get(`${fieldPhase}-${variant}`);
  const baseline = loaded.get(`${fieldPhase}-${control}`);
  const blocks = submitted.result.runs.map(run => {
    const other = baseline.runMap.get(run.runId);
    assert(other, `unpaired ${fieldPhase}/${control}/${run.runId}`);
    for (const name of Object.keys(run.inputs).filter(name => name !== 'COD_pair')) {
      equal(run.inputs[name].map(input => input.sha256), other.inputs[name].map(input => input.sha256), `${run.runId} paired opponent ${name}`);
    }
    equal(run.zombies.map(zombie => zombie.sha256), other.zombies.map(zombie => zombie.sha256), `${run.runId} paired Zombies`);
    return { cohort: run.cohortId, seed: run.seed, delta: run.candidate.teamPerBattle - other.candidate.teamPerBattle };
  });
  if (variant === 'submitted') fieldBlocks.set(`${fieldPhase}-${control}`, blocks);
  return { control, deltaScorePerBattle: round(mean(blocks.map(block => block.delta))), ...deltaSummary(blocks) };
}
const fields = {};
for (const fieldPhase of ['screen', 'fresh']) {
  if (!loaded.has(`${fieldPhase}-submitted`)) continue;
  fields[fieldPhase] = {
    battlesPerVariant: loaded.get(`${fieldPhase}-submitted`).result.aggregate.battles,
    scorePerBattle: Object.fromEntries(Object.keys(variants).map(variant => [variant, round(loaded.get(`${fieldPhase}-${variant}`).result.aggregate.teamPerBattle)])),
    scorelessBattlesInferred: Object.fromEntries(Object.keys(variants).map(variant => [variant,
      sum(loaded.get(`${fieldPhase}-${variant}`).result.runs.map(run => run.battles - Math.round(sum(Object.values(run.scores.groups))))),
    ])),
    comparisons: ['m049', 'm050'].map(control => soloComparison(fieldPhase, control)),
  };
}
if (fields.screen && fields.fresh) {
  fields.pooled = {
    battlesPerVariant: 7500,
    scorePerBattle: Object.fromEntries(Object.keys(variants).map(variant => [variant, round(
      (loaded.get(`screen-${variant}`).result.aggregate.teamPerBattle * 2500 + loaded.get(`fresh-${variant}`).result.aggregate.teamPerBattle * 5000) / 7500,
    )])),
    comparisons: ['m049', 'm050'].map(control => ({
      control, ...deltaSummary([...fieldBlocks.get(`screen-${control}`), ...fieldBlocks.get(`fresh-${control}`)]),
    })),
  };
}
const duels = [];
for (const control of ['m049', 'm050']) {
  if (!loaded.has(`duel-${control}-submitted-first`)) continue;
  const blocks = [];
  for (const orientation of ['submitted-first', 'submitted-second']) {
    const { entry, result } = loaded.get(`duel-${control}-${orientation}`);
    for (const run of result.runs) {
      const submitted = run.scores.groups[entry.observedTeam] / run.battles;
      const baseline = run.scores.groups[entry.controlTeam] / run.battles;
      blocks.push({ seed: run.seed, orientation, submitted, control: baseline, delta: submitted - baseline });
    }
  }
  const seedMeans = grouped(blocks, 'seed');
  const orientations = ['submitted-first', 'submitted-second'].map(orientation => {
    const selected = blocks.filter(block => block.orientation === orientation);
    return {
      orientation, battles: 500,
      submittedScorePerBattle: round(mean(selected.map(block => block.submitted))),
      controlScorePerBattle: round(mean(selected.map(block => block.control))),
      deltaApproxT: interval(selected.map(block => block.delta)),
    };
  });
  duels.push({
    control, battles: 1000, seeds: 4, orientations: 2,
    submittedScorePerBattle: round(mean(blocks.map(block => block.submitted))),
    controlScorePerBattle: round(mean(blocks.map(block => block.control))),
    deltaScorePerBattle: round(mean(blocks.map(block => block.delta))),
    seedClusterApproxT: interval(seedMeans.map(group => group.delta)),
    bySeed: seedMeans.map(group => ({ ...group, delta: round(group.delta) })),
    byOrientation: orientations,
  });
}
const extraComparisons = {};
if (extrasMode) for (const variant of selectedExtraVariants) {
  const { result } = loaded.get(`fresh-${variant}`);
  extraComparisons[variant] = {
    battles: result.aggregate.battles, scorePerBattle: round(result.aggregate.teamPerBattle),
    scorelessBattlesInferred: sum(result.runs.map(run => run.battles - Math.round(sum(Object.values(run.scores.groups))))),
    comparisons: ['m049', 'm050', 'submitted'].map(control => soloComparison('fresh', control, variant)),
  };
}
console.log(JSON.stringify({
  audit, phase, manifestSha256: manifestHash, engineSha256: manifest.engine.sha256,
  ...(extras ? { extrasManifestSha256: extras.hash } : {}),
  validation: { resultFiles: loaded.size, runs: validatedRuns, hashedFiles: checkedFiles.size,
    maxConservationErrorRaw: round(maxConservationErrorRaw), maxWarriorGroupErrorRaw: round(maxWarriorGroupErrorRaw),
    scorelessBattlesInferred: scorelessBattles, conservationToleranceRaw: 'max(0.0001, battles * 0.00002)' },
  metric: 'points per battle; not a win rate or a share of total awarded points',
  intervalCaveat: 'Approximate Student-t intervals on observed aggregate blocks or averaged clusters. Block/cohort intervals are descriptive sensitivity analyses; cohorts are fixed, not random samples of all possible opposition. Fresh seed-mean intervals use four disjoint engine seed batches conditional on this field. Screen seed ranges overlap, so screen/pooled seed intervals are suppressed. Battles within a block are not observed independently. Extras were added later and their multiple comparisons are exploratory, without multiplicity correction.',
  seedDiagnostics: { screen: seedRangeDiagnostics(protocol.seeds.screen, 50), fresh: seedRangeDiagnostics(protocol.seeds.fresh, 50), duels: seedRangeDiagnostics(protocol.seeds.duel, 125) },
  fields, duels, ...(extras ? { extraComparisons } : {}),
}, null, 2));
