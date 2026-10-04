import fs from 'node:fs';
import path from 'node:path';
import {
  here, suite, manifestPath, assert, equal, sha, hashFile, readJson, jsonText,
  rootPath, relativeRoot, fileRecord, referenceHashes, originalVariants, localVariants,
  authoredFiles, algorithm, decisionPlan, readProtocol, makeConfigs,
} from './protocol.mjs';

assert(process.argv.length === 2, 'usage: node candidates/generated/codex-goal-20261001/lea-confirmation/analyze.mjs');
const protocol = readProtocol();
const entries = makeConfigs(protocol);
const manifestBytes = fs.readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes);
const manifestHash = sha(manifestBytes);
equal(fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim(), manifestHash, 'manifest hash');
assert(manifest.schemaVersion === 1 && manifest.suite === suite, 'wrong confirmation manifest');
equal(manifest.design, { panels: 2, cohortsPerPanel: 25, uniqueSeniorTeams: 62, slotsPerPanel: 75,
  repeatedTeamsPerPanel: 13, seedsPerPanel: 2, battlesPerBlock: 50, battlesPerPanelArm: 2500,
  battlesPerArm: 5000, arms: ['c090', 'm049', 'm050'], candidateName: 'COD_pair', threads: 1, parallel: false, telemetry: false }, 'exact frozen design');
equal(manifest.decisionPlan, decisionPlan, 'decision plan');
equal(manifest.panelAlgorithm, algorithm, 'panel generation algorithm');
equal(manifest.panels, protocol.panels, 'recomputed panels, repeats, salts and seeds');
equal(manifest.engineSeedRanges, protocol.ranges, 'new seed ranges');
equal(manifest.excludedPriorEngineSeedRanges, protocol.priorRanges, 'excluded prior seed ranges');
equal(manifest.references, Object.keys(referenceHashes).map(fileRecord), 'frozen source references');
equal(manifest.sourceVariants, originalVariants, 'source variants');
equal(manifest.variants, localVariants, 'immutable local variant paths');
equal(manifest.sourceBinaries, protocol.sourceBinaries, 'frozen source binary hashes');
equal(manifest.c090Sources, protocol.c090Sources, 'c090 source hashes');
for (const field of ['engine', 'java', 'runner']) equal(manifest[field], protocol.original[field], `${field} identity`);
equal(manifest.authoringFiles.map(record => record.path), authoredFiles.map(file => relativeRoot(path.join(here, file))), 'frozen authoring file membership');
for (const record of manifest.authoringFiles) equal(fileRecord(record.path), record, `${record.path} authoring hash`);
equal(manifest.configs, entries.map(({ config, ...metadata }) => ({ ...metadata, sha256: sha(jsonText(config)) })), 'complete frozen config set');
const sourceMap = new Map(protocol.sourceBinaries.map(record => [record.path, record]));
const expectedCopies = Object.entries(originalVariants).flatMap(([variant, sources]) => sources.map((source, index) => ({
  ...sourceMap.get(source), path: relativeRoot(path.join(here, localVariants[variant][index])),
})));
equal(manifest.inputs, [...expectedCopies, ...protocol.fieldBinaries], 'exact immutable-copy and field input manifest');
assert(manifest.inputs.length === 134, 'wrong number of input files');
for (const record of manifest.inputs) equal(fileRecord(record.path), record, `${record.path} current input hash`);
const inputMap = new Map(manifest.inputs.map(record => [record.path, record]));
assert(inputMap.size === 134, 'duplicate input manifest entries');

const normalizePath = file => process.platform === 'win32' ? path.resolve(file).toLowerCase() : path.resolve(file);
const samePath = (actual, expected, label) => equal(normalizePath(actual), normalizePath(expected), label);
const near = (actual, expected, tolerance, label) => {
  assert(Number.isFinite(actual) && Number.isFinite(expected) && Math.abs(actual - expected) <= tolerance,
    `${label}: ${actual} differs from ${expected}, tolerance ${tolerance}`);
};
const sum = values => values.reduce((total, value) => total + value, 0);
const mean = values => sum(values) / values.length;
const round = value => Number(value.toFixed(12));
function parseScores(text) {
  const scores = { groups: {}, warriors: {} };
  let section;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line === 'Groups:') { section = 'groups'; continue; }
    if (line === 'Warriors:') { section = 'warriors'; continue; }
    assert(section, 'score before CSV section');
    const comma = line.lastIndexOf(',');
    assert(comma > 0, 'malformed score row');
    const name = line.slice(0, comma);
    const value = Number(line.slice(comma + 1));
    assert(Number.isFinite(value) && !Object.hasOwn(scores[section], name), `duplicate or invalid score ${name}`);
    scores[section][name] = value;
  }
  return scores;
}

