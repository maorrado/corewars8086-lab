import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const experimentDir = path.join(repo, 'experiments/e1p4-general-validation-20261001');
const manifestPath = path.join(experimentDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
if (sha(fs.readFileSync(manifestPath)) !== fs.readFileSync(path.join(experimentDir, 'manifest.json.sha256'), 'utf8').trim()) {
  throw new Error('manifest hash mismatch');
}

const arms = manifest.design.arms;
const armPanels = Object.fromEntries(arms.map(arm => [arm, new Map()]));
const perOpponent = new Map();
let runCount = 0;
for (const configRecord of manifest.configs) {
  const configBytes = fs.readFileSync(configRecord.path);
  if (sha(configBytes) !== configRecord.sha256) throw new Error(`config hash mismatch: ${configRecord.path}`);
  const config = JSON.parse(configBytes);
  const result = JSON.parse(fs.readFileSync(config.outputPath, 'utf8'));
  if (result.configSha256 !== configRecord.sha256) throw new Error(`result/config mismatch: ${configRecord.path}`);
  if (result.engineJar.sha256 !== manifest.engineJar.sha256) throw new Error(`engine mismatch in ${configRecord.arm} panel ${configRecord.panel}`);
  if (result.aggregate.battles !== configRecord.battles) throw new Error(`battle-count mismatch in ${configRecord.arm} panel ${configRecord.panel}`);
  const panel = armPanels[configRecord.arm].get(configRecord.panel) ?? { raw: 0, battles: 0, cohorts: new Map() };
  const cohortMap = new Map(config.cohorts.map(cohort => [cohort.id, cohort.opponents.map(opponent => opponent.name)]));
  for (const run of result.runs) {
    if (run.seed !== config.seeds[0]) throw new Error(`seed mismatch in ${run.runId}`);
    const cohortNames = cohortMap.get(run.cohortId);
    if (!cohortNames || cohortNames.length !== 3) throw new Error(`bad cohort mapping in ${run.runId}`);
    const candidateTeam = run.candidate.teamRaw;
    panel.raw += candidateTeam;
    panel.battles += run.battles;
    const cohortPoints = panel.cohorts.get(run.cohortId) ?? { raw: 0, battles: 0, names: cohortNames };
    cohortPoints.raw += candidateTeam;
    cohortPoints.battles += run.battles;
    panel.cohorts.set(run.cohortId, cohortPoints);
    for (const name of cohortNames) {
      const entry = perOpponent.get(name) ?? { deltas: [], panels: 0 };
      entry.panels++;
      if (configRecord.arm === 'e1p4') entry.e1p4 = { panel: configRecord.panel, cohort: run.cohortId, perBattle: candidateTeam / run.battles };
      if (configRecord.arm === 'e1p3') entry.e1p3 = { panel: configRecord.panel, cohort: run.cohortId, perBattle: candidateTeam / run.battles };
      perOpponent.set(name, entry);
    }
    runCount++;
  }
  armPanels[configRecord.arm].set(configRecord.panel, panel);
}

for (const [name, entry] of perOpponent) {
  const e1p3Contexts = [];
  const e1p4Contexts = [];
  for (let panel = 1; panel <= manifest.design.panels; panel++) {
    const p3 = armPanels.e1p3.get(panel);
    const p4 = armPanels.e1p4.get(panel);
    const cohortId = [...p3.cohorts.keys()].find(id => p3.cohorts.get(id).names.includes(name));
    if (!cohortId || !p4.cohorts.has(cohortId)) throw new Error(`missing paired opponent exposure: ${name} panel ${panel}`);
    e1p3Contexts.push(p3.cohorts.get(cohortId).raw / p3.cohorts.get(cohortId).battles);
    e1p4Contexts.push(p4.cohorts.get(cohortId).raw / p4.cohorts.get(cohortId).battles);
  }
  entry.deltaByPanel = e1p4Contexts.map((value, index) => value - e1p3Contexts[index]);
  entry.meanDelta = entry.deltaByPanel.reduce((sum, value) => sum + value, 0) / entry.deltaByPanel.length;
  entry.positivePanels = entry.deltaByPanel.filter(value => value > 0).length;
  entry.negativePanels = entry.deltaByPanel.filter(value => value < 0).length;
  entry.tiePanels = entry.deltaByPanel.filter(value => value === 0).length;
  delete entry.e1p3;
  delete entry.e1p4;
}

const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const sampleSd = values => Math.sqrt(values.reduce((sum, value) => sum + (value - mean(values)) ** 2, 0) / (values.length - 1));
const armsSummary = {};
for (const arm of arms) {
  const panels = [...armPanels[arm].entries()].sort((a, b) => a[0] - b[0]).map(([panel, value]) => ({
    panel,
    points: value.raw,
    battles: value.battles,
    pointsPerBattle: value.raw / value.battles,
  }));
  armsSummary[arm] = { points: panels.reduce((sum, value) => sum + value.points, 0), battles: panels.reduce((sum, value) => sum + value.battles, 0), meanPointsPerBattle: panels.reduce((sum, value) => sum + value.points, 0) / panels.reduce((sum, value) => sum + value.battles, 0), panelResults: panels };
  if (panels.length !== manifest.design.panels || panels.some(panel => panel.battles !== manifest.design.cohortsPerPanel * manifest.design.battlesPerCohort)) {
    throw new Error(`incomplete panel data for ${arm}`);
  }
}

const comparisons = {};
for (const baseline of ['e1p3', 'm049', 'm050']) {
  const pairedDeltas = [];
  for (let panel = 1; panel <= manifest.design.panels; panel++) {
    pairedDeltas.push(armPanels.e1p4.get(panel).raw / armPanels.e1p4.get(panel).battles
      - armPanels[baseline].get(panel).raw / armPanels[baseline].get(panel).battles);
  }
  const delta = mean(pairedDeltas);
  const se = sampleSd(pairedDeltas) / Math.sqrt(pairedDeltas.length);
  const t95df7 = 2.364624251;
  const tBonferroni3df7 = 3.5;
  comparisons[`e1p4-minus-${baseline}`] = {
    pairedPanelDeltas: pairedDeltas,
    meanDeltaPointsPerBattle: delta,
    relativePercent: 100 * delta / armsSummary[baseline].meanPointsPerBattle,
    panelStandardDeviation: sampleSd(pairedDeltas),
    standardError: se,
    unadjusted95CI: [delta - t95df7 * se, delta + t95df7 * se],
    conservativeBonferroni95CI3Comparisons: [delta - tBonferroni3df7 * se, delta + tBonferroni3df7 * se],
    positivePanels: pairedDeltas.filter(value => value > 0).length,
    negativePanels: pairedDeltas.filter(value => value < 0).length,
    tiePanels: pairedDeltas.filter(value => value === 0).length,
  };
}

const opponentEffects = [...perOpponent.entries()].map(([name, value]) => ({ name, ...value }))
  .sort((a, b) => a.meanDelta - b.meanDelta);
const output = {
  status: 'COMPLETED_PAIRED_GENERAL_FIELD_VALIDATION',
  manifestSha256: sha(fs.readFileSync(manifestPath)),
  design: manifest.design,
  engineJar: manifest.engineJar,
  candidateWarriorSha256: Object.fromEntries(Object.entries(manifest.candidates).map(([arm, values]) => [arm, values.map(value => value.sha256)])),
  totalRunRecords: runCount,
  means: armsSummary,
  comparisons,
  e1p4VsE1p3ByOpponentContext: {
    note: 'The per-opponent values are paired 4-team contexts, not pure head-to-head duels; each opponent appeared once per panel with two other field teams.',
    mostNegative: opponentEffects.slice(0, 10),
    mostPositive: opponentEffects.slice(-10).reverse(),
  },
  interpretation: 'Panel-level paired intervals are descriptive follow-up evidence on this fixed published 2025 pool. They do not prove performance against unseen code or all possible tournament draws.',
};
const outputPath = path.join(experimentDir, 'analysis.json');
if (fs.existsSync(outputPath)) throw new Error(`refusing to overwrite ${outputPath}`);
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify(output, null, 2));
