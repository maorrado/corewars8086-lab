import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const widefieldDir = path.join(repo, 'experiments/widefield-fourway-20261002');
const hybridDir = path.join(repo, 'experiments/e1p3-e1p4-hybrid-widefield-20261002');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');

function loadExperiment(experimentDir) {
  const manifestPath = path.join(experimentDir, 'manifest.json');
  const manifestBytes = fs.readFileSync(manifestPath);
  const manifest = JSON.parse(manifestBytes);
  if (sha(manifestBytes) !== fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim()) throw new Error(`manifest hash mismatch: ${experimentDir}`);
  const cohortTeams = new Map();
  for (const panel of manifest.panels) for (const cohort of panel.cohorts) cohortTeams.set(`${panel.panel}:${cohort.id}`, cohort.teams);
  const arms = Object.fromEntries(manifest.design.arms.map(arm => [arm, { opponents: new Map(), panelScores: new Map(), panelWarriors: new Map() }]));
  for (const record of manifest.configs) {
    const configBytes = fs.readFileSync(record.path);
    if (sha(configBytes) !== record.sha256) throw new Error(`config hash mismatch: ${record.path}`);
    const config = JSON.parse(configBytes);
    const result = JSON.parse(fs.readFileSync(config.outputPath, 'utf8'));
    if (result.aggregate.battles !== record.battles || result.engineJar.sha256 !== manifest.engineJar.sha256) throw new Error(`result validation failed: ${config.outputPath}`);
    const arm = arms[record.arm];
    if (!arm || result.runs.length !== config.cohorts.length) throw new Error(`unexpected arm/cohort count: ${config.outputPath}`);
    const candidateName = config.candidate.name;
    const panelScore = { candidatePoints: 0, battles: 0 };
    const warriorPoints = [0, 0];
    for (const run of result.runs) {
      const teams = cohortTeams.get(`${record.panel}:${run.cohortId}`);
      if (!teams || teams.length !== 3) throw new Error(`cohort map missing for ${run.cohortId}`);
      const candidatePoints = run.scores.groups[candidateName];
      const w1 = run.scores.warriors[`${candidateName}1`];
      const w2 = run.scores.warriors[`${candidateName}2`];
      if (![candidatePoints, w1, w2].every(Number.isFinite)) throw new Error(`candidate scores missing: ${config.outputPath} ${run.cohortId}`);
      panelScore.candidatePoints += candidatePoints;
      panelScore.battles += run.battles;
      warriorPoints[0] += w1;
      warriorPoints[1] += w2;
      for (const opponent of teams) {
        const opponentPoints = run.scores.groups[opponent];
        if (!Number.isFinite(opponentPoints)) throw new Error(`opponent score missing: ${opponent} in ${config.outputPath}`);
        if (!arm.opponents.has(opponent)) arm.opponents.set(opponent, new Map());
        const panels = arm.opponents.get(opponent);
        if (!panels.has(record.panel)) panels.set(record.panel, { candidatePoints: 0, opponentPoints: 0, warrior1Points: 0, warrior2Points: 0, battles: 0 });
        const row = panels.get(record.panel);
        row.candidatePoints += candidatePoints;
        row.opponentPoints += opponentPoints;
        row.warrior1Points += w1;
        row.warrior2Points += w2;
        row.battles += run.battles;
      }
    }
    arm.panelScores.set(record.panel, panelScore);
    arm.panelWarriors.set(record.panel, { warrior1Points: warriorPoints[0], warrior2Points: warriorPoints[1], battles: panelScore.battles });
  }
  return { manifest, arms };
}

const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const sd = values => {
  if (values.length < 2) return null;
  const center = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - center) ** 2, 0) / (values.length - 1));
};
const t95 = { 11: 2.200985, 15: 2.13145, 27: 2.05183 };

