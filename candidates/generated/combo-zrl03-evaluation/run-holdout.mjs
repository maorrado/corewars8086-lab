import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { encodeBatch } from '../../../tools/engine-acceleration-20261001/runtime/batch-format.mjs';

const root = path.resolve(import.meta.dirname, '../../..');
const output = path.join(root, 'experiments/combo-zrl03-b01d-holdout-20261002');
if (fs.existsSync(output)) throw new Error(`Refusing to overwrite ${output}`);
fs.mkdirSync(output, { recursive: false });
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const engineJar = path.join(root, 'repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar');
const java = path.join(root, 'tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe');
const batchClasses = path.join(root, 'tools/engine-acceleration-20261001/runtime/classes');
const referenceConfig = path.join(root, 'experiments/b01d-e1p4-validation-20261002-parallel/configs/b01d-e1p4-p01-b01d-parallel.json');
const sourceBuild = path.join(root, 'build/combo-zrl03-evaluation-20261002');
const candidateBuild = path.join(root, 'candidates/generated/claude-b01d-e1p4-20261002/build');
const candidateFiles = {
  combo: [path.join(sourceBuild, 'ComboA'), path.join(sourceBuild, 'ComboB')],
  b01d: [path.join(candidateBuild, 'b01d-A'), path.join(candidateBuild, 'b01d-B')],
};
const expected = {
  jar: '31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d',
  combo: ['605880ba552c3d43c5cd175693b1942cf401c60c2135f62ab76a97dc20d1b051', '011720f6ae95c4b225ee92acfcbe4e373e6c56d78fadde3b11268a162529f334'],
  b01d: ['775080226ca8f9e9a5aac584094c9066bd2c55365ee8cea1e18db26440d9315e', '884b4d52e4ef1e57db85c88083d0a8667a6bd252a25728da7f5fdedefa6f33c7'],
};
if (sha(engineJar) !== expected.jar) throw new Error('Original deterministic engine hash mismatch');
for (const arm of Object.keys(candidateFiles)) {
  const hashes = candidateFiles[arm].map(sha);
  if (hashes.some((hash, i) => hash !== expected[arm][i])) throw new Error(`${arm} binary hash mismatch: ${hashes}`);
}

const reference = json(referenceConfig);
const opponents = reference.cohorts.flatMap(cohort => cohort.opponents);
if (opponents.length !== 75 || new Set(opponents.map(team => team.name)).size !== 75) {
  throw new Error(`Expected 75 unique opponent teams; got ${opponents.length}`);
}
const zombies = reference.zombies;
for (const team of opponents) for (const file of team.warriors) if (!fs.existsSync(path.resolve(root, file))) throw new Error(`Missing opponent ${file}`);
for (const zombie of zombies) if (!fs.existsSync(path.resolve(root, zombie.path))) throw new Error(`Missing zombie ${zombie.path}`);

