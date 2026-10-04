import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const experimentDir = process.argv[2]
  ? path.resolve(repo, process.argv[2])
  : path.join(repo, 'experiments/e1p4-general-confirmation-20261002');
const manifestPath = path.join(experimentDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
if (sha(fs.readFileSync(manifestPath)) !== fs.readFileSync(path.join(experimentDir, 'manifest.json.sha256'), 'utf8').trim()) throw new Error('manifest hash mismatch');

const records = { e1p3: new Map(), e1p4: new Map() };
const summary = { e1p3: { points: 0, battles: 0 }, e1p4: { points: 0, battles: 0 } };
for (const configRecord of manifest.configs) {
  const configBytes = fs.readFileSync(configRecord.path);
  if (sha(configBytes) !== configRecord.sha256) throw new Error(`config hash mismatch: ${configRecord.path}`);
  const config = JSON.parse(configBytes);
  const result = JSON.parse(fs.readFileSync(config.outputPath, 'utf8'));
  if (result.configSha256 !== configRecord.sha256) throw new Error(`result/config mismatch: ${configRecord.path}`);
  if (result.engineJar.sha256 !== manifest.engineJar.sha256) throw new Error(`engine hash mismatch: ${configRecord.arm} panel ${configRecord.panel}`);
  if (result.aggregate.battles !== configRecord.battles) throw new Error(`wrong battle count: ${configRecord.arm} panel ${configRecord.panel}`);
  const panel = { raw: 0, battles: 0, cohorts: new Map() };
  const cohortNames = new Map(config.cohorts.map(cohort => [cohort.id, cohort.opponents.map(team => team.name)]));
  for (const run of result.runs) {
    if (run.seed !== config.seeds[0]) throw new Error(`seed mismatch: ${run.runId}`);
    const names = cohortNames.get(run.cohortId);
    if (!names || names.length !== 3) throw new Error(`cohort mismatch: ${run.runId}`);
    const raw = run.candidate.teamRaw;
    panel.raw += raw;
    panel.battles += run.battles;
    panel.cohorts.set(run.cohortId, { raw, battles: run.battles, names });
  }
  if (panel.battles !== manifest.design.battlesPerArm / manifest.design.panels) throw new Error(`panel battle count mismatch: ${configRecord.arm} ${configRecord.panel}`);
  records[configRecord.arm].set(configRecord.panel, panel);
  summary[configRecord.arm].points += panel.raw;
  summary[configRecord.arm].battles += panel.battles;
}
for (const arm of Object.keys(records)) if (records[arm].size !== manifest.design.panels) throw new Error(`incomplete ${arm}`);

const deltas = [];
const panels = [];
for (let panelId = 1; panelId <= manifest.design.panels; panelId++) {
  const p3 = records.e1p3.get(panelId), p4 = records.e1p4.get(panelId);
  const d = p4.raw / p4.battles - p3.raw / p3.battles;
  deltas.push(d);
  panels.push({ panel: panelId, e1p3: p3.raw / p3.battles, e1p4: p4.raw / p4.battles, delta: d });
}
const mean = xs => xs.reduce((sum, value) => sum + value, 0) / xs.length;
const sd = xs => Math.sqrt(xs.reduce((sum, value) => sum + (value - mean(xs)) ** 2, 0) / (xs.length - 1));
const difference = mean(deltas), standardError = sd(deltas) / Math.sqrt(deltas.length);
const t95df15 = 2.131449546;
const perOpponent = new Map();
for (let panelId = 1; panelId <= manifest.design.panels; panelId++) {
  const p3 = records.e1p3.get(panelId), p4 = records.e1p4.get(panelId);
  for (const [cohortId, row3] of p3.cohorts) {
    const row4 = p4.cohorts.get(cohortId);
    if (!row4 || row3.names.join('\0') !== row4.names.join('\0')) throw new Error(`paired cohort mismatch: ${cohortId}`);
    for (const name of row3.names) {
      const entry = perOpponent.get(name) ?? { deltaByPanel: [] };
      entry.deltaByPanel.push(row4.raw / row4.battles - row3.raw / row3.battles);
      perOpponent.set(name, entry);
    }
  }
}
const opponentEffects = [...perOpponent].map(([name, entry]) => ({
  name,
  panels: entry.deltaByPanel.length,
  meanDelta: mean(entry.deltaByPanel),
  positivePanels: entry.deltaByPanel.filter(value => value > 0).length,
  negativePanels: entry.deltaByPanel.filter(value => value < 0).length,
  tiePanels: entry.deltaByPanel.filter(value => value === 0).length,
  deltaByPanel: entry.deltaByPanel,
})).sort((a, b) => a.meanDelta - b.meanDelta);
const output = {
  status: 'COMPLETED_INDEPENDENT_E1P3_E1P4_CONFIRMATION',
  manifestSha256: sha(fs.readFileSync(manifestPath)),
  design: manifest.design,
  engineJar: manifest.engineJar,
  candidateHashes: Object.fromEntries(Object.entries(manifest.candidates).map(([arm, values]) => [arm, values.map(value => value.sha256)])),
  totalRunRecords: manifest.configs.length * manifest.design.cohortsPerPanel,
  means: Object.fromEntries(Object.entries(summary).map(([arm, value]) => [arm, { points: value.points, battles: value.battles, meanPointsPerBattle: value.points / value.battles }])),
  pairedPanelResults: panels,
  e1p4MinusE1p3: {
    panelDeltas: deltas,
    meanDeltaPointsPerBattle: difference,
    relativePercent: 100 * difference / (summary.e1p3.points / summary.e1p3.battles),
    panelStandardDeviation: sd(deltas),
    standardError,
    t95CI: [difference - t95df15 * standardError, difference + t95df15 * standardError],
    positivePanels: deltas.filter(value => value > 0).length,
    negativePanels: deltas.filter(value => value < 0).length,
    tiePanels: deltas.filter(value => value === 0).length,
  },
  worstContexts: opponentEffects.slice(0, 15),
  bestContexts: opponentEffects.slice(-15).reverse(),
  interpretation: `This is an independent paired follow-up over ${manifest.design.opponentTeams} opponent teams${manifest.design.opponentYears ? ` from ${Object.entries(manifest.design.opponentYears).map(([year, count]) => `${count} in ${year}`).join(' and ')}` : ''}. Context deltas are shared 4-team battles with two other opponents, not isolated duels; they do not establish performance against unseen code.`,
};
const outPath = path.join(experimentDir, 'analysis.json');
if (fs.existsSync(outPath)) throw new Error(`refusing to overwrite ${outPath}`);
fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify(output, null, 2));