const results = new Map();
let archivedInputsChecked = 0;
let maximumConservationError = 0;
let maximumTeamWarriorError = 0;
const scorelessByArm = { c090: 0, m049: 0, m050: 0 };
for (const entry of entries) {
  const config = entry.config;
  const configPath = path.join(here, entry.configPath);
  const configHash = manifest.configs.find(record => record.id === entry.id).sha256;
  equal(hashFile(configPath), configHash, `${entry.id} current config hash`);
  equal(readJson(configPath), config, `${entry.id} exact configuration`);
  const resultPath = path.resolve(here, config.outputPath);
  const result = readJson(resultPath);
  assert(result.schemaVersion === 1, `${entry.id} result schema`);
  equal(result.experimentId, config.experimentId, `${entry.id} experiment identity`);
  equal(result.configSha256, configHash, `${entry.id} recorded config hash`);
  samePath(result.configPath, configPath, `${entry.id} config path`);
  equal(result.engineJar.sha256, manifest.engine.sha256, `${entry.id} engine hash`);
  samePath(result.engineJar.path, rootPath(manifest.engine.path), `${entry.id} engine path`);
  assert(result.runs.length === 50, `${entry.id} incomplete 50-block result`);
  const runs = new Map(result.runs.map(run => [run.runId, run]));
  assert(runs.size === 50, `${entry.id} duplicate run IDs`);
  for (const cohort of config.cohorts) for (const seed of config.seeds) {
    const runId = `${cohort.id}__${seed}`;
    const run = runs.get(runId);
    assert(run, `${entry.id} missing ${runId}`);
    equal(run.cohortId, cohort.id, `${runId} cohort`);
    equal(run.seed, seed, `${runId} seed`);
    equal(run.battles, 50, `${runId} configured battle count`);
    assert(Number.isFinite(Date.parse(run.startedAt)) && Date.parse(run.startedAt) >= Date.parse(manifest.frozenAt), `${runId} predates confirmation freeze`);
    assert(Number.isFinite(run.elapsedSeconds) && run.elapsedSeconds >= 0, `${runId} invalid duration`);
    equal(run.telemetry, null, `${runId} telemetry`);
    const stdoutLines = run.stdout.split(/\r?\n/).map(line => line.trim());
    equal(stdoutLines.filter(line => line.startsWith('Starting competition ')), ['Starting competition (50 wars).'], `${runId} actual started wars`);
    equal(stdoutLines.filter(line => line.startsWith('Competition is over.')), ['Competition is over. Ran 50 wars'], `${runId} actual completed wars`);
    const runDirectory = path.resolve(here, config.runDirectory, runId);
    const warriorDirectory = path.join(runDirectory, 'survivors');
    const zombieDirectory = path.join(runDirectory, 'zombies');
    samePath(run.command.executable, rootPath(manifest.java.path), `${runId} Java executable`);
    equal(run.command.args, [
      '-jar', rootPath(manifest.engine.path), '--headless', '--comboSize', '4', '--battlesPerCombo', '50',
      '--seed', seed, '--threads', '1', '--warriorsDir', warriorDirectory,
      '--zombiesDir', zombieDirectory, '--outputFile', path.join(runDirectory, 'scores.csv'), '--parallel=false',
    ], `${runId} execution command`);
    const teams = [config.candidate, ...cohort.opponents];
    const teamNames = teams.map(team => team.name);
    const warriorNames = teams.flatMap(team => [`${team.name}1`, `${team.name}2`]);
    equal(Object.keys(run.inputs).sort(), [...teamNames].sort(), `${runId} team membership`);
    equal(fs.readdirSync(warriorDirectory).sort(), [...warriorNames].sort(), `${runId} archived warrior membership`);
    equal(fs.readdirSync(zombieDirectory).sort(), config.zombies.map(zombie => zombie.name).sort(), `${runId} archived Zombie membership`);
    function validateInput(input, sourceRelative, destination, label) {
      const source = path.resolve(here, sourceRelative);
      const expected = inputMap.get(relativeRoot(source));
      assert(expected, `${label} missing from frozen input manifest`);
      samePath(input.source, source, `${label} recorded source`);
      samePath(input.target, destination, `${label} recorded target`);
      equal(input.bytes, expected.bytes, `${label} recorded size`);
      equal(input.sha256, expected.sha256, `${label} recorded hash`);
      equal(fs.statSync(destination).size, expected.bytes, `${label} archived size`);
      equal(hashFile(destination), expected.sha256, `${label} archived hash`);
      archivedInputsChecked++;
    }
    for (const team of teams) {
      assert(run.inputs[team.name].length === 2, `${runId} wrong warrior count`);
      team.warriors.forEach((file, index) => validateInput(run.inputs[team.name][index], file,
        path.join(warriorDirectory, `${team.name}${index + 1}`), `${runId}:${team.name}${index + 1}`));
    }
    assert(run.zombies.length === 4, `${runId} wrong Zombie count`);
    config.zombies.forEach((zombie, index) => {
      equal(run.zombies[index].name, zombie.name, `${runId} Zombie identity/order`);
      validateInput(run.zombies[index], zombie.path, path.join(zombieDirectory, zombie.name), `${runId}:${zombie.name}`);
    });
    equal(run.rawScoreText, fs.readFileSync(path.join(runDirectory, 'scores.csv'), 'utf8'), `${runId} retained CSV`);
    const scores = parseScores(run.rawScoreText);
    for (const section of ['groups', 'warriors']) {
      const names = section === 'groups' ? teamNames : warriorNames;
      equal(Object.keys(scores[section]).sort(), [...names].sort(), `${runId} CSV ${section} membership`);
      equal(Object.keys(run.scores[section]).sort(), [...names].sort(), `${runId} recorded ${section} membership`);
      for (const name of names) {
        near(run.scores[section][name], scores[section][name], 0, `${runId}:${name} recorded score`);
        assert(scores[section][name] >= 0 && scores[section][name] <= 50.001, `${runId}:${name} score outside bounds`);
      }
    }
    const awarded = sum(Object.values(scores.groups));
    const roundedAwarded = Math.round(awarded);
    assert(roundedAwarded >= 0 && roundedAwarded <= 50, `${runId} awarded score outside battle bounds`);
    maximumConservationError = Math.max(maximumConservationError, Math.abs(awarded - roundedAwarded));
    near(awarded, roundedAwarded, 0.001, `${runId} integer awarded score conservation`);
    near(sum(Object.values(scores.warriors)), awarded, 0.001, `${runId} total warrior/group conservation`);
    for (const team of teamNames) {
      const combined = scores.warriors[`${team}1`] + scores.warriors[`${team}2`];
      maximumTeamWarriorError = Math.max(maximumTeamWarriorError, Math.abs(combined - scores.groups[team]));
      near(combined, scores.groups[team], 0.001, `${runId}:${team} team/warrior conservation`);
    }
    scorelessByArm[entry.variant] += 50 - roundedAwarded;
    for (const [field, raw] of [
      ['team', scores.groups.COD_pair], ['warrior1', scores.warriors.COD_pair1], ['warrior2', scores.warriors.COD_pair2],
    ]) {
      near(run.candidate[`${field}Raw`], raw, 1e-10, `${runId} ${field} raw score`);
      near(run.candidate[`${field}PerBattle`], raw / 50, 1e-10, `${runId} ${field} normalization`);
    }
    equal(readJson(path.join(runDirectory, 'run.json')), run, `${runId} retained run record`);
  }
  equal(result.aggregate.battles, 2500, `${entry.id} aggregate battle count`);
  equal(sum(result.runs.map(run => run.battles)), 2500, `${entry.id} summed battle count`);
  for (const field of ['team', 'warrior1', 'warrior2']) near(result.aggregate[`${field}PerBattle`],
    sum(result.runs.map(run => run.candidate[`${field}Raw`])) / 2500, 1e-10, `${entry.id} aggregate ${field}`);
  results.set(entry.id, { entry, result, runs });
}

