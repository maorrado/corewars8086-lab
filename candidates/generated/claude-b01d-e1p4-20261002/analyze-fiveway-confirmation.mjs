import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const experimentDir = path.resolve(process.argv[2] ?? path.join(repo, 'experiments/b01d-fiveway-crossyear-20261002'));
const manifestPath = path.join(experimentDir, 'manifest.json');
const manifestBytes = fs.readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const shaFile = file => sha(fs.readFileSync(file));
if (sha(manifestBytes) !== fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim()) throw new Error('frozen manifest hash mismatch');
if (manifest.status !== 'FROZEN_BEFORE_RUN' || manifest.configs.length !== 80 || manifest.design.totalBattles !== 176000) throw new Error('unexpected frozen design');
if (shaFile(manifest.engineJar.path) !== manifest.engineJar.sha256) throw new Error('engine JAR hash mismatch');
const analysisPath = path.join(experimentDir, 'analysis.json');
if (fs.existsSync(analysisPath)) throw new Error(`refusing to overwrite ${analysisPath}`);

const expectedHashes = new Map();
for (const [arm, binaries] of Object.entries(manifest.candidates)) for (const [index, binary] of binaries.entries()) {
  if (shaFile(binary.path) !== binary.sha256 || fs.statSync(binary.path).size !== binary.bytes) throw new Error(`candidate changed: ${arm}/${index + 1}`);
  expectedHashes.set(path.resolve(binary.path), binary.sha256);
}
for (const team of manifest.opponentTeams) for (const binary of team.warriors) {
  if (shaFile(binary.path) !== binary.sha256 || fs.statSync(binary.path).size !== binary.bytes) throw new Error(`opponent changed: ${team.name}/${binary.path}`);
  expectedHashes.set(path.resolve(binary.path), binary.sha256);
}
for (const zombie of manifest.zombies) {
  if (shaFile(zombie.path) !== zombie.sha256 || fs.statSync(zombie.path).size !== zombie.bytes) throw new Error(`zombie changed: ${zombie.name}`);
  expectedHashes.set(path.resolve(zombie.path), zombie.sha256);
}

const arms = manifest.design.arms;
const panels = new Map(manifest.panels.map(panel => [panel.panel, panel]));
const panelCohortScores = Object.fromEntries(arms.map(arm => [arm, new Map()]));
const panelMeans = Object.fromEntries(arms.map(arm => [arm, new Map()]));
const pointsByArm = Object.fromEntries(arms.map(arm => [arm, 0]));
const battleCounts = Object.fromEntries(arms.map(arm => [arm, 0]));
for (const entry of manifest.configs) {
  if (shaFile(entry.path) !== entry.sha256) throw new Error(`config changed: ${entry.path}`);
  const config = JSON.parse(fs.readFileSync(entry.path, 'utf8'));
  if (!fs.existsSync(config.outputPath)) throw new Error(`missing result: ${config.outputPath}`);
  const result = JSON.parse(fs.readFileSync(config.outputPath, 'utf8'));
  if (result.engineJar.sha256 !== manifest.engineJar.sha256) throw new Error(`wrong engine in ${config.experimentId}`);
  if (result.aggregate.battles !== entry.battles || result.runs.length !== config.cohorts.length) throw new Error(`wrong battle/cohort count in ${config.experimentId}`);
  const perCohort = new Map();
  let rawTotal = 0;
  for (let index = 0; index < result.runs.length; index++) {
    const run = result.runs[index];
    const cohort = config.cohorts[index];
    if (run.cohortId !== cohort.id || run.seed !== config.seeds[0] || run.battles !== config.battles) throw new Error(`wrong seed/cohort/count in ${config.experimentId}/${index}`);
    const expectedTeams = [config.candidate.name, ...cohort.opponents.map(item => item.name)].sort();
    if (JSON.stringify(Object.keys(run.scores.groups).sort()) !== JSON.stringify(expectedTeams)) throw new Error(`wrong team roster in ${config.experimentId}/${cohort.id}`);
    const raw = run.candidate.teamRaw;
    if (!Number.isFinite(raw)) throw new Error(`invalid score in ${config.experimentId}/${cohort.id}`);
    rawTotal += raw;
    perCohort.set(cohort.id, { raw, battles: run.battles });
    for (const files of Object.values(run.inputs)) for (const file of files) {
      const expected = expectedHashes.get(path.resolve(file.source));
      if (!expected || expected !== file.sha256 || shaFile(file.target) !== expected) throw new Error(`staged input mismatch ${config.experimentId}/${cohort.id}/${file.source}`);
    }
    for (const zombie of run.zombies) {
      const expected = expectedHashes.get(path.resolve(zombie.source));
      if (!expected || expected !== zombie.sha256 || shaFile(zombie.target) !== expected) throw new Error(`staged zombie mismatch ${config.experimentId}/${cohort.id}`);
    }
  }
  const computedMean = rawTotal / result.aggregate.battles;
  if (Math.abs(computedMean - result.aggregate.teamPerBattle) > 1e-9) throw new Error(`aggregate mismatch in ${config.experimentId}`);
  panelCohortScores[entry.arm].set(entry.panel, perCohort);
  panelMeans[entry.arm].set(entry.panel, { score: computedMean, points: rawTotal, battles: result.aggregate.battles });
  pointsByArm[entry.arm] += rawTotal;
  battleCounts[entry.arm] += result.aggregate.battles;
}