function shuffle(seed) {
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const result = [...opponents];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function stageJob(arm, panel, cohort, cohortTeams, turnIndex) {
  const id = `${arm}-p${panel}-c${String(cohort).padStart(2, '0')}`;
  const folder = path.join(output, 'runs', id);
  const warriorDirectory = path.join(folder, 'survivors');
  const zombieDirectory = path.join(folder, 'zombies');
  fs.mkdirSync(warriorDirectory, { recursive: true });
  fs.mkdirSync(zombieDirectory, { recursive: true });
  const inputs = [];
  const put = (source, targetName) => {
    const absolute = path.resolve(root, source);
    const target = path.join(warriorDirectory, targetName);
    fs.copyFileSync(absolute, target);
    inputs.push({ source: absolute, target, bytes: fs.statSync(target).size, sha256: sha(target) });
    return target;
  };
  put(candidateFiles[arm][0], 'COD_test1');
  put(candidateFiles[arm][1], 'COD_test2');
  for (const team of cohortTeams) team.warriors.forEach((file, index) => put(file, `${team.name.replace(/[^A-Za-z0-9_-]/g, '_')}${index + 1}`));
  const stagedZombies = zombies.map(zombie => {
    const source = path.resolve(root, zombie.path);
    const target = path.join(zombieDirectory, zombie.name);
    fs.copyFileSync(source, target);
    return { name: zombie.name, source, target, sha256: sha(target), bytes: fs.statSync(target).size };
  });
  const score = path.join(folder, 'scores.csv');
  const panelSeed = panel === 1 ? '202610021' : '202610022';
  const args = [
    '--headless', '--comboSize', '4', '--battlesPerCombo', '20', '--seed', panelSeed,
    '--threads', '1', '--parallel=false', '--warriorsDir', warriorDirectory,
    '--zombiesDir', zombieDirectory, '--outputFile', score,
  ];
  return { id, arm, panel, cohort, cohortTeams: cohortTeams.map(team => team.name), panelSeed,
    score, folder, args, inputs, stagedZombies, turnIndex };
}

const panels = [];
const jobsById = new Map();
const work = [];
for (let panel = 1; panel <= 2; panel++) {
  const shuffled = shuffle(panel === 1 ? 0x20261002 : 0x20261003);
  const groups = Array.from({ length: 25 }, (_, index) => shuffled.slice(index * 3, index * 3 + 3));
  panels.push({ panel, seed: panel === 1 ? '202610021' : '202610022', cohorts: groups.map((group, i) => ({ id: i + 1, teams: group.map(team => team.name) })) });
  for (let index = 0; index < groups.length; index++) {
    const arms = (panel + index) % 2 ? ['combo', 'b01d'] : ['b01d', 'combo'];
    for (const arm of arms) {
      const job = stageJob(arm, panel, index + 1, groups[index], work.length);
      work.push(job);
      jobsById.set(job.id, job);
    }
  }
}
if (work.length !== 100) throw new Error(`Expected 100 cohort jobs; got ${work.length}`);
const manifest = {
  objective: 'Shortest independent paired fresh-holdout comparison of pasted combo_zrl03 vs exact b01d over the official 2025 field.',
  design: { panels: 2, opponentTeams: 75, cohortsPerPanel: 25, battlesPerCohort: 20, battlesPerArm: 1000,
    pairedClusters: 50, comboSize: 4, zombiesPerBattle: zombies.length,
    randomization: 'Two fresh deterministic permutations of the complete 75-team roster; identical cohorts and panel seed for combo/b01d within each paired cell; execution order alternated by cohort.' },
  engineJar: { path: engineJar, sha256: sha(engineJar) },
  binaries: Object.fromEntries(Object.entries(candidateFiles).map(([arm, files]) => [arm, files.map((file, index) => ({ path: file, bytes: fs.statSync(file).size, sha256: sha(file), expectedSha256: expected[arm][index] }))])),
  opponentRoster: opponents.map(team => ({ name: team.name, warriors: team.warriors.map(file => ({ path: file, sha256: sha(path.resolve(root, file)) })) })),
  zombies: zombies.map(zombie => ({ name: zombie.name, path: zombie.path, sha256: sha(path.resolve(root, zombie.path)) })),
  panels,
  jobs: work.map(({ id, arm, panel, cohort, cohortTeams, panelSeed, args, inputs, stagedZombies }) => ({ id, arm, panel, cohort, cohortTeams, panelSeed, args, inputs, stagedZombies })),
};
fs.writeFileSync(path.join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
const batchPath = path.join(output, 'jobs.nul');
fs.writeFileSync(batchPath, encodeBatch(work.map(job => ({ id: job.id, args: job.args }))), { flag: 'wx' });
const classpath = [batchClasses, engineJar].join(path.delimiter);
const command = [java, '-cp', classpath, 'SerialBatchMain', batchPath];
const execution = spawnSync(java, ['-cp', classpath, 'SerialBatchMain', batchPath], {
  cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024,
});
fs.writeFileSync(path.join(output, 'stdout.txt'), execution.stdout ?? '', { flag: 'wx' });
fs.writeFileSync(path.join(output, 'stderr.txt'), execution.stderr ?? '', { flag: 'wx' });
if (execution.error || execution.status !== 0) throw new Error(`Batch engine failed: ${execution.error?.message ?? execution.stderr}`);
for (const job of work) {
  const marker = new RegExp(`BATCH_V1_DONE ${job.id} (\\d+) (\\d+)`).exec(execution.stdout);
  if (!marker || Number(marker[1]) !== 20 || !fs.existsSync(job.score)) throw new Error(`Incomplete cohort job ${job.id}`);
  for (const input of job.inputs) if (sha(input.target) !== input.sha256) throw new Error(`Staged input changed: ${input.target}`);
}

function candidateScore(file) {
  const text = fs.readFileSync(file, 'utf8');
  let section = null;
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === 'Groups:') { section = 'groups'; continue; }
    if (line.trim() === 'Warriors:') { section = 'warriors'; continue; }
    if (!section) continue;
    const split = line.trim().lastIndexOf(',');
    if (split >= 0 && line.trim().slice(0, split) === 'COD_test') return Number(line.trim().slice(split + 1));
  }
  throw new Error(`COD_test score missing in ${file}`);
}
const records = work.map(job => ({ id: job.id, arm: job.arm, panel: job.panel, cohort: job.cohort,
  teams: job.cohortTeams, panelSeed: job.panelSeed, battles: 20, rawPoints: candidateScore(job.score),
  pointsPerBattle: candidateScore(job.score) / 20, scoreSha256: sha(job.score), inputs: job.inputs,
  jobNanos: Number(new RegExp(`BATCH_V1_DONE ${job.id} \\d+ (\\d+)`).exec(execution.stdout)[1]) }));