function groupValues(blocks, key) {
  const groups = new Map();
  for (const block of blocks) {
    if (!groups.has(block[key])) groups.set(block[key], []);
    groups.get(block[key]).push(block.delta);
  }
  return [...groups].map(([name, values]) => ({ name, blocks: values.length, delta: mean(values) }));
}
const comparisons = ['m049', 'm050'].map(reference => {
  const blocks = [];
  for (const panel of [1, 2]) {
    const candidate = results.get(`panel-${panel}-c090`);
    const baseline = results.get(`panel-${panel}-${reference}`);
    for (const run of candidate.result.runs) {
      const other = baseline.runs.get(run.runId);
      assert(other && other.seed === run.seed && other.cohortId === run.cohortId, `unpaired block ${reference}/${run.runId}`);
      for (const name of Object.keys(run.inputs).filter(name => name !== 'COD_pair')) equal(
        run.inputs[name].map(input => input.sha256), other.inputs[name].map(input => input.sha256), `${run.runId} paired opponent ${name}`);
      equal(run.zombies.map(zombie => zombie.sha256), other.zombies.map(zombie => zombie.sha256), `${run.runId} paired Zombies`);
      blocks.push({ panel, cohort: run.cohortId, seed: run.seed,
        delta: run.candidate.teamPerBattle - other.candidate.teamPerBattle });
    }
  }
  assert(blocks.length === 100, `${reference} needs 100 paired blocks`);
  const cohorts = groupValues(blocks, 'cohort');
  const panels = groupValues(blocks, 'panel');
  const seeds = groupValues(blocks, 'seed');
  assert(cohorts.length === 50 && cohorts.every(cohort => cohort.blocks === 2), `${reference} expected 50 two-seed cohort means`);
  assert(panels.length === 2 && panels.every(panel => panel.blocks === 50), `${reference} expected two balanced panels`);
  assert(seeds.length === 4 && seeds.every(seed => seed.blocks === 25), `${reference} expected four balanced panel-seed slices`);
  const delta = mean(cohorts.map(cohort => cohort.delta));
  near(delta, mean(blocks.map(block => block.delta)), 1e-12, `${reference} cohort/block mean agreement`);
  const se = Math.sqrt(sum(cohorts.map(cohort => (cohort.delta - delta) ** 2)) / 49 / 50);
  const margin = 2.0095752371292397 * se;
  const ci = [delta - margin, delta + margin];
  const gate = {
    pooledMeanPositive: delta > 0,
    cohortCiLowerPositive: ci[0] > 0,
    bothPanelsPositive: panels.every(panel => panel.delta > 0),
    allFourPanelSeedsPositive: seeds.every(seed => seed.delta > 0),
  };
  return {
    reference, pairedBlocks: 100, battlesPerArm: 5000, deltaPointsPerBattle: round(delta),
    cohortClusterApproximate95CI: { clusters: 50, degreesOfFreedom: 49, lower: round(ci[0]), upper: round(ci[1]) },
    byPanel: panels.map(panel => ({ panel: panel.name, pairedBlocks: panel.blocks, deltaPointsPerBattle: round(panel.delta), positive: panel.delta > 0 })),
    byPanelSeed: seeds.map(seed => ({ seed: seed.name, panel: protocol.panels.find(panel => panel.seeds.includes(seed.name)).panel,
      pairedBlocks: seed.blocks, deltaPointsPerBattle: round(seed.delta), positive: seed.delta > 0 })),
    cohortDirections: { positive: cohorts.filter(cohort => cohort.delta > 0).length,
      zero: cohorts.filter(cohort => cohort.delta === 0).length, negative: cohorts.filter(cohort => cohort.delta < 0).length },
    gate, survivesAgainstReference: Object.values(gate).every(Boolean),
  };
});
console.log(JSON.stringify({
  suite, manifestSha256: manifestHash, analyzerSha256: hashFile(path.join(here, 'analyze.mjs')),
  engineSha256: manifest.engine.sha256, decisionPlan,
  validation: { resultFiles: results.size, completeRuns: 300, actualBattles: 15000, frozenInputFiles: 134,
    archivedInputsChecked, maximumConservationError: round(maximumConservationError), maximumTeamWarriorError: round(maximumTeamWarriorError),
    rawConservationTolerance: 0.001, actualStartedAndCompletedBattleCountsVerified: true, allFourNewSeedRangesDisjoint: true },
  pointsPerBattle: Object.fromEntries(Object.keys(localVariants).map(variant => [variant,
    round(mean([1, 2].map(panel => results.get(`panel-${panel}-${variant}`).result.aggregate.teamPerBattle)))])),
  scorelessBattlesInferred: scorelessByArm, comparisons,
  survivesBothReferences: comparisons.every(comparison => comparison.survivesAgainstReference),
  interpretation: 'Team points per battle, not wins. Cohort-cluster intervals are approximate because 50 cohorts reuse a fixed 62-team pool. Panels and seed directions are prespecified consistency checks. Passing supports only this senior-2025 design; a separate transfer/future pool is needed for opponent generalization. Old results are not pooled.',
}, null, 2));
