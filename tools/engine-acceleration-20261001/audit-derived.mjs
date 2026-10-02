// Read-only integrity/paired analysis for explicitly labelled accelerated runs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const equal = (a, b, label) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(label); };
const ensure = (ok, label) => { if (!ok) throw new Error(label); };
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const baseHash = '31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d';
function load(folder) {
  const directory = path.resolve(folder);
  const planFile = path.join(directory, 'execution-plan.json');
  const planHash = sha(planFile), plan = read(planFile), result = read(path.join(directory, 'result.json'));
  equal(planHash, fs.readFileSync(path.join(directory, 'execution-plan.sha256'), 'utf8').trim(), 'plan checksum');
  equal(result.schemaVersion, 2, 'research result schema');
  equal(result.researchExecution.planSha256, planHash, 'result plan identity');
  equal(result.configSha256, plan.baseConfig.sha256, 'source config identity');
  equal(sha(plan.baseConfig.path), plan.baseConfig.sha256, 'source config changed');
  equal(result.config, plan.baseConfig.config, 'original settings changed');
  equal(sha(plan.java.path), plan.java.sha256, 'Java runtime changed');
  equal(plan.baseEngine.sha256, baseHash, 'wrong base engine');
  equal(result.engineJar.sha256, baseHash, 'wrong result engine');
  for (const item of plan.frozen) {
    equal(sha(item.path), item.sha256, `changed frozen input ${item.path}`);
    equal(fs.statSync(item.path).size, item.bytes, 'frozen input size');
    if (item.source && item.path.startsWith(path.join(directory, 'runtime') + path.sep)) equal(sha(item.source), item.sha256, 'compiled runtime differs from reviewed source classes');
  }
  const c = plan.baseConfig.config;
  equal(result.runs.length, c.cohorts.length * c.seeds.length, 'incomplete run count');
  equal(plan.jobs.length, result.runs.length, 'missing jobs');
  const runs = new Map();
  let totalBattles = 0, totalPoints = 0;
  for (let i = 0; i < result.runs.length; i++) {
    const run = result.runs[i], job = plan.jobs[i];
    const cohort = c.cohorts[Math.floor(i / c.seeds.length)], seed = c.seeds[i % c.seeds.length];
    equal(run.cohortId, cohort.id, 'cohort ordering'); equal(run.seed, seed, 'seed ordering');
    equal(run.battles, c.battles, 'battle count'); equal(job.battles, run.battles, 'job count');
    equal(run.runId, job.runId, 'run identity');
    equal(run.command, plan.command, 'actual process command'); equal(run.engineArguments, job.args, 'actual engine args');
    equal(run.inputs, job.inputs, 'staged inputs'); equal(run.zombies, job.zombies, 'staged Zombies');
    ensure(!runs.has(run.runId), 'duplicate run');
    const teams = [c.candidate, ...cohort.opponents];
    equal(Object.keys(run.inputs).sort(), teams.map(t => t.name).sort(), 'team membership');
    for (const team of teams) equal(run.inputs[team.name].map(x => x.sha256), team.warriors.map(file => sha(path.resolve(path.dirname(plan.baseConfig.path), file))), 'binary identity');
    equal(run.zombies.map(z => [z.name, z.sha256]), c.zombies.map(z => [z.name, sha(path.resolve(path.dirname(plan.baseConfig.path), z.path))]), 'Zombie identities/order');
    const score = fs.readFileSync(job.scorePath, 'utf8');
    equal(score, run.rawScoreText, 'retained scores changed'); equal(sha(job.scorePath), run.scoreFile.sha256, 'score hash');
    equal(read(path.join(job.folder, 'run.json')), run, 'per-run record');
    const starts = [...run.stdout.matchAll(/^Starting competition \((\d+) wars\)\.$/gm)].map(m => Number(m[1]));
    const ends = [...run.stdout.matchAll(/^Competition is over\. Ran (\d+) wars$/gm)].map(m => Number(m[1]));
    equal(starts, [c.battles], 'actual starts'); equal(ends, [c.battles], 'actual completions');
    let section;
    const parsed = { groups: {}, warriors: {} };
    for (const raw of score.split(/\r?\n/)) {
      const line = raw.trim(); if (!line) continue;
      if (line === 'Groups:') { section = 'groups'; continue; }
      if (line === 'Warriors:') { section = 'warriors'; continue; }
      const at = line.lastIndexOf(','), name = line.slice(0, at), value = Number(line.slice(at + 1));
      ensure(section && at > 0 && Number.isFinite(value) && value >= 0 && value <= c.battles + .001 && !Object.hasOwn(parsed[section], name), 'bad score row');
      parsed[section][name] = value;
    }
    equal(parsed, run.scores, 'parsed scores');
    equal(run.candidate.teamRaw, parsed.groups[c.candidate.name], 'candidate identity/score');
    equal(run.candidate.teamPerBattle, run.candidate.teamRaw / c.battles, 'normalization');
    if (c.telemetry) equal(sha(job.telemetryPath), run.telemetry.sha256, 'telemetry hash');
    totalBattles += run.battles; totalPoints += run.candidate.teamRaw; runs.set(run.runId, run);
  }
  equal(result.aggregate.battles, totalBattles, 'total battles'); equal(result.aggregate.teamPerBattle, totalPoints / totalBattles, 'aggregate');
  return { folder: directory, planHash, result, runs, pointsPerBattle: totalPoints / totalBattles };
}
function paired(candidate, reference) {
  equal(candidate.runs.size, reference.runs.size, 'unpaired run count');
  const deltas = [...candidate.runs].map(([id, run]) => {
    const control = reference.runs.get(id); ensure(control, `unpaired block ${id}`);
    equal(run.seed, control.seed, 'unpaired seed'); equal(run.battles, control.battles, 'unpaired battle count');
    for (const [team, files] of Object.entries(run.inputs)) if (team !== candidate.result.config.candidate.name) equal(files.map(f => f.sha256), control.inputs[team]?.map(f => f.sha256), 'unpaired opponents');
    equal(run.zombies.map(z => z.sha256), control.zombies.map(z => z.sha256), 'unpaired Zombies');
    return { cohort: run.cohortId, seed: run.seed, delta: run.candidate.teamPerBattle - control.candidate.teamPerBattle };
  });
  const clusters = [...new Set(deltas.map(d => d.cohort))].map(cohort => mean(deltas.filter(d => d.cohort === cohort).map(d => d.delta)));
  const delta = mean(clusters);
  const t = clusters.length === 25 ? 2.0638985616280205 : null;
  const se = Math.sqrt(clusters.reduce((s, x) => s + (x - delta) ** 2, 0) / (clusters.length - 1) / clusters.length);
  return { meanDelta: delta, relativePercent: 100 * delta / reference.pointsPerBattle,
    descriptive95CohortInterval: t ? [delta - t * se, delta + t * se] : null,
    cohortCount: clusters.length, positive: clusters.filter(x => x > 1e-8).length,
    negative: clusters.filter(x => x < -1e-8).length, tied: clusters.filter(x => Math.abs(x) <= 1e-8).length,
    bySeed: [...new Set(deltas.map(d => d.seed))].map(seed => ({ seed, delta: mean(deltas.filter(d => d.seed === seed).map(d => d.delta)) })) };
}
const [mode, first, second] = process.argv.slice(2);
if (mode === 'replay') {
  const accelerated = load(first), original = read(second);
  equal(accelerated.result.configSha256, original.configSha256, 'replay original config differs');
  equal(accelerated.runs.size, original.runs.length, 'replay counts');
  for (const run of original.runs) {
    const actual = accelerated.runs.get(run.runId); ensure(actual, 'missing archived block');
    equal(actual.seed, run.seed, 'replay seed'); equal(actual.battles, run.battles, 'replay battles');
    equal(actual.rawScoreText, run.rawScoreText, 'replay raw CSV differs');
    for (const name of Object.keys(run.inputs)) equal(actual.inputs[name].map(x => x.sha256), run.inputs[name].map(x => x.sha256), 'replay inputs');
    equal(actual.zombies.map(x => x.sha256), run.zombies.map(x => x.sha256), 'replay Zombies');
  }
  console.log(JSON.stringify({ status: 'EXACT_REPLAY', planSha256: accelerated.planHash,
    blocks: accelerated.runs.size, battles: accelerated.result.aggregate.battles,
    pointsPerBattle: accelerated.pointsPerBattle, acceleratedSeconds: accelerated.result.researchExecution.processElapsedSeconds }, null, 2));
} else if (mode === 'bootstrap') {
  const names = ['c090', 'm050', 'entry_lea', 'b_fallthrough', 'both'];
  const arms = Object.fromEntries(names.map(name => [name, load(path.join(first, name))]));
  const comparisons = [], selectedForFreshHoldout = [];
  for (const candidate of names.slice(2)) {
    let positiveBoth = true;
    for (const control of ['c090', 'm050']) {
      const metrics = paired(arms[candidate], arms[control]);
      positiveBoth &&= metrics.meanDelta > 1e-8;
      comparisons.push({ candidate, control, ...metrics });
    }
    if (positiveBoth) selectedForFreshHoldout.push(candidate);
  }
  console.log(JSON.stringify({ pointsPerBattle: Object.fromEntries(names.map(n => [n, arms[n].pointsPerBattle])),
    comparisons, selectedForFreshHoldout, note: 'Unchanged prespecified screen selection only; independent fresh holdout still required.' }, null, 2));
} else if (mode === 'pair') {
  const candidate = load(first), reference = load(second);
  console.log(JSON.stringify({ candidate: candidate.pointsPerBattle, reference: reference.pointsPerBattle, ...paired(candidate, reference), note: 'Descriptive research screen, not proof of a champion.' }, null, 2));
} else throw new Error('usage: audit-derived.mjs replay <batch-folder> <official-result> | bootstrap <five-arm-root> | pair <candidate-folder> <control-folder>');
