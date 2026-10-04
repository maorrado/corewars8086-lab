import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  here, audit, rootPath, readProtocol, inputPaths, basePath, runnerPath, javaPath, enginePath, jsonText, assert,
} from './protocol.mjs';
import { extraBinaryPaths, extraSourcePaths } from './extras-protocol.mjs';

// Isolated synthetic fixtures only: this test never invokes Java or uses real result directories.
const fixtureRoot = fs.mkdtempSync(path.join(here, '.selftest-'));
const fixtureHere = path.join(fixtureRoot, 'candidates', 'generated', audit);
const sum = values => values.reduce((total, value) => total + value, 0);
const write = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); };
function node(script, args = []) {
  return execFileSync(process.execPath, [path.join(fixtureHere, script), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 20 * 1024 * 1024 });
}
function mustReject(label, action, expected) {
  let rejected = false;
  try { action(); } catch (error) {
    const errorText = String(error.stderr ?? error.message);
    assert(errorText.includes(expected), `${label}: unexpected rejection ${errorText}`);
    rejected = true;
  }
  assert(rejected, `${label}: corruption was accepted`);
}
function withCorruption(file, mutate, label, expected) {
  const original = fs.readFileSync(file);
  try { fs.writeFileSync(file, mutate(original)); mustReject(label, () => node('analyze.mjs', ['screen']), expected); }
  finally { fs.writeFileSync(file, original); }
}
try {
  const protocol = readProtocol();
  for (const relative of [...inputPaths(protocol), ...Object.values(extraBinaryPaths), ...extraSourcePaths, basePath, runnerPath, javaPath, enginePath]) {
    write(path.join(fixtureRoot, relative), fs.readFileSync(rootPath(relative)));
  }
  for (const name of ['SubmittedA.asm', 'SubmittedB.asm', 'seeds.json', 'protocol.mjs', 'generate.mjs', 'analyze.mjs', 'extras-protocol.mjs', 'extras-generate.mjs', 'extras-analyze.mjs']) {
    write(path.join(fixtureHere, name), fs.readFileSync(path.join(here, name)));
  }
  node('generate.mjs');
  mustReject('generator overwrite', () => node('generate.mjs'), 'refusing to overwrite');
  node('extras-generate.mjs');
  mustReject('extras generator overwrite', () => node('extras-generate.mjs'), 'refusing to overwrite');
  const manifest = JSON.parse(fs.readFileSync(path.join(fixtureHere, 'manifest.json')));
  const extrasManifest = JSON.parse(fs.readFileSync(path.join(fixtureHere, 'extras-manifest.json')));
  const records = new Map([...manifest.binaries, ...extrasManifest.binaries].map(record => [path.normalize(record.path), record]));
  for (const entry of [...manifest.configs, ...extrasManifest.configs]) {
    const configPath = path.join(fixtureHere, entry.configPath);
    const config = JSON.parse(fs.readFileSync(configPath));
    const runs = [];
    for (const [cohortIndex, cohort] of config.cohorts.entries()) {
      for (const [seedIndex, seed] of config.seeds.entries()) {
        const runId = `${cohort.id}__${seed}`;
        const runDir = path.resolve(fixtureHere, config.runDirectory, runId);
        const survivors = path.join(runDir, 'survivors');
        const zombieDir = path.join(runDir, 'zombies');
        const teams = [config.candidate, ...cohort.opponents];
        const inputs = {};
        function copy(relative, target) {
          const source = path.resolve(fixtureHere, relative);
          const record = records.get(path.relative(fixtureRoot, source));
          assert(record, `missing fixture input ${source}`);
          write(target, fs.readFileSync(source));
          return { source, target, bytes: record.bytes, sha256: record.sha256 };
        }
        for (const team of teams) inputs[team.name] = team.warriors.map((file, index) => copy(file, path.join(survivors, `${team.name}${index + 1}`)));
        const zombies = config.zombies.map(zombie => ({ name: zombie.name, ...copy(zombie.path, path.join(zombieDir, zombie.name)) }));
        // Include scoreless battles, cohort heterogeneity and seed heterogeneity.
        const awarded = config.battles - (cohortIndex % 3 === 0 ? 1 : 0);
        const submittedFraction = 0.60 + cohortIndex * 0.001 + seedIndex * 0.004;
        let firstFraction;
        if (entry.phase === 'duels') firstFraction = entry.orientation === 'submitted-first' ? 0.60 : 0.45;
        else firstFraction = entry.variant === 'submitted' ? submittedFraction : entry.variant === 'm049' ? 0.55 : entry.variant === 'm050' ? 0.575 : 0.625;
        const groups = Object.fromEntries(teams.map((team, index) => [team.name, awarded * (index === 0 ? firstFraction : (1 - firstFraction) / (teams.length - 1))]));
        const warriors = Object.fromEntries(teams.flatMap(team => [[`${team.name}1`, groups[team.name] / 2], [`${team.name}2`, groups[team.name] / 2]]));
        const rawScoreText = ['Groups:', ...Object.entries(groups).map(([name, value]) => `${name},${value}`), '', 'Warriors:', ...Object.entries(warriors).map(([name, value]) => `${name},${value}`), ''].join('\n');
        write(path.join(runDir, 'scores.csv'), rawScoreText);
        const candidate = {};
        for (const [name, value] of [['team', groups[config.candidate.name]], ['warrior1', warriors[`${config.candidate.name}1`]], ['warrior2', warriors[`${config.candidate.name}2`]]]) {
          candidate[`${name}Raw`] = value;
          candidate[`${name}PerBattle`] = value / config.battles;
        }
        const run = {
          runId, cohortId: cohort.id, seed, battles: config.battles,
          startedAt: new Date().toISOString(), elapsedSeconds: 0,
          command: { executable: path.resolve(fixtureHere, config.java), args: [
            '-jar', path.resolve(fixtureHere, config.jar), '--headless', '--comboSize', String(teams.length),
            '--battlesPerCombo', String(config.battles), '--seed', seed, '--threads', '1',
            '--warriorsDir', survivors, '--zombiesDir', zombieDir,
            '--outputFile', path.join(runDir, 'scores.csv'), '--parallel=false',
          ] },
          inputs, zombies, scores: { groups, warriors }, candidate, telemetry: null, rawScoreText,
          stdout: `SYNTHETIC TEST FIXTURE\nStarting competition (${config.battles} wars).\nCompetition is over. Ran ${config.battles} wars\n`,
        };
        write(path.join(runDir, 'run.json'), jsonText(run));
        runs.push(run);
      }
    }
    const aggregate = { battles: entry.totalBattles };
    for (const field of ['team', 'warrior1', 'warrior2']) aggregate[`${field}PerBattle`] = sum(runs.map(run => run.candidate[`${field}Raw`])) / entry.totalBattles;
    write(path.resolve(fixtureHere, config.outputPath), jsonText({
      schemaVersion: 1, experimentId: config.experimentId, generatedAt: new Date().toISOString(),
      configPath, configSha256: entry.sha256,
      engineJar: { path: path.resolve(fixtureHere, config.jar), sha256: manifest.engine.sha256 }, aggregate, runs,
    }));
  }
  const all = JSON.parse(node('analyze.mjs', ['all']));
  assert(all.validation.runs === 466 && all.validation.resultFiles === 10, 'incorrect validated run count');
  assert(all.validation.scorelessBattlesInferred > 0, 'scoreless battles not represented');
  assert(all.fields.screen.comparisons[0].pairedBlockApproxT.units === 50, 'per-battle pseudo-replication');
  assert(all.fields.fresh.comparisons[0].pairedBlockApproxT.units === 100, 'wrong fresh block count');
  assert(all.fields.pooled.comparisons[0].cohortClusterApproxT.units === 25, 'wrong pooled cohort count');
  assert(all.fields.pooled.comparisons[0].seedClusterApproxT.units === 6, 'wrong pooled seed count');
  assert(all.fields.screen.comparisons[0].seedClusterApproxT.ci95 === null, 'overlapping screen seed CI not suppressed');
  assert(all.fields.pooled.comparisons[0].seedClusterApproxT.ci95 === null, 'overlapping pooled seed CI not suppressed');
  assert(all.fields.fresh.comparisons[0].seedClusterApproxT.ci95 !== null, 'fresh disjoint seed CI missing');
  assert(all.duels.every(duel => duel.seedClusterApproxT.units === 4 && duel.submittedScorePerBattle > 0.5), 'wrong duel orientation mapping');
  const extraAnalysis = JSON.parse(node('extras-analyze.mjs'));
  assert(extraAnalysis.validation.runs === 700 && extraAnalysis.validation.resultFiles === 7, 'wrong extra/reference counts');
  assert(Object.keys(extraAnalysis.extraComparisons).length === 4, 'missing extra variant');
  assert(Object.values(extraAnalysis.extraComparisons).every(variant => variant.comparisons.length === 3 && variant.comparisons.every(comparison => comparison.seedClusterApproxT.units === 4)), 'wrong extras comparison/seed count');
  const submittedEntry = manifest.configs.find(entry => entry.id === 'screen-submitted');
  const submittedConfig = JSON.parse(fs.readFileSync(path.join(fixtureHere, submittedEntry.configPath)));
  const submittedResultPath = path.resolve(fixtureHere, submittedConfig.outputPath);
  const submittedResult = JSON.parse(fs.readFileSync(submittedResultPath));
  withCorruption(path.join(fixtureHere, submittedEntry.configPath), original => `${original}\n`, 'config hash', 'configuration hash');
  withCorruption(submittedResultPath, original => {
    const result = JSON.parse(original); result.runs[0].inputs.COD_pair[0].sha256 = '0'.repeat(64); return jsonText(result);
  }, 'recorded input hash', 'recorded hash');
  withCorruption(submittedResult.runs[0].inputs.COD_pair[0].target, original => Buffer.concat([original, Buffer.from([0])]), 'copied binary', 'copied binary length');
  withCorruption(submittedResultPath, original => {
    const result = JSON.parse(original); result.engineJar.sha256 = '0'.repeat(64); return jsonText(result);
  }, 'engine hash', 'engine hash');
  withCorruption(submittedResultPath, original => {
    const result = JSON.parse(original); result.runs[0].command.args.pop(); return jsonText(result);
  }, 'parallel argument', 'command: mismatch');
  withCorruption(submittedResultPath, original => {
    const result = JSON.parse(original); result.runs[1] = result.runs[0]; return jsonText(result);
  }, 'duplicate run', 'duplicate runs');
  withCorruption(submittedResultPath, original => {
    const result = JSON.parse(original); result.aggregate.teamPerBattle += 0.01; return jsonText(result);
  }, 'aggregate score', 'aggregate team');
  withCorruption(submittedResultPath, original => {
    const result = JSON.parse(original); result.runs[0].stdout = result.runs[0].stdout.replace('Ran 50 wars', 'Ran 49 wars'); return jsonText(result);
  }, 'actual engine battle count', 'actual completed battle count');
  console.log(JSON.stringify({ passed: true, syntheticRuns: 866, mutationChecks: 8, overwriteRefusal: true, extrasOverwriteRefusal: true, JavaInvoked: false }));
} finally {
  const absolute = path.resolve(fixtureRoot);
  assert(path.dirname(absolute) === path.resolve(here) && path.basename(absolute).startsWith('.selftest-'), 'refusing unsafe fixture cleanup');
  fs.rmSync(absolute, { recursive: true, force: true });
}
