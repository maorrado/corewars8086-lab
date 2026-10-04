import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const experimentDir = process.argv[2]
  ? path.resolve(repo, process.argv[2])
  : path.join(repo, 'experiments/widefield-fourway-20261002');
const manifestPath = path.join(experimentDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
if (sha(fs.readFileSync(manifestPath)) !== fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim()) throw new Error('manifest hash mismatch');
const armNames = manifest.design.arms;
const byPanel = new Map();
const perCohort = new Map();
for (const record of manifest.configs) {
  const bytes = fs.readFileSync(record.path);
  if (sha(bytes) !== record.sha256) throw new Error(`config hash mismatch: ${record.path}`);
  const config = JSON.parse(bytes);
  const resultPath = config.outputPath;
  if (!fs.existsSync(resultPath)) throw new Error(`missing result: ${resultPath}`);
  const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  if (result.aggregate.battles !== record.battles) throw new Error(`battle count mismatch: ${record.path}`);
  if (result.engineJar.sha256 !== manifest.engineJar.sha256) throw new Error(`engine hash mismatch: ${record.path}`);
  if (result.runs.length !== config.cohorts.length) throw new Error(`cohort count mismatch: ${record.path}`);
  if (!byPanel.has(record.panel)) byPanel.set(record.panel, {});
  byPanel.get(record.panel)[record.arm] = result.aggregate.teamPerBattle;
  for (const run of result.runs) {
    const key = `${record.panel}:${run.cohortId}`;
    if (!perCohort.has(key)) perCohort.set(key, {});
    perCohort.get(key)[record.arm] = run.candidate.teamPerBattle;
  }
}
for (let panel = 1; panel <= manifest.design.panels; panel++) {
  const scores = byPanel.get(panel);
  if (!scores || armNames.some(arm => !Number.isFinite(scores[arm]))) throw new Error(`incomplete panel ${panel}`);
}
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const sd = values => {
  const center = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - center) ** 2, 0) / (values.length - 1));
};
const allPanels = [...byPanel.keys()].sort((a, b) => a - b);
const arms = Object.fromEntries(armNames.map(arm => {
  const values = allPanels.map(panel => byPanel.get(panel)[arm]);
  return [arm, {
    panelMeanScores: values,
    meanPointsPerBattle: mean(values),
    totalPoints: mean(values) * manifest.design.battlesPerArmPerPanel * manifest.design.panels,
    battles: manifest.design.battlesPerArmPerPanel * manifest.design.panels,
  }];
}));

const comparisons = {};
for (let i = 0; i < armNames.length; i++) for (let j = i + 1; j < armNames.length; j++) {
  const a = armNames[i];
  const b = armNames[j];
  const deltas = allPanels.map(panel => byPanel.get(panel)[a] - byPanel.get(panel)[b]);
  const avg = mean(deltas);
  const standardDeviation = sd(deltas);
  const standardError = standardDeviation / Math.sqrt(deltas.length);
  const t95 = 2.131449545559323; // two-sided 95% t critical, df=15 (16 independent panels)
  const conservativeMultiplicityT = 3.5; // conservative familywise bound for six pairwise comparisons
  comparisons[`${a}_minus_${b}`] = {
    meanDeltaPointsPerBattle: avg,
    relativePercentVsComparator: avg / mean(allPanels.map(panel => byPanel.get(panel)[b])) * 100,
    panelDeltas: deltas,
    panelStandardDeviation: standardDeviation,
    standardError,
    t95CI: [avg - t95 * standardError, avg + t95 * standardError],
    conservativeFamilywiseCI: [avg - conservativeMultiplicityT * standardError, avg + conservativeMultiplicityT * standardError],
    positivePanels: deltas.filter(value => value > 1e-12).length,
    negativePanels: deltas.filter(value => value < -1e-12).length,
    tiePanels: deltas.filter(value => Math.abs(value) <= 1e-12).length,
  };
}