const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const sd = values => {
  const average = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
};
function summarizeContrast(label, deltas) {
  const average = mean(deltas);
  const standardDeviation = sd(deltas);
  const standardError = standardDeviation / Math.sqrt(deltas.length);
  const t = average / standardError;
  const t95 = 2.131449545559323;
  // t(15, 0.9975), rounded; two-sided Bonferroni 95% family-wise CI over 10 pairs.
  const tFamilywise = 3.286;
  return {
    contrast: label,
    panels: deltas.length,
    meanDeltaPointsPerBattle: average,
    meanDeltaPointsPer100Battles: average * 100,
    panelSdPointsPerBattle: standardDeviation,
    tStatisticPairedPanels: t,
    ci95PointsPer100Battles: [(average - t95 * standardError) * 100, (average + t95 * standardError) * 100],
    ci95FamilywiseBonferroniPointsPer100Battles: [(average - tFamilywise * standardError) * 100, (average + tFamilywise * standardError) * 100],
    panelSigns: { positive: deltas.filter(value => value > 1e-12).length, negative: deltas.filter(value => value < -1e-12).length, tie: deltas.filter(value => Math.abs(value) <= 1e-12).length },
    panelDeltasPointsPerBattle: deltas,
  };
}
function pairedContrast(armA, armB) {
  const deltas = manifest.panels.map(panel => panelMeans[armA].get(panel.panel).score - panelMeans[armB].get(panel.panel).score);
  return summarizeContrast(`${armA} - ${armB}`, deltas);
}
const pairwise = {};
for (let i = 0; i < arms.length; i++) for (let j = i + 1; j < arms.length; j++) pairwise[`${arms[i]}_minus_${arms[j]}`] = pairedContrast(arms[i], arms[j]);

function pairedContext(armA, armB, predicate) {
  const panelDeltas = [];
  const counts = [];
  for (const panel of manifest.panels) {
    let pointsA = 0, pointsB = 0, battles = 0;
    const resultA = panelCohortScores[armA].get(panel.panel);
    const resultB = panelCohortScores[armB].get(panel.panel);
    for (const cohort of panel.cohorts) {
      if (!predicate(cohort.teams)) continue;
      const a = resultA.get(cohort.id), b = resultB.get(cohort.id);
      if (!a || !b) throw new Error(`missing context cohort ${panel.panel}/${cohort.id}`);
      pointsA += a.raw;
      pointsB += b.raw;
      battles += a.battles;
    }
    if (battles) {
      panelDeltas.push((pointsA - pointsB) / battles);
      counts.push(battles);
    }
  }
  if (!panelDeltas.length) return { panels: 0, totalBattles: 0 };
  const result = summarizeContrast(`${armA} - ${armB} by context`, panelDeltas);
  return { ...result, totalBattles: counts.reduce((sum, value) => sum + value, 0) };
}
const namedTargets = new Set(['2025_A_HLS_EmoMutants', '2025_A_HRZ_LowKey_WBB', '2025_A_HRZ_BinaryBandits']);
const primaryContexts = {
  all2024OrMixedYearOpponents: teams => teams.some(team => team.year === 2024),
  noNamed2025Targets: teams => !teams.some(team => namedTargets.has(team.name)),
  anyNamed2025Target: teams => teams.some(team => namedTargets.has(team.name)),
  pure2024Opponents: teams => teams.every(team => team.year === 2024),
};
const b01dVsE1p4Contexts = Object.fromEntries(Object.entries(primaryContexts).map(([label, predicate]) => [label, pairedContext('b01d', 'e1p4', predicate)]));

const analysis = {
  status: 'COMPLETE_FIVE_WAY_CROSSYEAR_VALIDATION',
  generatedAt: new Date().toISOString(),
  manifestPath,
  manifestSha256: sha(manifestBytes),
  engineJarSha256: manifest.engineJar.sha256,
  validation: {
    configurations: manifest.configs.length,
    results: manifest.configs.length,
    totalCohortBlocks: manifest.configs.length * manifest.design.cohortsPerPanel,
    battlesPerArm: battleCounts,
    everyCandidateOpponentZombieAndStagedInputRehashed: true,
    pairedPanels: manifest.design.panels,
    uncertaintyUnit: '16 paired full-field panel means; individual battles are not treated as independent observations.',
  },
  means: Object.fromEntries(arms.map(arm => [arm, {
    totalPoints: pointsByArm[arm],
    battles: battleCounts[arm],
    meanPointsPerBattle: pointsByArm[arm] / battleCounts[arm],
    panelMeans: manifest.panels.map(panel => panelMeans[arm].get(panel.panel).score),
  }])),
  primaryContrastB01DMinusE1P4: pairwise.b01d_minus_e1p4,
  pairwiseComparisons: pairwise,
  b01dVsE1p4Contexts,
};
fs.writeFileSync(analysisPath, `${JSON.stringify(analysis, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output: analysisPath, manifestSha256: analysis.manifestSha256, validation: analysis.validation, means: analysis.means, primary: analysis.primaryContrastB01DMinusE1P4, pairwiseComparisons: analysis.pairwiseComparisons, b01dVsE1p4Contexts }, null, 2));
