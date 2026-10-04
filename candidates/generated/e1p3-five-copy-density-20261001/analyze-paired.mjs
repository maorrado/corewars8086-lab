// Adds paired candidate-vs-reference intervals for the weighted five-copy
// density estimate. Uses only frozen raw results; no inputs are rewritten.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { arms, weights, assert, equal, sha } from './model.mjs';
import { record } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const t9 = 2.2621571628540993;
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../..');
const freeze = path.join(here, 'frozen'), out = path.join(repo, 'experiments/e1p3-five-copy-density-20261001');
const manifestBytes = fs.readFileSync(path.join(freeze, 'manifest.json'));
equal(sha(manifestBytes), fs.readFileSync(path.join(freeze, 'manifest.json.sha256'), 'utf8').trim(), 'manifest hash');
const manifest = JSON.parse(manifestBytes), raw = Object.fromEntries(arms.map(a => [a, [0, 1, 2, 3].map(() => new Map())]));
for (const item of manifest.configs) {
  const cfgPath = path.join(freeze, 'configs', `${item.id}.json`), cfgBytes = fs.readFileSync(cfgPath);
  const resultPath = path.join(out, 'accelerated', item.id, 'result.json'), result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  equal(result.configSha256, sha(cfgBytes), `${item.id} config hash`);
  assert(result.aggregate.battles === 10 && result.runs.length === 1, `${item.id} complete run`);
  const list = raw[item.arm][item.k].get(item.cohortId) ?? [];
  list.push({ orientation: item.orientation, points: result.runs[0].candidate.teamPerBattle });
  raw[item.arm][item.k].set(item.cohortId, list);
}
const mean = xs => xs.reduce((s, x) => s + x, 0) / xs.length;
const variance = xs => { const m = mean(xs); return xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1); };
const perK = Object.fromEntries(arms.map(a => [a, [0, 1, 2, 3].map(k => {
  const out = new Map();
  for (const [id, rows] of raw[a][k]) {
    assert(rows.length === 2 && rows.map(x => x.orientation).sort().join(',') === '0,1', `${a}/${id} orientations`);
    out.set(id, mean(rows.map(x => x.points)));
  }
  return out;
})]));
function compare(candidate, reference) {
  const deltas = [0, 1, 2, 3].map(k => {
    const ref = perK[reference][k], cur = perK[candidate][k];
    assert(cur.size === 10 && ref.size === 10, 'ten paired cohorts per stratum');
    return [...cur.keys()].map(id => cur.get(id) - ref.get(id));
  });
  const byK = deltas.map((xs, k) => {
    const m = mean(xs), se = Math.sqrt(variance(xs) / xs.length);
    return { k, pairedMeanDelta: m, descriptive95CI: [m - t9 * se, m + t9 * se], cohorts: xs.length };
  });
  const value = deltas.reduce((s, xs, k) => s + weights[k].probability * mean(xs), 0);
  const se = Math.sqrt(deltas.reduce((s, xs, k) => s + weights[k].probability ** 2 * variance(xs) / xs.length, 0));
  return { candidate, reference, byK, naturalFiveCopyDensity: { pairedMeanDelta: value,
    descriptive95CI: [value - t9 * se, value + t9 * se], standardError: se, clustersPerK: 10 } };
}
const comparisons = [compare('e1p3', 'm049'), compare('e1p3', 'm050'),
  compare('e1p3-xorb', 'm050'), compare('e1p3-xorb', 'e1p3'), compare('m050', 'm049')];
const output = { status: 'COMPLETE_PAIRED_DENSITY_CONTRASTS', manifestSha256: sha(manifestBytes),
  analyzer: record(path.join(here, 'analyze-paired.mjs')), tCritical95df9: t9, comparisons,
  caveat: 'Nominal descriptive intervals; this is a fixed-pool hypothetical density study, not broad-field confirmation or tournament prediction.' };
const outputFile = path.join(out, 'paired-comparisons.json');
fs.writeFileSync(outputFile, `${JSON.stringify(output, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: output.status, comparisons, outputFile }, null, 2));
