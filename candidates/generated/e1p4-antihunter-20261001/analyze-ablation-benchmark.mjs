import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const experimentDir = process.argv[2]
  ? path.resolve(repo, process.argv[2])
  : path.join(repo, 'experiments/e1p4-ablation-20261002');
const manifestPath = path.join(experimentDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
if (sha(fs.readFileSync(manifestPath)) !== fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim()) throw new Error('manifest hash mismatch');
const arms = manifest.design.arms;
const records = Object.fromEntries(arms.map(arm => [arm, new Map()]));
const totals = Object.fromEntries(arms.map(arm => [arm, { points: 0, battles: 0 }]));

for (const record of manifest.configs) {
  const bytes = fs.readFileSync(record.path);
  if (sha(bytes) !== record.sha256) throw new Error(`config hash mismatch: ${record.path}`);
  const config = JSON.parse(bytes);
  const result = JSON.parse(fs.readFileSync(config.outputPath, 'utf8'));
  if (result.configSha256 !== record.sha256) throw new Error(`result/config mismatch: ${record.path}`);
  if (result.engineJar.sha256 !== manifest.engineJar.sha256) throw new Error(`engine mismatch: ${record.arm}/${record.panel}`);
  if (result.aggregate.battles !== record.battles) throw new Error(`battle-count mismatch: ${record.arm}/${record.panel}`);
  const cohorts = new Map();
  const cohortNames = new Map(config.cohorts.map(cohort => [cohort.id, cohort.opponents.map(team => team.name)]));
  let points = 0;
  let battles = 0;
  for (const run of result.runs) {
    if (run.seed !== config.seeds[0]) throw new Error(`seed mismatch in ${run.runId}`);
    const names = cohortNames.get(run.cohortId);
    if (!names || names.length !== 3) throw new Error(`cohort mismatch in ${run.runId}`);
    points += run.candidate.teamRaw;
    battles += run.battles;
    cohorts.set(run.cohortId, { names, raw: run.candidate.teamRaw, battles: run.battles });
  }
  if (battles !== manifest.design.battlesPerArm / manifest.design.panels) throw new Error(`panel battle mismatch ${record.arm}/${record.panel}`);
  if (records[record.arm].has(record.panel)) throw new Error(`duplicate result ${record.arm}/${record.panel}`);
  records[record.arm].set(record.panel, { points, battles, cohorts });
  totals[record.arm].points += points;
  totals[record.arm].battles += battles;
}
for (const arm of arms) if (records[arm].size !== manifest.design.panels) throw new Error(`incomplete arm ${arm}`);

const mean = xs => xs.reduce((sum, value) => sum + value, 0) / xs.length;
const sd = xs => Math.sqrt(xs.reduce((sum, value) => sum + (value - mean(xs)) ** 2, 0) / (xs.length - 1));
const t95 = { 4: 3.182446305, 8: 2.364624252, 16: 2.131449546 }[manifest.design.panels];
if (!t95) throw new Error(`no t critical value for ${manifest.design.panels} panels`);
const panelMeans = Object.fromEntries(arms.map(arm => [arm, []]));
for (let panel = 1; panel <= manifest.design.panels; panel++) {
  for (const arm of arms) {
    const row = records[arm].get(panel);
    panelMeans[arm].push(row.points / row.battles);
  }
}
const pairwise = {};
for (const [index, left] of arms.entries()) for (const right of arms.slice(index + 1)) {
  const deltas = panelMeans[right].map((value, i) => value - panelMeans[left][i]);
  const difference = mean(deltas);
  const standardError = sd(deltas) / Math.sqrt(deltas.length);
  pairwise[`${right}-minus-${left}`] = {
    panelDeltas: deltas,
    meanDeltaPointsPerBattle: difference,
    relativePercent: 100 * difference / mean(panelMeans[left]),
    panelStandardDeviation: sd(deltas),
    standardError,
    t95CI: [difference - t95 * standardError, difference + t95 * standardError],
    positivePanels: deltas.filter(value => value > 0).length,
    negativePanels: deltas.filter(value => value < 0).length,
    tiePanels: deltas.filter(value => value === 0).length,
  };
}
const contextComparisons = {};
for (const arm of arms.filter(candidate => candidate !== 'e1p3')) {
  const byOpponent = new Map();
  for (let panel = 1; panel <= manifest.design.panels; panel++) {
    const baseline = records.e1p3.get(panel);
    const treatment = records[arm].get(panel);
    for (const [cohortId, baseRow] of baseline.cohorts) {
      const treatmentRow = treatment.cohorts.get(cohortId);
      if (!treatmentRow || treatmentRow.names.join('\0') !== baseRow.names.join('\0')) throw new Error(`unpaired cohort ${panel}/${cohortId}`);
      const delta = treatmentRow.raw / treatmentRow.battles - baseRow.raw / baseRow.battles;
      for (const name of baseRow.names) {
        const values = byOpponent.get(name) ?? [];
        values.push(delta);
        byOpponent.set(name, values);
      }
    }
  }
  contextComparisons[arm] = [...byOpponent].map(([name, values]) => ({
    name,
    panels: values.length,
    meanDelta: mean(values),
    positivePanels: values.filter(value => value > 0).length,
    negativePanels: values.filter(value => value < 0).length,
    tiePanels: values.filter(value => value === 0).length,
  })).sort((a, b) => a.meanDelta - b.meanDelta);
}
const output = {
  status: 'COMPLETED_ABLATION_SCREEN',
  manifestSha256: sha(fs.readFileSync(manifestPath)),
  design: manifest.design,
  engineJar: manifest.engineJar,
  candidateHashes: Object.fromEntries(Object.entries(manifest.candidates).map(([arm, values]) => [arm, values.map(value => value.sha256)])),
  means: Object.fromEntries(arms.map(arm => [arm, {
    points: totals[arm].points,
    battles: totals[arm].battles,
    meanPointsPerBattle: totals[arm].points / totals[arm].battles,
  }])),
  panelMeans,
  pairwise,
  contextComparisons,
  interpretation: 'Ablation screen only. The four-arm field test identifies promising components; it does not promote any variant. Each per-opponent context is a shared 4-team battle including two other opponents, not an isolated duel.',
};
fs.writeFileSync(path.join(experimentDir, 'analysis.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
