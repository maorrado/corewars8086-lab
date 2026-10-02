import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const experimentDir = path.resolve(process.argv[2] ?? path.join(repo, 'experiments/b01d-e1p4-validation-20261002'));
const manifestPath = path.join(experimentDir, 'manifest.json');
const manifestBytes = fs.readFileSync(manifestPath);
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const shaFile = file => sha(fs.readFileSync(file));
const manifest = JSON.parse(manifestBytes);
if (sha(manifestBytes) !== fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim()) throw new Error('frozen manifest hash mismatch');
if (!['FROZEN_BEFORE_RUN', 'FROZEN_BEFORE_PARALLEL_RUN'].includes(manifest.status)) throw new Error('manifest not frozen');
if (fs.existsSync(path.join(experimentDir, 'analysis.json'))) throw new Error('refusing to overwrite analysis.json');

const armNames = manifest.design.arms;
const targetTeams = ['A_HLS_EmoMutants', 'A_HRZ_LowKey_WBB', 'A_HRZ_BinaryBandits'];
const expectedPathHashes = new Map();
for (const [arm, binaries] of Object.entries(manifest.candidates)) {
  for (const file of binaries) expectedPathHashes.set(path.resolve(file.path), file.sha256);
}
for (const [file, identity] of Object.entries(manifest.opponentHashes)) expectedPathHashes.set(path.resolve(file), identity.sha256);
for (const zombie of manifest.zombies) expectedPathHashes.set(path.resolve(zombie.path), zombie.sha256);

const resultsByArm = Object.fromEntries(armNames.map(arm => [arm, []]));
const panelByArmAndCohort = Object.fromEntries(armNames.map(arm => [arm, new Map()]));
for (const entry of manifest.configs) {
  if (shaFile(entry.path) !== entry.sha256) throw new Error(`frozen config changed: ${entry.path}`);
  const config = JSON.parse(fs.readFileSync(entry.path, 'utf8'));
  if (!fs.existsSync(config.outputPath)) throw new Error(`missing result: ${config.outputPath}`);
  const result = JSON.parse(fs.readFileSync(config.outputPath, 'utf8'));
  if (result.engineJar.sha256 !== manifest.engineJar.sha256) throw new Error(`engine mismatch: ${config.experimentId}`);
  if (result.aggregate.battles !== entry.battles) throw new Error(`wrong aggregate battle count: ${config.experimentId}`);
  if (result.runs.length !== config.cohorts.length) throw new Error(`wrong cohort count: ${config.experimentId}`);
  let teamRawTotal = 0;
  for (let i = 0; i < result.runs.length; i++) {
    const run = result.runs[i];
    const cohort = config.cohorts[i];
    if (run.cohortId !== cohort.id || run.seed !== config.seeds[0] || run.battles !== config.battles) {
      throw new Error(`cohort/seed/count mismatch: ${config.experimentId}/${i}`);
    }
    const expectedTeams = [config.candidate.name, ...cohort.opponents.map(x => x.name)].sort();
    const gotTeams = Object.keys(run.scores.groups).sort();
    if (JSON.stringify(gotTeams) !== JSON.stringify(expectedTeams)) throw new Error(`score-team identity mismatch: ${config.experimentId}/${run.cohortId}`);
    const candidateValue = run.candidate.teamRaw;
    if (!Number.isFinite(candidateValue)) throw new Error(`missing candidate score: ${config.experimentId}/${run.cohortId}`);
    teamRawTotal += candidateValue;
    const scored = { score: candidateValue / run.battles, raw: candidateValue, battles: run.battles };
    panelByArmAndCohort[entry.arm].set(`${entry.panel}/${run.cohortId}`, scored);
    for (const [teamName, files] of Object.entries(run.inputs)) {
      for (const file of files) {
        const expectedHash = expectedPathHashes.get(path.resolve(file.source));
        if (!expectedHash || file.sha256 !== expectedHash || shaFile(file.target) !== expectedHash) {
          throw new Error(`staged source/input hash mismatch in ${config.experimentId}/${run.cohortId}: ${teamName}`);
        }
      }
    }
    for (const zombie of run.zombies) {
      const expectedHash = expectedPathHashes.get(path.resolve(zombie.source));
      if (!expectedHash || zombie.sha256 !== expectedHash || shaFile(zombie.target) !== expectedHash) {
        throw new Error(`staged zombie hash mismatch in ${config.experimentId}/${run.cohortId}`);
      }
    }
  }
  const recomputed = teamRawTotal / result.aggregate.battles;
  if (Math.abs(recomputed - result.aggregate.teamPerBattle) > 1e-9) throw new Error(`aggregate mismatch: ${config.experimentId}`);
  resultsByArm[entry.arm].push({ panel: entry.panel, teamPerBattle: recomputed, rawPoints: teamRawTotal, battles: result.aggregate.battles });
}