const byCell = new Map(records.map(record => [`${record.panel}-${record.cohort}-${record.arm}`, record]));
const paired = [];
for (let panel = 1; panel <= 2; panel++) for (let cohort = 1; cohort <= 25; cohort++) {
  const combo = byCell.get(`${panel}-${cohort}-combo`);
  const b01d = byCell.get(`${panel}-${cohort}-b01d`);
  if (!combo || !b01d) throw new Error(`Missing paired cell ${panel}-${cohort}`);
  paired.push({ panel, cohort, difference: combo.pointsPerBattle - b01d.pointsPerBattle });
}
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
function stats(values) {
  const average = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1);
  const se = Math.sqrt(variance / values.length);
  const t = se === 0 ? (average === 0 ? 0 : Math.sign(average) * Infinity) : average / se;
  const critical = values.length === 50 ? 2.009575 : 2.063899;
  return { n: values.length, meanPointsPerBattle: average, meanPointsPer100Battles: average * 100,
    sdClusterPointsPerBattle: Math.sqrt(variance), standardError: se, t, ci95PerBattle: [average - critical * se, average + critical * se],
    ci95PointsPer100Battles: [(average - critical * se) * 100, (average + critical * se) * 100] };
}
const diffs = paired.map(record => record.difference);
const panelStats = [1, 2].map(panel => ({ panel, ...stats(paired.filter(record => record.panel === panel).map(record => record.difference)) }));
const armTotals = Object.fromEntries(['combo', 'b01d'].map(arm => {
  const armRecords = records.filter(record => record.arm === arm);
  return [arm, { battles: armRecords.length * 20, points: armRecords.reduce((sum, record) => sum + record.rawPoints, 0), pointsPerBattle: armRecords.reduce((sum, record) => sum + record.rawPoints, 0) / (armRecords.length * 20) }];
}));
const comparison = stats(diffs);
const bothPanelPositive = panelStats.every(panel => panel.meanPointsPerBattle > 0);
const bothPanelNegative = panelStats.every(panel => panel.meanPointsPerBattle < 0);
comparison.verdict = comparison.ci95PerBattle[0] > 0 && bothPanelPositive ? 'combo_zrl03 wins this fresh 2025-field holdout' :
  comparison.ci95PerBattle[1] < 0 && bothPanelNegative ? 'b01d wins this fresh 2025-field holdout' : 'inconclusive; no clear winner on this short holdout';
const summary = { experimentId: path.basename(output), generatedAt: new Date().toISOString(), command,
  engineJarSha256: sha(engineJar), binaryHashes: manifest.binaries, design: manifest.design,
  totalBattles: records.length * 20, armTotals, pairedComparison: comparison, panelComparisons: panelStats,
  pairedCells: paired, jobs: records };
fs.writeFileSync(path.join(output, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ totalBattles: summary.totalBattles, armTotals, pairedComparison: comparison, panelComparisons: panelStats }, null, 2));
