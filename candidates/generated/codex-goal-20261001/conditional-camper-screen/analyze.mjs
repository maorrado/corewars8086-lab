import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const assert = (ok, message) => { if (!ok) throw Error(message); };
const equal = (a, b, message) => assert(JSON.stringify(a) === JSON.stringify(b), message);
const near = (a, b, tolerance, message) => assert(Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance, message);
const sum = values => values.reduce((a, b) => a + b, 0);
const mean = values => sum(values) / values.length;
const round = value => Number(value.toFixed(9));
const normalized = file => path.resolve(file).toLowerCase();
assert(process.argv.length === 2, 'usage: node analyze.mjs (read-only; requires both completed results)');
const manifestFile = path.join(here, 'manifest.json');
const manifestHash = hash(manifestFile);
equal(fs.readFileSync(`${manifestFile}.sha256`, 'utf8').trim(), manifestHash, 'manifest checksum');
const m = read(manifestFile);
equal(m.schemaVersion, 1, 'manifest schema');
equal(m.experimentId, 'codex-goal-20261001-conditional-camper-screen', 'experiment');
equal(m.protocol.battlesPerArm, 200, 'expected arm size');
equal(m.protocol.arms, ['control', 'camper'], 'expected arms');
equal(m.configs.map(c => c.arm), ['control', 'camper'], 'configuration membership');
for (const r of [...Object.values(m.references), m.source, m.assemblyManifest, ...m.authoring, ...m.binaries]) {
  equal(fs.statSync(r.path).size, r.bytes, `current length ${r.path}`);
  equal(hash(r.path), r.sha256, `current hash ${r.path}`);
}
const binaryMap = new Map(m.binaries.map(r => [normalized(r.path), r]));
const loaded = new Map();
let verifiedRuns = 0;
let verifiedStagedInputs = 0;
function parseScores(text) {
  const score = { groups: {}, warriors: {} }; let section;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim(); if (!line) continue;
    if (line === 'Groups:') { section = 'groups'; continue; }
    if (line === 'Warriors:') { section = 'warriors'; continue; }
    const at = line.lastIndexOf(','); const name = line.slice(0, at); const value = Number(line.slice(at + 1));
    assert(section && at > 0 && Number.isFinite(value) && !Object.hasOwn(score[section], name), 'invalid raw score');
    score[section][name] = value;
  }
  return score;
}
for (const entry of m.configs) {
  equal(hash(entry.path), entry.sha256, 'config hash');
  const c = read(entry.path); const r = read(c.outputPath);
  equal(c.candidate.name, 'COD_pair', 'candidate label');
  equal(c.battles, 25, 'block battles'); equal(c.threads, 1, 'threads'); equal(c.parallel, false, 'parallel');
  equal(c.telemetry, false, 'telemetry config'); equal(c.seeds, m.protocol.seeds, 'seeds');
  equal(c.cohorts.map(co => co.id), m.protocol.cohorts, 'cohorts');
  equal(r.schemaVersion, 1, 'result schema'); equal(r.experimentId, c.experimentId, 'result ID');
  equal(normalized(r.configPath), normalized(entry.path), 'recorded config path');
  equal(r.configSha256, entry.sha256, 'recorded config hash');
  equal(r.engineJar.sha256, m.references.engine.sha256, 'recorded engine hash');
  equal(normalized(r.engineJar.path), normalized(c.jar), 'recorded engine path');
  equal(r.runs.length, 8, 'complete run count');
  const blocks = new Map(r.runs.map(run => [run.runId, run])); equal(blocks.size, 8, 'unique run count');
  for (const cohort of c.cohorts) for (const seed of c.seeds) {
    const id = `${cohort.id}__${seed}`, run = blocks.get(id); assert(run, 'missing block');
    equal(run.cohortId, cohort.id, 'cohort ID'); equal(run.seed, seed, 'run seed'); equal(run.battles, 25, 'run battles');
    assert(Number.isFinite(Date.parse(run.startedAt)) && Date.parse(run.startedAt) >= Date.parse(m.frozenAt), 'run before freeze');
    equal(run.telemetry, null, 'run telemetry');
    const lines = run.stdout.split(/\r?\n/).map(s => s.trim());
    equal(lines.filter(s => s.startsWith('Starting competition ')), ['Starting competition (25 wars).'], 'actual started battles');
    equal(lines.filter(s => s.startsWith('Competition is over.')), ['Competition is over. Ran 25 wars'], 'actual completed battles');
    const runDir = path.join(c.runDirectory, id), warriors = path.join(runDir, 'survivors'), zombies = path.join(runDir, 'zombies');
    equal(normalized(run.command.executable), normalized(c.java), 'Java command');
    equal(run.command.args, ['-jar', c.jar, '--headless', '--comboSize', '4', '--battlesPerCombo', '25', '--seed', seed, '--threads', '1', '--warriorsDir', warriors, '--zombiesDir', zombies, '--outputFile', path.join(runDir, 'scores.csv'), '--parallel=false'], 'exact command');
    const teams = [c.candidate, ...cohort.opponents], names = teams.map(t => t.name), warriorNames = teams.flatMap(t => [t.name + '1', t.name + '2']);
    equal(names.length, 4, 'four teams'); equal(Object.keys(run.inputs).sort(), [...names].sort(), 'team membership');
    equal(fs.readdirSync(warriors).sort(), [...warriorNames].sort(), 'staged warrior membership');
    equal(fs.readdirSync(zombies).sort(), c.zombies.map(z => z.name).sort(), 'staged Zombie membership');
    function verify(input, source, target) {
      const expected = binaryMap.get(normalized(source)); assert(expected, 'unfrozen input');
      equal(normalized(input.source), normalized(source), 'input source'); equal(normalized(input.target), normalized(target), 'input target');
      equal(input.sha256, expected.sha256, 'recorded input hash'); equal(input.bytes, expected.bytes, 'recorded input length');
      equal(fs.statSync(target).size, expected.bytes, 'staged length'); equal(hash(target), expected.sha256, 'staged hash'); verifiedStagedInputs++;
    }
    for (const team of teams) { equal(run.inputs[team.name].length, 2, 'pair size'); team.warriors.forEach((file, i) => verify(run.inputs[team.name][i], file, path.join(warriors, team.name + (i + 1)))); }
    equal(run.zombies.length, 4, 'Zombie count');
    c.zombies.forEach((z, i) => { equal(run.zombies[i].name, z.name, 'Zombie name'); verify(run.zombies[i], z.path, path.join(zombies, z.name)); });
    equal(run.rawScoreText, fs.readFileSync(path.join(runDir, 'scores.csv'), 'utf8'), 'retained CSV');
    const score = parseScores(run.rawScoreText);
    for (const section of ['groups', 'warriors']) {
      equal(Object.keys(score[section]).sort(), [...(section === 'groups' ? names : warriorNames)].sort(), 'score membership');
      equal(Object.keys(run.scores[section]).sort(), Object.keys(score[section]).sort(), 'result score membership');
      for (const [name, value] of Object.entries(score[section])) { near(value, run.scores[section][name], 0, 'raw score equality'); assert(value >= 0 && value <= 25.0005, 'score range'); }
    }
    const total = sum(Object.values(score.groups)), integer = Math.round(total);
    assert(integer >= 0 && integer <= 25, 'awarded total bounds'); near(total, integer, 0.0005, 'integer awarded total');
    near(sum(Object.values(score.warriors)), total, 0.0005, 'warrior total');
    for (const name of names) near(score.warriors[name + '1'] + score.warriors[name + '2'], score.groups[name], 0.0005, 'warrior/team agreement');
    for (const [field, value] of [['team', score.groups.COD_pair], ['warrior1', score.warriors.COD_pair1], ['warrior2', score.warriors.COD_pair2]]) {
      near(run.candidate[field + 'Raw'], value, 1e-10, 'candidate raw score'); near(run.candidate[field + 'PerBattle'], value / 25, 1e-10, 'candidate normalization');
    }
    equal(read(path.join(runDir, 'run.json')), run, 'retained run record'); verifiedRuns++;
  }
  equal(r.aggregate.battles, 200, 'aggregate battle count');
  for (const field of ['team', 'warrior1', 'warrior2']) near(r.aggregate[field + 'PerBattle'], sum(r.runs.map(run => run.candidate[field + 'Raw'])) / 200, 1e-10, 'aggregate score');
  loaded.set(entry.arm, { config: c, result: r, blocks });
}
const control = loaded.get('control'), camper = loaded.get('camper');
equal(control.config.cohorts, camper.config.cohorts, 'paired cohorts'); equal(control.config.zombies, camper.config.zombies, 'paired Zombies');
equal(control.config.candidate.warriors[0], camper.config.candidate.warriors[0], 'same exact A');
const deltas = [...camper.blocks].map(([id, r]) => ({ cohort: r.cohortId, seed: r.seed, delta: r.candidate.teamPerBattle - control.blocks.get(id).candidate.teamPerBattle }));
const grouped = key => [...new Set(deltas.map(d => d[key]))].map(value => ({ [key]: value, delta: round(mean(deltas.filter(d => d[key] === value).map(d => d.delta))) }));
console.log(JSON.stringify({ manifestSha256: manifestHash, validation: { verifiedRuns, verifiedStagedInputs, battlesPerArm: 200 },
  pointsPerBattle: { control: round(control.result.aggregate.teamPerBattle), camper: round(camper.result.aggregate.teamPerBattle) },
  camperMinusControl: round(mean(deltas.map(d => d.delta))), bySeed: grouped('seed'), byCohort: grouped('cohort'),
  interpretation: 'Descriptive screen on four selected senior triples, not proof of broad improvement. No per-battle win rates or inferential interval are available from this small screen.' }, null, 2));
