import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assert, equal, sha, weights } from '../model.mjs';
import { record } from '../../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const tCritical95df9 = 2.2621571628540993;
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../..');
const freeze = path.join(here, 'frozen');
const out = path.join(repo, 'experiments/m050-xorb-e1p3-density-extension-20261001');
const parentDir = path.join(repo, 'experiments/e1p3-five-copy-density-20261001');
const parentManifestPath = path.join(repo, 'candidates/generated/e1p3-five-copy-density-20261001/frozen/manifest.json');
const parentManifestBytes = fs.readFileSync(parentManifestPath);
const parentManifest = JSON.parse(parentManifestBytes);
const bytes = fs.readFileSync(path.join(freeze, 'manifest.json'));
equal(sha(bytes), fs.readFileSync(path.join(freeze, 'manifest.json.sha256'), 'utf8').trim(), 'extension manifest checksum');
const manifest = JSON.parse(bytes);
equal(manifest.parentManifestSha256, sha(parentManifestBytes), 'exact parent manifest');
const complete = JSON.parse(fs.readFileSync(path.join(out, 'runner-complete.json'), 'utf8'));
assert(complete.status === 'ALL_XORB_EXTENSION_JOBS_COMPLETE' && complete.configs === 80 && complete.battles === 800,
  'all 80 configs / 800 battles must be complete');
for (const file of manifest.files) equal(record(file.path), file, `frozen input ${file.path}`);

const paired = [0, 1, 2, 3].map(() => new Map());
const results = [];
for (const item of manifest.configs) {
  const configPath = path.join(freeze, 'configs', `${item.id}.json`);
  const configBytes = fs.readFileSync(configPath), config = JSON.parse(configBytes);
  const resultPath = path.join(out, 'accelerated', item.id, 'result.json');
  const resultBytes = fs.readFileSync(resultPath), result = JSON.parse(resultBytes);
  equal(result.configSha256, sha(configBytes), `${item.id} extension config hash`);
  equal(result.config, config, `${item.id} exact extension config`);
  assert(result.aggregate.battles === 10 && result.runs.length === 1 && result.runs[0].battles === 10,
    `${item.id} complete 10-battle run`);
  equal(result.runs[0].cohortId, item.cohortId, `${item.id} cohort`);
  equal(result.runs[0].seed, config.seeds[0], `${item.id} seed`);
  assert(result.researchExecution.mode === 'isolated-persistent-serial' && result.researchExecution.overlays.length === 0
    && result.researchExecution.baseEngine.sha256 === manifest.engine.sha256, `${item.id} original engine/no overlays`);

  const controlMeta = parentManifest.configs.find(entry => entry.id === item.parentId);
  assert(controlMeta && controlMeta.arm === 'm050' && controlMeta.cohortId === item.cohortId
    && controlMeta.k === item.k && controlMeta.orientation === item.orientation, `${item.id} matching frozen parent control`);
  const controlConfigBytes = fs.readFileSync(controlMeta.path), controlConfig = JSON.parse(controlConfigBytes);
  const controlResultPath = path.join(parentDir, 'accelerated', item.parentId, 'result.json');
  const controlResultBytes = fs.readFileSync(controlResultPath), controlResult = JSON.parse(controlResultBytes);
  equal(controlResult.configSha256, sha(controlConfigBytes), `${item.id} parent control config hash`);
  assert(controlResult.aggregate.battles === 10 && controlResult.runs.length === 1 && controlResult.runs[0].battles === 10,
    `${item.id} complete parent control`);
  equal(controlResult.runs[0].cohortId, item.cohortId, `${item.id} parent cohort`);
  equal(controlResult.runs[0].seed, result.runs[0].seed, `${item.id} paired seed`);
  assert(controlResult.researchExecution.mode === 'isolated-persistent-serial' && controlResult.researchExecution.overlays.length === 0
    && controlResult.researchExecution.baseEngine.sha256 === manifest.engine.sha256, `${item.id} parent original engine/no overlays`);

  const rows = paired[item.k].get(item.cohortId) ?? [];
  rows.push({ orientation: item.orientation, seed: result.runs[0].seed,
    xorb: result.runs[0].candidate.teamPerBattle, m050: controlResult.runs[0].candidate.teamPerBattle,
    result: record(resultPath), control: record(controlResultPath), config: record(configPath) });
  paired[item.k].set(item.cohortId, rows);
  results.push({ id: item.id, result: record(resultPath), config: record(configPath),
    parentControl: record(controlResultPath), planSha256: result.researchExecution.planSha256 });
}

const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const variance = values => { const center = mean(values); return values.reduce((sum, value) => sum + (value - center) ** 2, 0) / (values.length - 1); };
function summarize(values) {
  assert(values.length === 10, 'ten cohort clusters per K required');
  const center = mean(values), se = Math.sqrt(variance(values) / values.length);
  return { mean: center, cohorts: values.length, standardError: se,
    descriptive95CI: [center - tCritical95df9 * se, center + tCritical95df9 * se] };
}
const clusters = [0, 1, 2, 3].map(k => {
  const entries = [...paired[k].entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  assert(entries.length === 10, `K=${k}: expected ten cohorts`);
  return entries.map(([cohortId, rows]) => {
    assert(rows.length === 2 && rows.map(row => row.orientation).sort().join(',') === '0,1', `${cohortId}: both orientations required`);
    assert(new Set(rows.map(row => row.seed)).size === 1, `${cohortId}: orientations must share one seed`);
    const xorb = mean(rows.map(row => row.xorb)), m050 = mean(rows.map(row => row.m050));
    return { cohortId, xorb, m050, delta: xorb - m050 };
  });
});
const byK = clusters.map((rows, k) => ({ k, m050Xorb: summarize(rows.map(row => row.xorb)),
  m050: summarize(rows.map(row => row.m050)), pairedDelta: summarize(rows.map(row => row.delta)), cohorts: rows }));
const probability = weights.map(item => item.probability);
const weightedMean = rows => rows.reduce((sum, item, k) => sum + probability[k] * item.pairedDelta.mean, 0);
const weightedSe = Math.sqrt(byK.reduce((sum, item, k) => sum + probability[k] ** 2 * item.pairedDelta.standardError ** 2, 0));
const center = weightedMean(byK), margin = tCritical95df9 * weightedSe;
const output = { status: 'COMPLETE_PAIRED_M050_XORB_FIVE_E1P3_EXTENSION', manifestSha256: sha(bytes),
  parentManifestSha256: manifest.parentManifestSha256, design: manifest.design, weights, tCritical95df9,
  byK, naturalDensityPairedDelta: { candidate: 'm050-XORB', reference: 'm050', pointsPerAppearance: center,
    standardError: weightedSe, descriptive95CI: [center - margin, center + margin],
    method: 'hypergeometric-weighted K-specific paired cohort means; t(df=9) conservative cluster interval' },
  results,
  interpretation: 'Post-hoc paired extension. The m050 controls are reused from the parent frozen study, so this is not an independent holdout. Descriptive sensitivity against five exact e1p3 entrants, not proof of general superiority, entry-frequency forecast, or immunity.' };
const outputPath = path.join(out, 'analysis.json');
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: output.status, naturalDensityPairedDelta: output.naturalDensityPairedDelta,
  perK: byK.map(({ k, pairedDelta }) => ({ k, mean: pairedDelta.mean, ci: pairedDelta.descriptive95CI })), outputPath }, null, 2));
