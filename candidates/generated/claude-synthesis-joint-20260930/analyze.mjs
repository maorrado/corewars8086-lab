import fs from 'node:fs';
import path from 'node:path';
import {
  here, audit, manifestPath, priorManifestPath, priorManifestHash, sha, hashFile, readJson, jsonText,
  assert, equal, rootPath, relativeRoot, variants, readProtocol, makeConfigs,
} from './protocol.mjs';

const selection = process.argv[2] ?? 'all';
assert(process.argv.length <= 3 && ['all', 'orientation-1', 'orientation-2', 'orientation-3'].includes(selection),
  'usage: node candidates/generated/claude-synthesis-joint-20260930/analyze.mjs [all|orientation-1|orientation-2|orientation-3]');
const protocol = readProtocol();
const allEntries = makeConfigs(protocol);
const manifestBytes = fs.readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes);
const manifestHash = sha(manifestBytes);
equal(fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim(), manifestHash, 'joint manifest hash');
assert(manifest.schemaVersion === 1 && manifest.audit === audit, 'incorrect joint manifest');
equal(manifest.priorManifest, { path: priorManifestPath, sha256: priorManifestHash }, 'prior audit linkage');
equal(manifest.variants, variants, 'exact binary variant mapping');
equal(manifest.binaries, protocol.prior.binaries, 'exact frozen binary manifest');
equal(manifest.sources, protocol.prior.sources, 'exact frozen source manifest');
for (const field of ['engine', 'java', 'runner', 'base']) equal(manifest[field], protocol.prior[field], `${field} manifest`);
equal(manifest.protocol, {
  publishedTeams: 75, contenders: 3, orientations: 3, seeds: protocol.seeds,
  battlesPerBlock: 10, battlesPerOrientation: 2250, battlesTotal: 6750,
  threads: 1, parallel: false, telemetry: false,
  seedRanges: protocol.seedRanges, previousSeedRanges: protocol.previousSeedRanges,
}, 'exact joint protocol');
equal(manifest.configs, allEntries.map(({ config, ...metadata }) => ({ ...metadata, sha256: sha(jsonText(config)) })), 'complete configuration manifest');
equal(manifest.authoringFiles.map(record => record.path), ['seeds.json', 'protocol.mjs', 'generate.mjs'].map(file => relativeRoot(path.join(here, file))), 'authoring file set');
for (const record of manifest.authoringFiles) {
  equal(fs.statSync(rootPath(record.path)).size, record.bytes, `${record.path} length`);
  equal(hashFile(rootPath(record.path)), record.sha256, `${record.path} hash`);
}
const binaryMap = new Map(manifest.binaries.map(record => [record.path, record]));
assert(binaryMap.size === 160, 'duplicate or missing input binaries');
const normalizePath = file => process.platform === 'win32' ? path.resolve(file).toLowerCase() : path.resolve(file);
const samePath = (actual, expected, label) => equal(normalizePath(actual), normalizePath(expected), label);
const near = (actual, expected, tolerance, label) => {
  assert(Number.isFinite(actual) && Number.isFinite(expected) && Math.abs(actual - expected) <= tolerance,
    `${label}: ${actual} differs from ${expected} (tolerance ${tolerance})`);
};
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
    assert(comma > 0, 'invalid score CSV row');
    const name = line.slice(0, comma);
    const value = Number(line.slice(comma + 1));
    assert(Number.isFinite(value) && !Object.hasOwn(scores[section], name), `invalid or duplicate score ${name}`);
    scores[section][name] = value;
  }
  return scores;
}

