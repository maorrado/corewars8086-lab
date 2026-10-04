import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const experimentDir = path.join(repo, 'experiments/e1p4-antihunter-screen-20261001');
const arms = ['e1p3', 'e1p4', 'm049', 'm050'];
const panels = [];
for (let panel = 1; panel <= 4; panel++) {
  const tag = String(panel).padStart(2, '0');
  const row = { panel };
  for (const arm of arms) {
    const result = JSON.parse(fs.readFileSync(path.join(experimentDir, 'prepared', 'panel-' + tag + '-' + arm, 'result.json'), 'utf8'));
    if (result.aggregate.battles !== 1250) throw new Error('unexpected battle count: panel ' + panel + ' ' + arm);
    row[arm] = result.aggregate.teamPerBattle;
  }
  panels.push(row);
}
const mean = xs => xs.reduce((sum, value) => sum + value, 0) / xs.length;
const sampleSd = xs => Math.sqrt(xs.reduce((sum, value) => sum + (value - mean(xs)) ** 2, 0) / (xs.length - 1));
const t95df3 = 3.182446305284263;
const overall = Object.fromEntries(arms.map(arm => [arm, mean(panels.map(panel => panel[arm]))]));
const comparisons = {};
for (const reference of ['e1p3', 'm049', 'm050']) {
  const pairedPanelDeltas = panels.map(panel => panel.e1p4 - panel[reference]);
  const delta = mean(pairedPanelDeltas);
  const standardError = sampleSd(pairedPanelDeltas) / Math.sqrt(pairedPanelDeltas.length);
  comparisons[reference] = {
    pairedPanelDeltas,
    meanDeltaPointsPerBattle: delta,
    relativePercent: 100 * delta / overall[reference],
    panelStandardDeviation: sampleSd(pairedPanelDeltas),
    standardError,
    unadjusted95CI: [delta - t95df3 * standardError, delta + t95df3 * standardError],
    classification: delta > 0 ? 'positive-screen-mean' : 'nonpositive-screen-mean',
  };
}
const analysis = {
  status: 'COMPLETE_FOUR_PANEL_SCREEN_NOT_CONFIRMATORY',
  manifestSha256: fs.readFileSync(path.join(repo, 'candidates/generated/e1p4-antihunter-20261001/frozen/manifest.json.sha256'), 'utf8').trim(),
  design: { panels: 4, arms, battlesPerArm: 5000, totalBattles: 20000, teams: 75, seatsPerBattle: 4,
    seedsPerPanel: 2, pairedCompositionsAndSeeds: true, clusterUnit: 'panel',
    confidence: 'unadjusted 95% t intervals with 3 df; three candidate comparisons were examined',
    engine: 'pinned deterministic-v6 JAR through validated research-batch wrapper; no gameplay overlays',
    limitation: 'four independent panel-level clusters are too few for confirmation; this is a screen, not promotion evidence' },
  meansTeamPointsPerBattle: overall,
  panels,
  comparisons,
  decision: 'Promising positive screen for e1p4; all three intervals include zero. Do not promote to final without a larger, independently frozen holdout.',
};
const output = path.join(experimentDir, 'analysis.json');
if (fs.existsSync(output)) throw new Error('refusing existing output: ' + output);
fs.writeFileSync(output, JSON.stringify(analysis, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(analysis, null, 2));