const mean = xs => xs.reduce((sum, x) => sum + x, 0) / xs.length;
const sampleSd = xs => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((sum, x) => sum + (x - m) ** 2, 0) / (xs.length - 1));
};
function pairedContrast(label, deltas) {
  const m = mean(deltas), sd = sampleSd(deltas), se = sd / Math.sqrt(deltas.length);
  const t = m / se;
  const critical95 = 2.131449545559323; // two-sided t(15), fixed 16-panel design
  return {
    contrast: label,
    panels: deltas.length,
    meanDeltaPointsPerBattle: m,
    meanDeltaPointsPer100Battles: m * 100,
    panelSdPointsPerBattle: sd,
    tStatisticPairedPanels: t,
    ci95PointsPerBattle: [m - critical95 * se, m + critical95 * se],
    ci95PointsPer100Battles: [(m - critical95 * se) * 100, (m + critical95 * se) * 100],
    panelSigns: {
      positive: deltas.filter(x => x > 1e-12).length,
      negative: deltas.filter(x => x < -1e-12).length,
      tie: deltas.filter(x => Math.abs(x) <= 1e-12).length,
    },
    panelDeltasPointsPerBattle: deltas,
  };
}
function compareArm(arm, baselineArm = 'control') {
  const deltas = manifest.panels.map(panel => {
    const candidate = resultsByArm[arm].find(x => x.panel === panel.panel);
    const baseline = resultsByArm[baselineArm].find(x => x.panel === panel.panel);
    if (!candidate || !baseline) throw new Error(`missing paired panel for ${arm}/${baselineArm}/${panel.panel}`);
    return candidate.teamPerBattle - baseline.teamPerBattle;
  });
  return pairedContrast(`${arm} - ${baselineArm}`, deltas);
}

function contextComparison(arm, predicate, baselineArm = 'control') {
  const panelDeltas = [];
  const matchedBattleCounts = [];
  for (const panel of manifest.panels) {
    let candPoints = 0, controlPoints = 0, battles = 0;
    for (const cohort of panel.cohorts) {
      if (!predicate(cohort.teams)) continue;
      const key = `${panel.panel}/${cohort.id}`;
      const c = panelByArmAndCohort[arm].get(key);
      const b = panelByArmAndCohort[baselineArm].get(key);
      if (!c || !b) throw new Error(`missing paired context ${arm}/${baselineArm}/${key}`);
      candPoints += c.raw;
      controlPoints += b.raw;
      battles += c.battles;
    }
    if (battles) {
      panelDeltas.push((candPoints - controlPoints) / battles);
      matchedBattleCounts.push(battles);
    }
  }
  if (!panelDeltas.length) return { panels: 0, meanDeltaPointsPer100Battles: null };
  const m = mean(panelDeltas);
  const sd = sampleSd(panelDeltas);
  const se = sd / Math.sqrt(panelDeltas.length);
  const critical = panelDeltas.length === 16 ? 2.131449545559323 : null;
  return {
    panels: panelDeltas.length,
    totalBattlesAcrossPanels: matchedBattleCounts.reduce((a, b) => a + b, 0),
    meanDeltaPointsPerBattle: m,
    meanDeltaPointsPer100Battles: m * 100,
    tStatisticPairedPanels: m / se,
    ci95PointsPer100Battles: critical === null ? null : [(m - critical * se) * 100, (m + critical * se) * 100],
    panelDeltasPointsPerBattle: panelDeltas,
  };
}
const targetSet = new Set(targetTeams);
const analyses = Object.fromEntries(armNames.filter(arm => arm !== 'control').map(arm => [arm, {
    overallVsE1p4: compareArm(arm, 'control'),
  targetContexts: {
      HLS_EmoMutants: contextComparison(arm, teams => teams.includes(targetTeams[0]), 'control'),
      either_HRZ_target: contextComparison(arm, teams => teams.some(team => targetSet.has(team)) && !teams.includes(targetTeams[0]), 'control'),
      any_claimed_target: contextComparison(arm, teams => teams.some(team => targetSet.has(team)), 'control'),
      no_claimed_target: contextComparison(arm, teams => !teams.some(team => targetSet.has(team)), 'control'),
  },
}]));

