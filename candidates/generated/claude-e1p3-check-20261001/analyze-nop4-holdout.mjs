import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const frozen = path.join(here, 'nop4-holdout/frozen');
const runRoot = path.join(repo, 'experiments/claude-e1p3-nop4-holdout-20261001/accelerated');
const outputFile = path.join(repo, 'experiments/claude-e1p3-nop4-holdout-20261001/analysis.json');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const manifestFile = path.join(frozen, 'manifest.json'), manifestBytes = fs.readFileSync(manifestFile);
if (sha(manifestBytes) !== fs.readFileSync(`${manifestFile}.sha256`, 'utf8').trim()) throw new Error('manifest checksum mismatch');
const manifest = JSON.parse(manifestBytes), design = manifest.design;
if (design.finalist !== 'nop4' || design.totalBattles !== 40000 || design.panels !== 8 || design.arms.length !== 4)
  throw new Error('unexpected frozen holdout design');
if (fs.existsSync(outputFile)) throw new Error(`refusing existing analysis: ${outputFile}`);
for (const file of manifest.files) {
  if (!fs.existsSync(file.path) || fs.statSync(file.path).size !== file.bytes || sha(fs.readFileSync(file.path)) !== file.sha256)
    throw new Error(`frozen file changed: ${file.path}`);
}
const scores = Object.fromEntries(design.arms.map(arm => [arm, []]));
const evidence = [], panelInputs = new Map();
for (let panelIndex = 1; panelIndex <= 8; panelIndex++) {
  const panel = `panel-${String(panelIndex).padStart(2, '0')}`;
  for (const arm of design.arms) {
    const configFile = path.join(frozen, 'configs', `${panel}-${arm}.json`);
    const configBytes = fs.readFileSync(configFile), config = JSON.parse(configBytes);
    const resultFile = path.join(runRoot, `${panel}-${arm}`, 'result.json');
    const resultBytes = fs.readFileSync(resultFile), result = JSON.parse(resultBytes);
    if (result.configSha256 !== sha(configBytes) || JSON.stringify(result.config) !== JSON.stringify(config))
      throw new Error(`result/config mismatch: ${panel}-${arm}`);
    if (result.aggregate.battles !== 1250 || result.runs.length !== 50
      || result.runs.reduce((sum, run) => sum + run.battles, 0) !== 1250)
      throw new Error(`incomplete panel: ${panel}-${arm}`);
    if (result.researchExecution.mode !== 'isolated-persistent-serial' || result.researchExecution.overlays.length !== 0
      || result.researchExecution.baseEngine.sha256 !== manifest.engine.sha256)
      throw new Error(`wrong execution engine/overlay: ${panel}-${arm}`);
    const control = { seeds: config.seeds, cohorts: config.cohorts, zombies: config.zombies, battles: config.battles };
    if (panelInputs.has(panel) && JSON.stringify(panelInputs.get(panel)) !== JSON.stringify(control))
      throw new Error(`unpaired panel inputs: ${panel}-${arm}`);
    panelInputs.set(panel, control);
    scores[arm].push(result.aggregate.teamPerBattle);
    evidence.push({ panel, arm, config: { path: configFile, bytes: configBytes.length, sha256: sha(configBytes) },
      result: { path: resultFile, bytes: resultBytes.length, sha256: sha(resultBytes) },
      planSha256: result.researchExecution.planSha256 });
  }
}
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
function compare(candidate, reference) {
  const deltas = scores[candidate].map((value, index) => value - scores[reference][index]);
  const center = mean(deltas), sd = Math.sqrt(deltas.reduce((sum, value) => sum + (value - center) ** 2, 0) / (deltas.length - 1));
  const margin = design.confidence.criticalValue * sd / Math.sqrt(deltas.length);
  return { candidate, reference, meanPairedDelta: center, familywiseConservativeCI: [center - margin, center + margin],
    criticalValue: design.confidence.criticalValue,
    classification: center - margin > 0 ? 'higher-under-holdout-protocol' : center + margin < 0 ? 'lower-under-holdout-protocol' : 'inconclusive',
    pairedPanelDeltas: deltas.map((delta, index) => ({ panel: `panel-${String(index + 1).padStart(2, '0')}`, delta })) };
}
const comparisons = ['m049', 'm050', 'e1p3'].map(control => compare('nop4', control));
const analysis = { status: 'COMPLETE_FRESH_HOLDOUT', recordedAt: new Date().toISOString(),
  manifestSha256: sha(manifestBytes), design,
  pooledPointsPerAppearance: Object.fromEntries(Object.entries(scores).map(([arm, values]) => [arm, mean(values)])),
  comparisons, panelScores: scores,
  interpretation: 'All arms share fresh seeds/cohorts within each panel and used the pinned deterministic v6 engine with zero gameplay overlays. Eight panel means are the paired independent units; intervals use the predeclared conservative critical value.',
  limitation: design.limitation, evidence };
fs.writeFileSync(outputFile, `${JSON.stringify(analysis, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: analysis.status, pooledPointsPerAppearance: analysis.pooledPointsPerAppearance,
  comparisons: comparisons.map(({ candidate, reference, meanPairedDelta, familywiseConservativeCI, classification }) =>
    ({ candidate, reference, meanPairedDelta, familywiseConservativeCI, classification })),
  outputFile, outputSha256: sha(fs.readFileSync(outputFile)) }, null, 2));