const entries = allEntries.filter(entry => selection === 'all' || entry.id === selection);
const blocks = [];
let checkedArchivedBinaries = 0;
let maximumIntegerConservationError = 0;
let maximumWarriorGroupError = 0;
let scorelessBattles = 0;
for (const entry of entries) {
  const config = entry.config;
  const configFile = path.join(here, entry.configPath);
  const configHash = manifest.configs.find(record => record.id === entry.id).sha256;
  equal(hashFile(configFile), configHash, `${entry.id} config hash`);
  equal(readJson(configFile), config, `${entry.id} exact configuration`);
  const resultFile = path.resolve(here, config.outputPath);
  const result = readJson(resultFile);
  assert(result.schemaVersion === 1, `${entry.id} result schema`);
  equal(result.experimentId, config.experimentId, `${entry.id} experiment ID`);
  equal(result.configSha256, configHash, `${entry.id} recorded config hash`);
  samePath(result.configPath, configFile, `${entry.id} recorded config path`);
  equal(result.engineJar.sha256, manifest.engine.sha256, `${entry.id} recorded engine hash`);
  samePath(result.engineJar.path, rootPath(manifest.engine.path), `${entry.id} engine path`);
  assert(result.runs.length === 225, `${entry.id} expected 225 cohort-seed blocks`);
  const runs = new Map(result.runs.map(run => [run.runId, run]));
  assert(runs.size === 225, `${entry.id} duplicate run IDs`);
  for (const cohort of config.cohorts) for (const seed of config.seeds) {
    const runId = `${cohort.id}__${seed}`;
    const run = runs.get(runId);
    assert(run, `${entry.id} missing ${runId}`);
    equal(run.cohortId, cohort.id, `${runId} cohort`);
    equal(run.seed, seed, `${runId} seed`);
    equal(run.battles, 10, `${runId} configured battle count`);
    assert(Number.isFinite(Date.parse(run.startedAt)) && Date.parse(run.startedAt) >= Date.parse(manifest.frozenAt), `${runId} run before input freeze`);
    assert(Number.isFinite(run.elapsedSeconds) && run.elapsedSeconds >= 0, `${runId} invalid elapsed time`);
    equal(run.telemetry, null, `${runId} telemetry`);
    const stdoutLines = run.stdout.split(/\r?\n/).map(line => line.trim());
    equal(stdoutLines.filter(line => line.startsWith('Starting competition ')), ['Starting competition (10 wars).'], `${runId} actual started wars`);
    equal(stdoutLines.filter(line => line.startsWith('Competition is over.')), ['Competition is over. Ran 10 wars'], `${runId} actual completed wars`);
    const runDir = path.resolve(here, config.runDirectory, runId);
    const warriorDir = path.join(runDir, 'survivors');
    const zombieDir = path.join(runDir, 'zombies');
    samePath(run.command.executable, rootPath(manifest.java.path), `${runId} Java executable`);
    equal(run.command.args, [
      '-jar', rootPath(manifest.engine.path), '--headless', '--comboSize', '4',
      '--battlesPerCombo', '10', '--seed', seed, '--threads', '1',
      '--warriorsDir', warriorDir, '--zombiesDir', zombieDir,
      '--outputFile', path.join(runDir, 'scores.csv'), '--parallel=false',
    ], `${runId} exact command`);
    const teams = [config.candidate, ...cohort.opponents];
    const teamNames = teams.map(team => team.name);
    const warriorNames = teams.flatMap(team => [`${team.name}1`, `${team.name}2`]);
    equal(Object.keys(run.inputs).sort(), [...teamNames].sort(), `${runId} input team membership`);
    equal(fs.readdirSync(warriorDir).sort(), [...warriorNames].sort(), `${runId} archived warrior membership`);
    equal(fs.readdirSync(zombieDir).sort(), config.zombies.map(zombie => zombie.name).sort(), `${runId} archived Zombie membership`);
    function verifyInput(input, sourceRelative, target, label) {
      const source = path.resolve(here, sourceRelative);
      const expected = binaryMap.get(relativeRoot(source));
      assert(expected, `${label} missing from binary manifest`);
      samePath(input.source, source, `${label} source`);
      samePath(input.target, target, `${label} target`);
      equal(input.bytes, expected.bytes, `${label} recorded length`);
      equal(input.sha256, expected.sha256, `${label} recorded hash`);
      equal(fs.statSync(target).size, expected.bytes, `${label} copied length`);
      equal(hashFile(target), expected.sha256, `${label} copied hash`);
      checkedArchivedBinaries++;
    }
    for (const team of teams) {
      assert(run.inputs[team.name].length === 2, `${runId} wrong warrior count`);
      team.warriors.forEach((file, index) => verifyInput(run.inputs[team.name][index], file,
        path.join(warriorDir, `${team.name}${index + 1}`), `${runId}:${team.name}${index + 1}`));
    }
    assert(run.zombies.length === 4, `${runId} wrong Zombie count`);
    config.zombies.forEach((zombie, index) => {
      equal(run.zombies[index].name, zombie.name, `${runId} Zombie name/order`);
      verifyInput(run.zombies[index], zombie.path, path.join(zombieDir, zombie.name), `${runId}:${zombie.name}`);
    });
    equal(run.rawScoreText, fs.readFileSync(path.join(runDir, 'scores.csv'), 'utf8'), `${runId} retained CSV`);
    const scores = parseScores(run.rawScoreText);
    for (const section of ['groups', 'warriors']) {
      const names = section === 'groups' ? teamNames : warriorNames;
      equal(Object.keys(scores[section]).sort(), [...names].sort(), `${runId} CSV ${section} membership`);
      equal(Object.keys(run.scores[section]).sort(), [...names].sort(), `${runId} result ${section} membership`);
      for (const name of names) {
        near(run.scores[section][name], scores[section][name], 0, `${runId}:${name} score`);
        assert(scores[section][name] >= 0 && scores[section][name] <= 10.0002, `${runId}:${name} score outside bounds`);
      }
    }
    const tolerance = 0.0002;
    const awarded = sum(Object.values(scores.groups));
    const roundedAwarded = Math.round(awarded);
    assert(roundedAwarded >= 0 && roundedAwarded <= 10, `${runId} total score outside battle bounds`);
    maximumIntegerConservationError = Math.max(maximumIntegerConservationError, Math.abs(awarded - roundedAwarded));
    near(awarded, roundedAwarded, tolerance, `${runId} integer awarded-point conservation`);
    near(sum(Object.values(scores.warriors)), awarded, tolerance, `${runId} warrior/group score conservation`);
    for (const name of teamNames) {
      const warriorTotal = scores.warriors[`${name}1`] + scores.warriors[`${name}2`];
      maximumWarriorGroupError = Math.max(maximumWarriorGroupError, Math.abs(warriorTotal - scores.groups[name]));
      near(warriorTotal, scores.groups[name], tolerance, `${runId}:${name} team/warrior conservation`);
    }
    scorelessBattles += 10 - roundedAwarded;
    for (const [field, score] of [
      ['team', scores.groups.COD_A], ['warrior1', scores.warriors.COD_A1], ['warrior2', scores.warriors.COD_A2],
    ]) {
      near(run.candidate[`${field}Raw`], score, 1e-10, `${runId} candidate ${field} raw`);
      near(run.candidate[`${field}PerBattle`], score / 10, 1e-10, `${runId} candidate ${field} normalization`);
    }
    equal(readJson(path.join(runDir, 'run.json')), run, `${runId} retained run record`);
    // Attribute COD labels through this orientation's frozen binary mapping.
    const contenderScores = Object.fromEntries(Object.entries(entry.mapping).map(([label, variant]) => [variant, scores.groups[label] / 10]));
    blocks.push({
      orientation: entry.id, cohort: cohort.id, fieldTeam: cohort.opponents[2].name, seed,
      scores: contenderScores, fieldScore: scores.groups[cohort.opponents[2].name] / 10,
      scoreless: 10 - roundedAwarded,
    });
  }
  equal(result.aggregate.battles, 2250, `${entry.id} aggregate battles`);
  equal(sum(result.runs.map(run => run.battles)), 2250, `${entry.id} actual configured battles sum`);
  for (const field of ['team', 'warrior1', 'warrior2']) near(result.aggregate[`${field}PerBattle`],
    sum(result.runs.map(run => run.candidate[`${field}Raw`])) / 2250, 1e-10, `${entry.id} aggregate ${field}`);
}