const b01dMinusA = manifest.panels.map(panel => resultsByArm.b01d.find(x => x.panel === panel.panel).teamPerBattle - resultsByArm.a_decoy.find(x => x.panel === panel.panel).teamPerBattle);
const b01dMinusB = manifest.panels.map(panel => resultsByArm.b01d.find(x => x.panel === panel.panel).teamPerBattle - resultsByArm.b_band_shift.find(x => x.panel === panel.panel).teamPerBattle);
const interaction = manifest.panels.map(panel =>
  resultsByArm.b01d.find(x => x.panel === panel.panel).teamPerBattle
  - resultsByArm.a_decoy.find(x => x.panel === panel.panel).teamPerBattle
  - resultsByArm.b_band_shift.find(x => x.panel === panel.panel).teamPerBattle
  + resultsByArm.control.find(x => x.panel === panel.panel).teamPerBattle,
);

const perArmMeans = Object.fromEntries(armNames.map(arm => [arm, {
  totalPoints: resultsByArm[arm].reduce((sum, x) => sum + x.rawPoints, 0),
  battles: resultsByArm[arm].reduce((sum, x) => sum + x.battles, 0),
  meanPointsPerBattle: mean(resultsByArm[arm].map(x => x.teamPerBattle)),
  panelMeans: resultsByArm[arm].map(x => x.teamPerBattle),
}]));
const analysis = {
  status: 'COMPLETE_PAIRED_VALIDATION',
  generatedAt: new Date().toISOString(),
  manifestPath,
  manifestSha256: sha(manifestBytes),
  engineJarSha256: manifest.engineJar.sha256,
  validation: {
    configs: manifest.configs.length,
    resultFiles: manifest.configs.length,
    runs: manifest.configs.length * manifest.design.cohortsPerPanel,
    candidateBattleCountPerArm: manifest.design.battlesPerArm,
    allOpponentAndZombieInputsRehashed: true,
    pairedDesign: manifest.design.pairing,
  },
  designNote: 'Statistical uncertainty is calculated over paired panel means (n=16), not treating individual battles as independent. Target-context contrasts are exploratory cohort associations, not isolated causal duels.',
  perArmMeans,
  comparisons: analyses,
  componentContrasts: {
    b01dVsA_decoy: pairedContrast('b01d - a_decoy', b01dMinusA),
    b01dVsB_band_shift: pairedContrast('b01d - b_band_shift', b01dMinusB),
    additiveInteractionDifferenceInDifferences: pairedContrast('b01d - a_decoy - b_band_shift + control', interaction),
  },
};
const outPath = path.join(experimentDir, 'analysis.json');
fs.writeFileSync(outPath, `${JSON.stringify(analysis, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output: outPath, manifestSha256: analysis.manifestSha256, perArmMeans, comparisons: analyses }, null, 2));
