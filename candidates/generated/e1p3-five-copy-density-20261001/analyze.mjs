import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { arms, weights, tCritical95df19, assert, equal, sha } from './model.mjs';
import { record } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../..');
const freeze = path.join(here, 'frozen'), out = path.join(repo, 'experiments/e1p3-five-copy-density-20261001');
const bytes = fs.readFileSync(path.join(freeze, 'manifest.json'));
equal(sha(bytes), fs.readFileSync(path.join(freeze, 'manifest.json.sha256'), 'utf8').trim(), 'manifest checksum');
const manifest = JSON.parse(bytes), observations = Object.fromEntries(arms.map(a => [a, [0, 1, 2, 3].map(() => new Map())]));
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
  const byCohort = observations[item.arm][item.k], old = byCohort.get(item.cohortId) ?? [];
  old.push({ orientation: item.orientation, points: result.runs[0].candidate.teamPerBattle, seed: result.runs[0].seed });
  byCohort.set(item.cohortId, old);
  results.push({ id: item.id, result: record(resultPath), config: record(configPath), planSha256: result.researchExecution.planSha256 });
}
const mean = xs => xs.reduce((s, x) => s + x, 0) / xs.length;
function variance(xs) { const m = mean(xs); return xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1); }
function summarize(xs) { const m = mean(xs), se = Math.sqrt(variance(xs) / xs.length); return { mean: m, cohorts: xs.length, standardError: se,
  descriptive95CI: [m - tCritical95df19 * se, m + tCritical95df19 * se] }; }
const stratum = Object.fromEntries(arms.map(a => [a, [0, 1, 2, 3].map(k => {
  const entries = [...observations[a][k].entries()].sort(([x], [y]) => x.localeCompare(y));
  assert(entries.length === 10, `${a} K=${k}: expected 10 cohort clusters`);
  return entries.map(([id, rows]) => {
    assert(rows.length === 2 && rows.map(x => x.orientation).sort().join(',') === '0,1', `${a}/${id}: paired orientations missing`);
    assert(new Set(rows.map(x => x.seed)).size === 1, `${a}/${id}: orientations must share frozen seed`);
    return { cohortId: id, points: mean(rows.map(x => x.points)) };
  });
})]));
const byStratum = Object.fromEntries(arms.map(a => [a, stratum[a].map(rows => summarize(rows.map(x => x.points)))]));
function weighted(arm, coefficients) {
  const avg = byStratum[arm].reduce((s, x, k) => s + coefficients[k] * x.mean, 0);
  const varianceOfMean = byStratum[arm].reduce((s, x, k) => s + coefficients[k] ** 2 * x.standardError ** 2, 0);
  const se = Math.sqrt(varianceOfMean);
  return { mean: avg, standardError: se, descriptive95CI: [avg - tCritical95df19 * se, avg + tCritical95df19 * se] };
}
function pairedDensityDelta(candidate, reference) {
  const strata = [0, 1, 2, 3].map(k => {
    const base = new Map(stratum[reference][k].map(x => [x.cohortId, x.points]));
    return stratum[candidate][k].map(x => x.points - base.get(x.cohortId));
  });
  const coefficients = weights.map(w => w.probability - (w.k === 0 ? 1 : 0));
  const avg = strata.reduce((s, xs, k) => s + coefficients[k] * mean(xs), 0);
  const se2 = strata.reduce((s, xs, k) => s + coefficients[k] ** 2 * variance(xs) / xs.length, 0);
  const se = Math.sqrt(se2);
  return { candidate, reference, naturalDensityDelta: avg, standardError: se,
    descriptive95CI: [avg - tCritical95df19 * se, avg + tCritical95df19 * se],
    meaning: 'change in candidate-reference advantage when adding five exact e1p3 entrants, paired against K=0 using hypergeometric weights' };
}
const natural = weights.map(w => w.probability), comparisons = [
  pairedDensityDelta('e1p3', 'm049'), pairedDensityDelta('e1p3', 'm050'),
  pairedDensityDelta('e1p3-xorb', 'm050'), pairedDensityDelta('e1p3-xorb', 'e1p3'),
  pairedDensityDelta('m050', 'm049'),
];
const output = { status: 'COMPLETE_EXACT_E1P3_FIVE_COPY_DENSITY_STRESS', manifestSha256: sha(bytes), design: manifest.design,
  weights, stratumScores: byStratum, baselineK0: Object.fromEntries(arms.map(a => [a, byStratum[a][0]])),
  naturalFiveCopyDensityScore: Object.fromEntries(arms.map(a => [a, weighted(a, natural)])), comparisons,
  interpretation: 'Descriptive stress only. Five exact e1p3 opponents are a hypothetical density scenario. Cohort-cluster intervals are nominal and do not establish broad-field superiority, tournament rank, or immunity.', results };
const file = path.join(out, 'analysis.json'); fs.writeFileSync(file, `${JSON.stringify(output, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: output.status, baselineK0: Object.fromEntries(arms.map(a => [a, byStratum[a][0].mean])),
  naturalFiveCopyDensityScore: Object.fromEntries(arms.map(a => [a, weighted(a, natural).mean])), comparisons, file }, null, 2));