const contenderNames = Object.keys(variants);
const pairs = [['submitted', 'm049'], ['submitted', 'm050'], ['m050', 'm049']];
function interval(values) {
  const estimate = mean(values);
  if (values.length < 2) return { units: values.length, mean: round(estimate), ci95: null };
  const df = values.length - 1;
  const t = df === 2 ? 4.302652729911275 : df === 74 ? 1.992543494846819 : (() => {
    const z = 1.959963984540054;
    return z + (z ** 3 + z) / (4 * df) + (5 * z ** 5 + 16 * z ** 3 + 3 * z) / (96 * df ** 2)
      + (3 * z ** 7 + 19 * z ** 5 + 17 * z ** 3 - 15 * z) / (384 * df ** 3);
  })();
  const se = Math.sqrt(sum(values.map(value => (value - estimate) ** 2)) / df / values.length);
  return { units: values.length, mean: round(estimate), ci95: [round(estimate - t * se), round(estimate + t * se)] };
}
function grouped(selected, key) {
  const groups = new Map();
  for (const block of selected) {
    if (!groups.has(block[key])) groups.set(block[key], []);
    groups.get(block[key]).push(block);
  }
  return [...groups];
}
function scoreSummary(selected) {
  return {
    battles: selected.length * 10,
    pointsPerBattle: Object.fromEntries(contenderNames.map(name => [name, round(mean(selected.map(block => block.scores[name])))])),
    publishedOpponentPointsPerBattle: round(mean(selected.map(block => block.fieldScore))),
    scorelessBattlesInferred: sum(selected.map(block => block.scoreless)),
    pairedDeltas: Object.fromEntries(pairs.map(([left, right]) => [`${left}-minus-${right}`, round(mean(selected.map(block => block.scores[left] - block.scores[right])))])),
  };
}
const comparisons = pairs.map(([left, right]) => {
  const delta = block => block.scores[left] - block.scores[right];
  return {
    pair: `${left}-minus-${right}`,
    pointsPerBattleDelta: round(mean(blocks.map(delta))),
    cohortMeanDescriptiveT: interval(grouped(blocks, 'cohort').map(([, group]) => mean(group.map(delta)))),
    seedMeanConditionalT: interval(grouped(blocks, 'seed').map(([, group]) => mean(group.map(delta)))),
  };
});
console.log(JSON.stringify({
  audit, selection, completeCyclicBalance: selection === 'all', manifestSha256: manifestHash,
  engineSha256: manifest.engine.sha256,
  validation: {
    configurations: entries.length, blocks: blocks.length, battles: blocks.length * 10,
    currentBinaryInputs: binaryMap.size, archivedBinaryInputs: checkedArchivedBinaries,
    allStartedAndCompletedBattleCountsMatched: true, freshSeedRangesDisjointFromPriorAudit: true,
    maximumIntegerConservationError: round(maximumIntegerConservationError), maximumWarriorGroupError: round(maximumWarriorGroupError),
    scorelessBattlesInferred: scorelessBattles, rawScoreConservationTolerance: 0.0002,
  },
  metric: 'points per battle, not a win percentage or share of all awarded points',
  interpretation: 'Three cyclic name/order mappings, not all six permutations. Paired deltas compare contenders present in the same four-team battles. Cohort intervals are descriptive across the fixed 75 published opponents; seed intervals use three independent seed batches conditional on this fixed field and mapping set (Student-t df=2). Ten-battle aggregates are individual observed blocks, not ten observed per-battle outcomes. Multiple comparisons are unadjusted.',
  mappings: entries.map(entry => ({ orientation: entry.id, mapping: entry.mapping })),
  seedRanges: protocol.seedRanges,
  aggregate: scoreSummary(blocks), comparisons,
  bySeed: grouped(blocks, 'seed').map(([seed, group]) => ({ seed, ...scoreSummary(group) })),
  byOrientation: grouped(blocks, 'orientation').map(([orientation, group]) => ({ orientation, ...scoreSummary(group) })),
  bySeedAndOrientation: grouped(blocks, 'orientation').flatMap(([orientation, selected]) =>
    grouped(selected, 'seed').map(([seed, group]) => ({ orientation, seed, ...scoreSummary(group) }))),
}, null, 2));
