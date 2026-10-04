import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const manifestFile = path.join(repo, 'experiments/claude-e1p3-timing-screen-20261001/configs/screen-manifest.json');
const resultsRoot = path.join(repo, 'experiments/claude-e1p3-timing-screen-20261001/prepared');
const screenAnalysisFile = path.join(repo, 'experiments/claude-e1p3-screen-20261001/analysis.json');
const outputFile = path.join(repo, 'experiments/claude-e1p3-timing-screen-20261001/analysis.json');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const manifestBytes = fs.readFileSync(manifestFile), manifest = JSON.parse(manifestBytes);
const prior = read(screenAnalysisFile);
if (manifest.frozenSuiteManifestSha256 !== 'e1e25fbe3ad90726f3894cfd23438c4f2954b96ae1f13d1d55a9125910ecc596'
  || prior.baselineManifestSha256 !== manifest.frozenSuiteManifestSha256)
  throw new Error('timing screen is not bound to the expected frozen base screen');
if (manifest.configs.length !== 16 || prior.panelScores.length !== 8) throw new Error('unexpected timing screen size');
if (fs.existsSync(outputFile)) throw new Error(`refusing existing analysis output: ${outputFile}`);
const baseline = new Map(prior.panelScores.map(row => [row.panel, row]));
const byVariant = new Map(manifest.variants.map(item => [item.id, []]));
const evidence = [];
for (const item of manifest.configs) {
  const configBytes = fs.readFileSync(item.path);
  if (sha(configBytes) !== item.sha256) throw new Error(`config hash mismatch: ${item.path}`);
  const config = JSON.parse(configBytes);
  const panel = `panel-${item.panel}`;
  if (config.seeds.length !== 2 || config.cohorts.length !== 25 || config.battles !== 25
    || item.physicalWars !== 1250) throw new Error(`unexpected panel design: ${item.variant}/${item.panel}`);
  const resultFile = path.join(resultsRoot, `${item.variant}-${panel}`, 'result.json');
  const resultBytes = fs.readFileSync(resultFile), result = JSON.parse(resultBytes);
  if (result.configSha256 !== item.sha256 || JSON.stringify(result.config) !== JSON.stringify(config))
    throw new Error(`executed config identity mismatch: ${item.variant}/${panel}`);
  if (result.aggregate.battles !== 1250 || result.runs.length !== 50
    || result.runs.reduce((n, run) => n + run.battles, 0) !== 1250)
    throw new Error(`incomplete panel result: ${item.variant}/${panel}`);
  if (result.researchExecution.mode !== 'isolated-persistent-serial'
    || result.researchExecution.overlays.length !== 0
    || result.researchExecution.baseEngine.sha256 !== '31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d')
    throw new Error(`unexpected execution engine/overlay: ${item.variant}/${panel}`);
  byVariant.get(item.variant).push({ panel, score: result.aggregate.teamPerBattle });
  evidence.push({ variant: item.variant, panel, config: { path: item.path, sha256: item.sha256 },
    result: { path: resultFile, bytes: resultBytes.length, sha256: sha(resultBytes) },
    planSha256: result.researchExecution.planSha256 });
}
const mean = values => values.reduce((sum, x) => sum + x, 0) / values.length;
const summaries = [...byVariant].map(([variant, rows]) => {
  if (rows.length !== 8) throw new Error(`missing panels for ${variant}`);
  rows.sort((a, b) => a.panel.localeCompare(b.panel));
  const comparisons = {};
  for (const reference of ['e1p3', 'm050']) {
    const deltas = rows.map(row => row.score - baseline.get(row.panel)[reference]);
    comparisons[reference] = { meanPairedDelta: mean(deltas), panelDeltas: rows.map((row, i) => ({ panel: row.panel, delta: deltas[i] })) };
  }
  return { variant, pooledPointsPerAppearance: mean(rows.map(row => row.score)), panels: rows, comparisons };
});
const analysis = { status: 'COMPLETE_EXPLORATORY_TIMING_SCREEN', recordedAt: new Date().toISOString(),
  manifestSha256: sha(manifestBytes), frozenSuiteManifestSha256: manifest.frozenSuiteManifestSha256,
  protocol: 'Eight reused 2025 online-stage screen panels/seeds. Selection screen only; panel deltas are descriptive, not a fresh holdout or confirmatory inference.',
  controls: 'm050 and e1p3 values are from the exact same eight frozen panel inputs and seeds.',
  battlesPerVariant: 10000, totalNewBattles: 20000, results: summaries, evidence };
fs.writeFileSync(outputFile, `${JSON.stringify(analysis, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: analysis.status, results: summaries.map(({ variant, pooledPointsPerAppearance, comparisons }) => ({
  variant, pooledPointsPerAppearance, versusE1p3: comparisons.e1p3.meanPairedDelta, versusM050: comparisons.m050.meanPairedDelta })),
  outputFile, outputSha256: sha(fs.readFileSync(outputFile)) }, null, 2));