const cohortMetadata = new Map();
for (const panel of manifest.panels) for (const cohort of panel.cohorts) {
  const years = cohort.teams.map(name => manifest.opponentTeams.find(team => team.name === name)?.year);
  if (years.some(year => !year)) throw new Error(`missing year metadata for cohort ${cohort.id}`);
  const n2024 = years.filter(year => year === 2024).length;
  cohortMetadata.set(`${panel.panel}:${cohort.id}`, { teams: cohort.teams, n2024, n2025: years.length - n2024 });
}
const contextComparisons = {};
for (const comparison of Object.keys(comparisons)) {
  const [a, b] = comparison.split('_minus_');
  const byOpponent = new Map();
  const byYearMix = new Map();
  for (const [key, scores] of perCohort) {
    if (!Number.isFinite(scores[a]) || !Number.isFinite(scores[b])) throw new Error(`incomplete arm cohort: ${key}`);
    const meta = cohortMetadata.get(key);
    if (!meta) throw new Error(`missing cohort metadata: ${key}`);
    const delta = scores[a] - scores[b];
    const mixKey = `${meta.n2024}x2024_${meta.n2025}x2025`;
    if (!byYearMix.has(mixKey)) byYearMix.set(mixKey, []);
    byYearMix.get(mixKey).push(delta);
    for (const name of meta.teams) {
      if (!byOpponent.has(name)) byOpponent.set(name, new Map());
      const perPanel = byOpponent.get(name);
      if (!perPanel.has(Number(key.split(':')[0]))) perPanel.set(Number(key.split(':')[0]), []);
      perPanel.get(Number(key.split(':')[0])).push(delta);
    }
  }
  const opponentRows = [...byOpponent].map(([name, panelMap]) => {
    const panelDeltas = [...panelMap.values()].map(mean);
    return {
      name,
      panels: panelDeltas.length,
      meanContextDelta: mean(panelDeltas),
      positivePanels: panelDeltas.filter(value => value > 1e-12).length,
      negativePanels: panelDeltas.filter(value => value < -1e-12).length,
      tiePanels: panelDeltas.filter(value => Math.abs(value) <= 1e-12).length,
    };
  });
  const yearMixRows = [...byYearMix].map(([composition, values]) => ({ composition, cohorts: values.length, meanContextDelta: mean(values) }));
  contextComparisons[comparison] = {
    interpretation: 'Exploratory paired score differences within shared 3-opponent cohorts. Opponent rows are contexts, not isolated duels or causal effects.',
    worstContexts: opponentRows.sort((x, y) => x.meanContextDelta - y.meanContextDelta).slice(0, 12),
    bestContexts: opponentRows.sort((x, y) => y.meanContextDelta - x.meanContextDelta).slice(0, 12),
    byYearComposition: yearMixRows.sort((x, y) => x.composition.localeCompare(y.composition)),
  };
}

const analysis = {
  status: 'COMPLETED_DIRECT_FOUR_CANDIDATE_WIDEFIELD_COMPARISON',
  manifestSha256: sha(fs.readFileSync(manifestPath)),
  design: manifest.design,
  engineJar: manifest.engineJar,
  candidateHashes: manifest.candidates,
  means: arms,
  pairwiseComparisons: comparisons,
  contextComparisons,
  interpretation: 'Scores estimate average team points per battle when each candidate joins three teams sampled from the included unique historical code-pair pool and the four current zombies. They do not guarantee a single tournament outcome. Pairwise intervals use the 16 paired panel means; conservative familywise intervals use a deliberately high t multiplier for six comparisons. Context rows are exploratory shared-battle associations.',
};
const output = path.join(experimentDir, 'analysis.json');
fs.writeFileSync(output, `${JSON.stringify(analysis, null, 2)}\n`);
console.log(JSON.stringify({ status: analysis.status, manifestSha256: analysis.manifestSha256, design: analysis.design, means: Object.fromEntries(Object.entries(arms).map(([arm, value]) => [arm, { meanPointsPerBattle: value.meanPointsPerBattle, battles: value.battles }])), pairwiseComparisons: Object.fromEntries(Object.entries(comparisons).map(([key, value]) => [key, { meanDeltaPointsPerBattle: value.meanDeltaPointsPerBattle, relativePercentVsComparator: value.relativePercentVsComparator, t95CI: value.t95CI, conservativeFamilywiseCI: value.conservativeFamilywiseCI, positivePanels: value.positivePanels, negativePanels: value.negativePanels, tiePanels: value.tiePanels }])), analysisPath: output }, null, 2));