function armSummary(experiment, armName) {
  const arm = experiment.arms[armName];
  const panels = [...arm.panelScores.values()];
  const totalPoints = panels.reduce((s, x) => s + x.candidatePoints, 0);
  const totalBattles = panels.reduce((s, x) => s + x.battles, 0);
  const warrior1 = [...arm.panelWarriors.values()].reduce((s, x) => s + x.warrior1Points, 0) / totalBattles;
  const warrior2 = [...arm.panelWarriors.values()].reduce((s, x) => s + x.warrior2Points, 0) / totalBattles;
  return { meanTeamPointsPerBattle: totalPoints / totalBattles, meanWarrior1PointsPerBattle: warrior1, meanWarrior2PointsPerBattle: warrior2, battles: totalBattles };
}

function compareOpponentContexts(experiment, aName, bName) {
  const a = experiment.arms[aName], b = experiment.arms[bName];
  const names = [...new Set([...a.opponents.keys(), ...b.opponents.keys()])].sort();
  const rows = [];
  for (const name of names) {
    const pa = a.opponents.get(name) ?? new Map();
    const pb = b.opponents.get(name) ?? new Map();
    const commonPanels = [...pa.keys()].filter(panel => pb.has(panel)).sort((x, y) => x - y);
    if (!commonPanels.length) continue;
    const candidateShareDeltas = [];
    const relativeMarginDeltas = [];
    const warrior1Deltas = [];
    const warrior2Deltas = [];
    const opponentExposure = [];
    for (const panel of commonPanels) {
      const x = pa.get(panel), y = pb.get(panel);
      candidateShareDeltas.push(x.candidatePoints / x.battles - y.candidatePoints / y.battles);
      relativeMarginDeltas.push((x.candidatePoints - x.opponentPoints) / x.battles - (y.candidatePoints - y.opponentPoints) / y.battles);
      warrior1Deltas.push(x.warrior1Points / x.battles - y.warrior1Points / y.battles);
      warrior2Deltas.push(x.warrior2Points / x.battles - y.warrior2Points / y.battles);
      opponentExposure.push(Math.min(x.battles, y.battles));
    }
    const delta = mean(relativeMarginDeltas);
    const standardDeviation = sd(relativeMarginDeltas);
    const standardError = standardDeviation === null ? null : standardDeviation / Math.sqrt(relativeMarginDeltas.length);
    const critical = t95[commonPanels.length - 1];
    rows.push({
      opponent: name,
      pairedPanels: commonPanels.length,
      pairedBattleExposures: opponentExposure.reduce((s, x) => s + x, 0),
      deltaCandidatePointsPerBattle: mean(candidateShareDeltas),
      deltaCandidateMinusOpponentMarginPerBattle: delta,
      deltaWarrior1PointsPerBattle: mean(warrior1Deltas),
      deltaWarrior2PointsPerBattle: mean(warrior2Deltas),
      t95CI_marginDelta: critical === undefined || standardError === null ? null : [delta - critical * standardError, delta + critical * standardError],
      positivePanels_marginDelta: relativeMarginDeltas.filter(x => x > 1e-12).length,
      negativePanels_marginDelta: relativeMarginDeltas.filter(x => x < -1e-12).length,
      tiePanels_marginDelta: relativeMarginDeltas.filter(x => Math.abs(x) <= 1e-12).length,
    });
  }
  return {
    comparison: `${aName}_minus_${bName}`,
    interpretation: 'Paired multi-opponent cohort context, not a two-team duel: each observation includes the named opponent plus two other teams and four zombies. Per-opponent intervals are exploratory and are not adjusted for testing many opponents.',
    mostImprovedRelativeMargins: [...rows].sort((x, y) => y.deltaCandidateMinusOpponentMarginPerBattle - x.deltaCandidateMinusOpponentMarginPerBattle).slice(0, 15),
    mostDegradedRelativeMargins: [...rows].sort((x, y) => x.deltaCandidateMinusOpponentMarginPerBattle - y.deltaCandidateMinusOpponentMarginPerBattle).slice(0, 15),
    allOpponentRows: rows,
  };
}

