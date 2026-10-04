import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { record, sha, equal } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../..');
const freeze = path.join(here, 'frozen'), root = path.join(repo, 'experiments/e1p3-xorb-screen-20261001');
const manifestBytes = fs.readFileSync(path.join(freeze, 'manifest.json'));
equal(sha(manifestBytes), fs.readFileSync(path.join(freeze, 'manifest.json.sha256'), 'utf8').trim(), 'manifest checksum');
const manifest = JSON.parse(manifestBytes), { arms, scenarios } = manifest.design;
for (const f of manifest.files) equal(record(f.path), f, `frozen file ${f.path}`);
const cohortScores = Object.fromEntries(scenarios.map(s => [s, Object.fromEntries(arms.map(a => [a, new Map()]))]));
const results = [];
for (const scenario of scenarios) for (const arm of arms) {
  const id = `${scenario}-${arm}`, cfgPath = path.join(freeze, 'configs', `${id}.json`), cfgBytes = fs.readFileSync(cfgPath), config = JSON.parse(cfgBytes);
  const resultPath = path.join(root, 'accelerated', id, 'result.json'), resultBytes = fs.readFileSync(resultPath), result = JSON.parse(resultBytes);
  equal(result.configSha256, sha(cfgBytes), `${id} config hash`); equal(result.config, config, `${id} config identity`);
  if (result.aggregate.battles !== 500 || result.runs.length !== 50 || result.runs.reduce((s, r) => s + r.battles, 0) !== 500)
    throw new Error(`incomplete 500-battle arm: ${id}`);
  if (result.researchExecution.mode !== 'isolated-persistent-serial' || result.researchExecution.overlays.length !== 0
    || result.researchExecution.baseEngine.sha256 !== manifest.engine.sha256) throw new Error(`wrong engine/mode: ${id}`);
  const seedCounts = new Map();
  for (const run of result.runs) {
    const current = cohortScores[scenario][arm].get(run.cohortId) ?? [];
    current.push(run.candidate.teamPerBattle); cohortScores[scenario][arm].set(run.cohortId, current);
    seedCounts.set(run.seed, (seedCounts.get(run.seed) ?? 0) + 1);
  }
  if (seedCounts.size !== 2 || [...seedCounts.values()].some(n => n !== 25)) throw new Error(`seed/cohort coverage mismatch: ${id}`);
  results.push({ id, result: record(resultPath), config: record(cfgPath), planSha256: result.researchExecution.planSha256 });
}
const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
const clusterMeans = Object.fromEntries(scenarios.map(s => [s, Object.fromEntries(arms.map(a => [a,
  new Map([...cohortScores[s][a]].map(([cohort, values]) => {
    if (values.length !== 2) throw new Error(`need two paired seeds in ${s}/${a}/${cohort}`);
    return [cohort, mean(values)];
  }))]))]));
function compare(scenario, candidate, reference) {
  const c = clusterMeans[scenario][candidate], r = clusterMeans[scenario][reference];
  const deltas = [...c.keys()].map(id => c.get(id) - r.get(id)), center = mean(deltas);
  const sd = Math.sqrt(deltas.reduce((sum, x) => sum + (x - center) ** 2, 0) / (deltas.length - 1));
  const margin = 2.064 * sd / Math.sqrt(deltas.length);
  return { scenario, candidate, reference, pairedCohortMeanDelta: center, nominal95CI: [center - margin, center + margin],
    cohortCount: deltas.length, positiveNegativeTie: { positive: deltas.filter(x => x > 0).length,
      negative: deltas.filter(x => x < 0).length, tie: deltas.filter(x => x === 0).length } };
}
const comparisons = [];
for (const s of scenarios) {
  comparisons.push(compare(s, 'e1p3-xorb', 'e1p3'), compare(s, 'e1p3-xorb', 'm050'), compare(s, 'm050-xorb', 'm050'));
}
const output = { status: 'COMPLETE_EXPLORATORY_SCREEN', manifestSha256: sha(manifestBytes), design: manifest.design,
  meanPointsPerAppearance: Object.fromEntries(scenarios.map(s => [s, Object.fromEntries(arms.map(a =>
    [a, mean([...clusterMeans[s][a].values()])]))])), comparisons,
  interpretation: 'Descriptive cohort-cluster intervals only. This is a 500-battle/arm screening experiment, not a fresh holdout, tournament forecast, or basis for final promotion.',
  results };
const out = path.join(root, 'analysis.json');
fs.writeFileSync(out, `${JSON.stringify(output, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: output.status, meanPointsPerAppearance: output.meanPointsPerAppearance, comparisons, out }, null, 2));
