import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const baseline = JSON.parse(fs.readFileSync(path.join(repo, 'candidates/generated/claude-e1-confirmation-20261001/analysis.json'), 'utf8'));
const t95df7 = 2.364624251;
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function readPanel(file, expectedConfig) {
  const result = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (result.aggregate?.battles !== 1250 || result.researchExecution?.mode !== 'isolated-persistent-serial')
    throw new Error(`unexpected result schema/count: ${file}`);
  const config = JSON.parse(fs.readFileSync(expectedConfig, 'utf8'));
  if (JSON.stringify(result.config.seeds) !== JSON.stringify(config.seeds)
      || result.config.cohorts.length !== config.cohorts.length || result.config.battles !== config.battles)
    throw new Error(`panel inputs differ from frozen config: ${file}`);
  return { score: result.aggregate.teamPerBattle, battles: result.aggregate.battles, inputSha256: sha(file),
    configSha256: result.configSha256, planSha256: result.researchExecution.planSha256 };
}
function summarize(name, reference, values) {
  const n = values.length;
  const mean = values.reduce((sum, value) => sum + value, 0) / n;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1);
  const margin = t95df7 * Math.sqrt(variance / n);
  const low = mean - margin, high = mean + margin;
  return { candidate: name, reference, delta: mean, nominal95PairedPanelCI: [low, high], panels: n,
    classification: low > 0 ? 'higher-in-this-screen' : high < 0 ? 'lower-in-this-screen' : 'inconclusive',
    byPanel: values.map((delta, index) => ({ panel: `panel-${String(index + 1).padStart(2, '0')}`, delta })) };
}

const scores = Object.fromEntries(Object.entries(baseline.panelScores[0].scores).map(([name]) => [name, []]));
const panelInputs = [];
for (let panel = 1; panel <= 8; panel++) {
  const id = String(panel).padStart(2, '0');
  const baselinePanel = baseline.panelScores.find(item => item.panel === `panel-${id}`);
  if (!baselinePanel) throw new Error(`missing baseline panel ${id}`);
  for (const [name, score] of Object.entries(baselinePanel.scores)) scores[name].push(score);
  const configPath = path.join(repo, `experiments/claude-e1p3-screen-20261001/configs/panel-${id}-e1p3.json`);
  const resultPath = path.join(repo, `experiments/claude-e1p3-screen-20261001/accelerated/panel-${id}-e1p3/result.json`);
  scores.e1p3 ??= [];
  const item = readPanel(resultPath, configPath);
  scores.e1p3.push(item.score);
  panelInputs.push({ arm: 'e1p3', panel: id, result: resultPath, ...item });
}

const relays = {};
for (const variant of ['relay-a', 'relay-b', 'relay-ab']) {
  relays[variant] = [];
  for (let panel = 1; panel <= 8; panel++) {
    const id = String(panel).padStart(2, '0');
    const configPath = path.join(repo, `experiments/claude-e1p3-relay-screen-20261001/configs/${variant}-panel-${id}.json`);
    const resultPath = path.join(repo, `experiments/claude-e1p3-relay-screen-20261001/accelerated/${variant}-panel-${id}/result.json`);
    const item = readPanel(resultPath, configPath);
    relays[variant].push(item.score);
    panelInputs.push({ arm: variant, panel: id, result: resultPath, ...item });
  }
}

const comparisons = [];
for (const reference of ['m049', 'm050', 'c090', 'e1']) {
  comparisons.push(summarize('e1p3', reference, scores.e1p3.map((value, index) => value - scores[reference][index])));
}
for (const variant of Object.keys(relays)) {
  for (const reference of ['e1p3', 'm049', 'm050']) {
    comparisons.push(summarize(variant, reference, relays[variant].map((value, index) => value - scores[reference][index])));
  }
}
const pooled = Object.fromEntries(Object.entries(scores).map(([name, values]) => [name, values.reduce((sum, value) => sum + value, 0) / values.length]));
for (const [name, values] of Object.entries(relays)) pooled[name] = values.reduce((sum, value) => sum + value, 0) / values.length;
const output = { status: 'COMPLETE_PAIRED_SCREEN', recordedAt: new Date().toISOString(),
  interpretation: 'Exploratory paired screen on the same eight 2025 online-stage panels/seeds used by e1 confirmation. The nominal t intervals are not fresh holdout evidence and are not simultaneous across contrasts.',
  baselineConfirmationManifestSha256: baseline.manifestSha256, pooled, comparisons, panelInputs };
const outputPath = path.join(repo, 'experiments/claude-e1p3-relay-screen-20261001/analysis.json');
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: output.status, pooled, comparisons: comparisons.map(({candidate,reference,delta,nominal95PairedPanelCI,classification}) => ({candidate,reference,delta,nominal95PairedPanelCI,classification})), outputPath, outputSha256: sha(outputPath) }, null, 2));
