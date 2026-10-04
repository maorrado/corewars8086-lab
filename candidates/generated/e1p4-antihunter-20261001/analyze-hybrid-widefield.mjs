import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const experimentDir = process.argv[2] ? path.resolve(repo, process.argv[2]) : path.join(repo, 'experiments/e1p3-e1p4-hybrid-widefield-20261002');
const manifestPath = path.join(experimentDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
if (sha(fs.readFileSync(manifestPath)) !== fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim()) throw new Error('manifest hash mismatch');
const panelScores = new Map();
const cohortScores = new Map();
for (const record of manifest.configs) {
  if (sha(fs.readFileSync(record.path)) !== record.sha256) throw new Error(`config hash mismatch: ${record.path}`);
  const config = JSON.parse(fs.readFileSync(record.path, 'utf8'));
  const result = JSON.parse(fs.readFileSync(config.outputPath, 'utf8'));
  if (result.aggregate.battles !== record.battles || result.engineJar.sha256 !== manifest.engineJar.sha256) throw new Error(`invalid result: ${config.outputPath}`);
  if (result.runs.length !== config.cohorts.length) throw new Error(`cohort count mismatch: ${config.outputPath}`);
  if (!panelScores.has(record.panel)) panelScores.set(record.panel, {});
  panelScores.get(record.panel)[record.arm] = result.aggregate.teamPerBattle;
  for (const run of result.runs) {
    const key = `${record.panel}:${run.cohortId}`;
    if (!cohortScores.has(key)) cohortScores.set(key, {});
    cohortScores.get(key)[record.arm] = run.candidate.teamPerBattle;
  }
}
const arms = manifest.design.arms;
const panelIds = [...panelScores.keys()].sort((a, b) => a - b);
if (panelIds.length !== manifest.design.panels || panelIds.some(panel => arms.some(arm => !Number.isFinite(panelScores.get(panel)[arm])))) throw new Error('incomplete panel set');
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const sd = values => { const m = mean(values); return Math.sqrt(values.reduce((sum, value) => sum + (value - m) ** 2, 0) / (values.length - 1)); };
const t95ByDf = { 7: 2.364624251, 8: 2.306004135, 9: 2.262157163, 10: 2.228138852, 11: 2.200985160, 12: 2.178812830, 13: 2.160368656, 14: 2.144786688, 15: 2.131449546 };
const t95 = t95ByDf[panelIds.length - 1];
if (!t95) throw new Error(`no t critical value configured for ${panelIds.length} panels`);
const means = Object.fromEntries(arms.map(arm => {
  const values = panelIds.map(panel => panelScores.get(panel)[arm]);
  return [arm, { meanPointsPerBattle: mean(values), panelMeanScores: values, battles: manifest.design.battlesPerArmPerPanel * panelIds.length }];
}));
const comparisons = {};
for (let i = 0; i < arms.length; i++) for (let j = i + 1; j < arms.length; j++) {
  const a = arms[i], b = arms[j];
  const deltas = panelIds.map(panel => panelScores.get(panel)[a] - panelScores.get(panel)[b]);
  const delta = mean(deltas), se = sd(deltas) / Math.sqrt(deltas.length);
  comparisons[`${a}_minus_${b}`] = {
    meanDeltaPointsPerBattle: delta,
    relativePercentVsComparator: delta / means[b].meanPointsPerBattle * 100,
    panelDeltas: deltas,
    t95CI: [delta - t95 * se, delta + t95 * se],
    conservativeScreenCI: [delta - 3.3 * se, delta + 3.3 * se],
    positivePanels: deltas.filter(x => x > 1e-12).length,
    negativePanels: deltas.filter(x => x < -1e-12).length,
    tiePanels: deltas.filter(x => Math.abs(x) <= 1e-12).length,
  };
}
const teamInfo = new Map(manifest.opponentTeams.map(team => [team.name, team]));
const cohortInfo = new Map();
for (const panel of manifest.panels) for (const cohort of panel.cohorts) {
  const years = cohort.teams.map(name => teamInfo.get(name)?.year);
  if (years.some(year => !year)) throw new Error(`missing opponent metadata for ${cohort.id}`);
  const n2024 = years.filter(year => year === 2024).length;
  cohortInfo.set(`${panel.panel}:${cohort.id}`, { teams: cohort.teams, yearMix: `${n2024}x2024_${years.length - n2024}x2025` });
}
const contexts = {};
for (const comparison of Object.keys(comparisons)) {
  const [a, b] = comparison.split('_minus_');
  const byTeam = new Map();
  const byYearMix = new Map();
  for (const [key, scores] of cohortScores) {
    if (!Number.isFinite(scores[a]) || !Number.isFinite(scores[b])) throw new Error(`incomplete cohort scores: ${key}`);
    const metadata = cohortInfo.get(key);
    if (!metadata) throw new Error(`missing cohort composition: ${key}`);
    const delta = scores[a] - scores[b];
    if (!byYearMix.has(metadata.yearMix)) byYearMix.set(metadata.yearMix, []);
    byYearMix.get(metadata.yearMix).push(delta);
    for (const name of metadata.teams) {
      if (!byTeam.has(name)) byTeam.set(name, []);
      byTeam.get(name).push(delta);
    }
  }
  const teamRows = [...byTeam].map(([name, deltas]) => ({ name, cohorts: deltas.length, meanContextDelta: mean(deltas) }));
  const yearRows = [...byYearMix].map(([yearMix, deltas]) => ({ yearMix, cohorts: deltas.length, meanContextDelta: mean(deltas) }));
  contexts[comparison] = {
    interpretation: 'Exploratory shared-cohort associations only; not isolated duels or causal effects.',
    worstContexts: teamRows.sort((x, y) => x.meanContextDelta - y.meanContextDelta).slice(0, 8),
    bestContexts: teamRows.sort((x, y) => y.meanContextDelta - x.meanContextDelta).slice(0, 8),
    byYearMix: yearRows.sort((x, y) => x.yearMix.localeCompare(y.yearMix)),
  };
}
const analysis = {
  status: 'COMPLETED_EXPLORATORY_FRESH_SEED_HYBRID_SCREEN',
  manifestSha256: sha(fs.readFileSync(manifestPath)),
  design: manifest.design,
  candidateHashes: manifest.candidates,
  means,
  pairwiseComparisons: comparisons,
  exploratoryContexts: contexts,
  note: 'This is an exploratory 12-panel screen after candidate selection, not an independent confirmatory holdout. The conservativeScreenCI uses a t multiplier of 3.3 as a rough familywise screen across six pairwise comparisons; it is not a calibrated simultaneous interval.',
};
const output = path.join(experimentDir, 'analysis.json');
fs.writeFileSync(output, `${JSON.stringify(analysis, null, 2)}\n`);
console.log(JSON.stringify({ status: analysis.status, design: analysis.design, means: Object.fromEntries(Object.entries(means).map(([arm, value]) => [arm, { meanPointsPerBattle: value.meanPointsPerBattle, battles: value.battles }])), comparisons: Object.fromEntries(Object.entries(comparisons).map(([key, value]) => [key, { meanDeltaPointsPerBattle: value.meanDeltaPointsPerBattle, relativePercentVsComparator: value.relativePercentVsComparator, t95CI: value.t95CI, conservativeScreenCI: value.conservativeScreenCI, positivePanels: value.positivePanels, negativePanels: value.negativePanels, tiePanels: value.tiePanels }])), contexts: Object.fromEntries(Object.entries(contexts).map(([key, value]) => [key, { worstContexts: value.worstContexts.slice(0, 3), bestContexts: value.bestContexts.slice(0, 3), byYearMix: value.byYearMix }])), output }, null, 2));