const wide = loadExperiment(widefieldDir);
const hybrid = loadExperiment(hybridDir);
const pooledWideHybrid = (() => {
  const panels = 28;
  const deltas = [];
  for (const experiment of [wide, hybrid]) {
    const e3 = experiment.arms.e1p3.panelScores;
    const e4 = experiment.arms.e1p4.panelScores;
    for (const [panel, row3] of e3) deltas.push(e4.get(panel).candidatePoints / e4.get(panel).battles - row3.candidatePoints / row3.battles);
  }
  const delta = mean(deltas), standardDeviation = sd(deltas), standardError = standardDeviation / Math.sqrt(deltas.length);
  return { pairedPanels: panels, meanDeltaE1p4MinusE1p3: delta, t95CI: [delta - t95[27] * standardError, delta + t95[27] * standardError], positivePanels: deltas.filter(x => x > 1e-12).length, negativePanels: deltas.filter(x => x < -1e-12).length };
})();
const analysis = {
  status: 'COMPLETED_PAIRED_OPPONENT_COHORT_SCORE_AUDIT',
  sourceStudies: {
    widefield: { manifestSha256: sha(fs.readFileSync(path.join(widefieldDir, 'manifest.json'))), panels: wide.manifest.design.panels, opponentTeams: wide.manifest.design.opponentTeams, armSummaries: Object.fromEntries(wide.manifest.design.arms.map(arm => [arm, armSummary(wide, arm)])) },
    hybridHoldout: { manifestSha256: sha(fs.readFileSync(path.join(hybridDir, 'manifest.json'))), panels: hybrid.manifest.design.panels, opponentTeams: hybrid.manifest.design.opponentTeams, armSummaries: Object.fromEntries(hybrid.manifest.design.arms.map(arm => [arm, armSummary(hybrid, arm)])) },
  },
  pooledE1p4VsE1p3AcrossBothStudies: pooledWideHybrid,
  widefieldOpponentComparisons: [
    compareOpponentContexts(wide, 'e1p4', 'e1p3'),
    compareOpponentContexts(wide, 'e1p4', 'm050'),
    compareOpponentContexts(wide, 'e1p4', 'm049'),
    compareOpponentContexts(wide, 'e1p3', 'm050'),
    compareOpponentContexts(wide, 'm050', 'm049'),
  ],
  freshHybridOpponentComparisons: [
    compareOpponentContexts(hybrid, 'e1p4', 'e1p3'),
    compareOpponentContexts(hybrid, 'e1p4', 'hybrid_e1p4A_e1p3B'),
    compareOpponentContexts(hybrid, 'e1p4', 'hybrid_e1p3A_e1p4B'),
  ],
  note: 'Opponent margin is candidate group score minus the named opponent group score within shared four-group, four-zombie battles; it is not an isolated duel. Opponent-specific intervals are exploratory because 130 contexts are examined.',
};
const output = path.join(widefieldDir, 'opponent-points-analysis.json');
fs.writeFileSync(output, `${JSON.stringify(analysis, null, 2)}\n`);
console.log(JSON.stringify({ status: analysis.status, pooledE1p4VsE1p3AcrossBothStudies: analysis.pooledE1p4VsE1p3AcrossBothStudies, widefieldArmSummaries: analysis.sourceStudies.widefield.armSummaries, hybridArmSummaries: analysis.sourceStudies.hybridHoldout.armSummaries, mainComparisonContexts: analysis.widefieldOpponentComparisons[0], hybridAgainstE1p4: analysis.freshHybridOpponentComparisons.slice(1).map(comparison => ({ comparison: comparison.comparison, mostImprovedRelativeMargins: comparison.mostImprovedRelativeMargins.slice(0, 5), mostDegradedRelativeMargins: comparison.mostDegradedRelativeMargins.slice(0, 5) })), output }, null, 2));
