// Post-freeze corrected analyzer. Uses t(df=9), since the frozen design has
// ten cohort clusters per K stratum. Does not modify any frozen input/results.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { arms, weights, assert, equal, sha } from './model.mjs';
import { record } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const tCritical95df9 = 2.2621571628540993;
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../..');
const freeze = path.join(here, 'frozen'), out = path.join(repo, 'experiments/e1p3-five-copy-density-20261001');
const bytes = fs.readFileSync(path.join(freeze, 'manifest.json'));
equal(sha(bytes), fs.readFileSync(path.join(freeze, 'manifest.json.sha256'), 'utf8').trim(), 'manifest checksum');
const manifest = JSON.parse(bytes), completion = JSON.parse(fs.readFileSync(path.join(out, 'runner-complete.json'), 'utf8'));
assert(completion.status === 'ALL_DENSITY_JOBS_COMPLETE' && completion.configs === manifest.design.configs
  && completion.battles === manifest.design.totalBattles, 'run must be complete before analysis');
for (const file of manifest.files) equal(record(file.path), file, `frozen input ${file.path}`);
const observations = Object.fromEntries(arms.map(a => [a, [0, 1, 2, 3].map(() => new Map())]));
const results = [];
for (const item of manifest.configs) {
  const configPath = path.join(freeze, 'configs', `${item.id}.json`), configBytes = fs.readFileSync(configPath), config = JSON.parse(configBytes);
  const resultPath = path.join(out, 'accelerated', item.id, 'result.json'), resultBytes = fs.readFileSync(resultPath), result = JSON.parse(resultBytes);
  equal(result.configSha256, sha(configBytes), `${item.id} config hash`); equal(result.config, config, `${item.id} exact config`);
  assert(result.aggregate.battles === 10 && result.runs.length === 1 && result.runs[0].battles === 10, `${item.id} complete 10-battle block`);
  equal(result.runs[0].cohortId, item.cohortId, `${item.id} cohort identity`);
  equal(result.runs[0].seed, config.seeds[0], `${item.id} seed identity`);
  assert(result.researchExecution.mode === 'isolated-persistent-serial' && result.researchExecution.overlays.length === 0
    && result.researchExecution.baseEngine.sha256 === manifest.engine.sha256, `${item.id} original engine / no overlays`);
  const map = observations[item.arm][item.k], old = map.get(item.cohortId) ?? [];
  old.push({ orientation: item.orientation, points: result.runs[0].candidate.teamPerBattle, seed: result.runs[0].seed });
  map.set(item.cohortId, old);
  results.push({ id: item.id, result: record(resultPath), config: record(configPath), planSha256: result.researchExecution.planSha256 });
}
const mean = xs => xs.reduce((s, x) => s + x, 0) / xs.length;
const variance = xs => { const m = mean(xs); return xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1); };
function summarize(xs) {
  assert(xs.length === 10, 'ten independent cohort clusters per K are required');
  const m = mean(xs), se = Math.sqrt(variance(xs) / xs.length);
  return { mean: m, clusters: xs.length, standardError: se,
    descriptive95CI: [m - tCritical95df9 * se, m + tCritical95df9 * se] };
}
const clusterRows = Object.fromEntries(arms.map(arm => [arm, [0, 1, 2, 3].map(k => {
  const entries = [...observations[arm][k].entries()].sort(([x], [y]) => x < y ? -1 : x > y ? 1 : 0);
  assert(entries.length === 10, `${arm} K=${k}: expected ten cohort clusters`);
  return entries.map(([id, rows]) => {
    assert(rows.length === 2 && rows.map(x => x.orientation).sort().join(',') === '0,1', `${arm}/${id}: paired orientations missing`);
    assert(new Set(rows.map(x => x.seed)).size === 1, `${arm}/${id}: orientations must share frozen seed`);
    return { cohortId: id, points: mean(rows.map(x => x.points)) };
  });
})]));
const strata = Object.fromEntries(arms.map(a => [a, clusterRows[a].map(rows => summarize(rows.map(x => x.points)))]));
function weighted(arm, coefficients) {
  const value = strata[arm].reduce((s, x, k) => s + coefficients[k] * x.mean, 0);
  const se2 = strata[arm].reduce((s, x, k) => s + coefficients[k] ** 2 * x.standardError ** 2, 0), se = Math.sqrt(se2);
  return { mean: value, standardError: se, descriptive95CI: [value - tCritical95df9 * se, value + tCritical95df9 * se] };
}
function compareDensity(candidate, reference) {
  const deltas = [0, 1, 2, 3].map(k => {
    const ref = new Map(clusterRows[reference][k].map(x => [x.cohortId, x.points]));
    return clusterRows[candidate][k].map(x => x.points - ref.get(x.cohortId));
  });
  const coeff = weights.map(x => x.probability - (x.k === 0 ? 1 : 0));
  const value = deltas.reduce((s, xs, k) => s + coeff[k] * mean(xs), 0);
  const se = Math.sqrt(deltas.reduce((s, xs, k) => s + coeff[k] ** 2 * variance(xs) / xs.length, 0));
  return { candidate, reference, naturalDensityChangeInAdvantage: value, standardError: se,
    descriptive95CI: [value - tCritical95df9 * se, value + tCritical95df9 * se] };
}
const natural = weights.map(x => x.probability);
const comparisons = [compareDensity('e1p3', 'm049'), compareDensity('e1p3', 'm050'),
  compareDensity('e1p3-xorb', 'm050'), compareDensity('e1p3-xorb', 'e1p3'), compareDensity('m050', 'm049')];
const output = { status: 'COMPLETE_CORRECTED_EXACT_E1P3_FIVE_COPY_DENSITY_STRESS',
  manifestSha256: sha(bytes), correctedAnalyzer: record(path.join(here, 'analyze-corrected.mjs')),
  analysisCorrection: 'Post-freeze corrected t critical: df=9 for 10 cohort clusters per K; frozen draft analyzer analyze.mjs has an inappropriate df=19 value. No run inputs or raw outcomes were modified.',
  design: manifest.design, weights, tCritical95df9,
  stratumScores: strata, naturalFiveCopyDensityScore: Object.fromEntries(arms.map(a => [a, weighted(a, natural)])),
  comparisons, results,
  interpretation: 'Nominal descriptive cohort-cluster intervals only. Hypothetical five-identical-e1p3 density on a fixed 2025 public pool; not a 2026 forecast, broad-field confirmation, tournament-rank estimate, or immunity proof.' };
const outputFile = path.join(out, 'analysis-corrected.json');
fs.writeFileSync(outputFile, `${JSON.stringify(output, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: output.status, naturalFiveCopyDensityScore: Object.fromEntries(arms.map(a => [a, weighted(a, natural).mean])),
  comparisons, outputFile }, null, 2));
