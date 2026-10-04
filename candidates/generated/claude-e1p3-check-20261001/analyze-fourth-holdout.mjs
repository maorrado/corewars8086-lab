import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { equal, record, sha } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const frozen = path.join(here, 'fourth-holdout/frozen');
const root = path.join(repo, 'experiments/claude-e1p3-fourth-holdout-20261001');
const manifestBytes = fs.readFileSync(path.join(frozen, 'manifest.json'));
equal(sha(manifestBytes), fs.readFileSync(path.join(frozen, 'manifest.json.sha256'), 'utf8').trim(), 'manifest checksum');
const manifest = JSON.parse(manifestBytes);
const completion = JSON.parse(fs.readFileSync(path.join(root, 'runner-complete.json'), 'utf8'));
if (completion.status !== 'ALL_FOURTH_HOLDOUT_JOBS_COMPLETE' || completion.configs !== 72 || completion.battles !== 90000)
  throw new Error('fourth holdout must complete all 72 configs / 90,000 battles');
const hashFile = file => {
  const bytes = fs.readFileSync(file);
  return { path: path.resolve(file), bytes: bytes.length, sha256: sha(bytes) };
};
for (const item of manifest.files) equal(hashFile(item.path), item, `frozen input ${item.path}`);

const arms = manifest.design.arms;
const panelScores = Object.fromEntries(arms.map(arm => [arm, []]));
const results = [];
for (let p = 1; p <= manifest.design.panels; p++) {
  const panel = `panel-${String(p).padStart(2, '0')}`;
  let referenceConfig;
  for (const arm of arms) {
    const id = `${panel}-${arm}`;
    const configPath = path.join(frozen, 'configs', `${id}.json`);
    const configBytes = fs.readFileSync(configPath), config = JSON.parse(configBytes);
    const resultPath = path.join(root, 'accelerated', id, 'result.json');
    const resultBytes = fs.readFileSync(resultPath), result = JSON.parse(resultBytes);
    equal(result.configSha256, sha(configBytes), `${id} config hash`);
    equal(result.config, config, `${id} exact config`);
    if (result.aggregate.battles !== 1250 || result.runs.length !== 50
      || result.runs.reduce((sum, run) => sum + run.battles, 0) !== 1250)
      throw new Error(`incomplete 1,250-battle panel arm: ${id}`);
    if (result.researchExecution.mode !== 'isolated-persistent-serial' || result.researchExecution.overlays.length !== 0
      || result.researchExecution.baseEngine.sha256 !== manifest.engine.sha256)
      throw new Error(`unexpected engine or overlay for ${id}`);
    const seeds = [...new Set(result.runs.map(run => run.seed))].sort();
    if (JSON.stringify(seeds) !== JSON.stringify([...config.seeds].sort())) throw new Error(`seed coverage mismatch: ${id}`);
    const cohortCounts = new Map();
    for (const run of result.runs) {
      if (run.battles !== 25) throw new Error(`wrong block size ${id}/${run.cohortId}`);
      cohortCounts.set(run.cohortId, (cohortCounts.get(run.cohortId) ?? 0) + 1);
    }
    if (cohortCounts.size !== 25 || [...cohortCounts.values()].some(count => count !== 2))
      throw new Error(`cohort coverage mismatch: ${id}`);
    if (!referenceConfig) referenceConfig = config;
    else {
      if (JSON.stringify(config.seeds) !== JSON.stringify(referenceConfig.seeds)
        || JSON.stringify(config.cohorts) !== JSON.stringify(referenceConfig.cohorts)
        || JSON.stringify(config.zombies) !== JSON.stringify(referenceConfig.zombies))
        throw new Error(`panel arms are not paired exactly: ${id}`);
    }
    panelScores[arm].push(result.aggregate.teamPerBattle);
    results.push({ id, config: hashFile(configPath), result: hashFile(resultPath), planSha256: result.researchExecution.planSha256 });
  }
}
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const familywiseCritical = manifest.design.confidence.criticalValue;
function contrast(candidate, reference) {
  const deltas = panelScores[candidate].map((value, index) => value - panelScores[reference][index]);
  const center = mean(deltas);
  const sd = Math.sqrt(deltas.reduce((sum, value) => sum + (value - center) ** 2, 0) / (deltas.length - 1));
  const se = sd / Math.sqrt(deltas.length), margin = familywiseCritical * se;
  const interval = [center - margin, center + margin];
  return { candidate, reference, pairedPanelMeanDelta: center, panels: deltas.length, panelStandardDeviation: sd,
    standardError: se, conservativeFamilywise95CI: interval,
    classification: interval[0] > 0 ? 'higher-on-this-fixed-field' : interval[1] < 0 ? 'lower-on-this-fixed-field' : 'inconclusive',
    panelDeltas: deltas };
}
const comparisons = [contrast('e1p3', 'm049'), contrast('e1p3', 'm050')];
const output = { status: 'COMPLETE_FRESH_FOURTH_HOLDOUT', manifestSha256: sha(manifestBytes), design: manifest.design,
  meansPerCandidateAppearance: Object.fromEntries(arms.map(arm => [arm, mean(panelScores[arm])])),
  comparisons, panelScores,
  interpretation: 'A new-seed paired confirmation on the fixed published 2025 online-stage roster, not a universal opponent or official-final claim. Familywise intervals are deliberately conservative; this fourth study follows earlier looks and should be considered sequential confirmation, not a pristine preregistered trial.',
  results };
const out = path.join(root, 'analysis.json');
fs.writeFileSync(out, `${JSON.stringify(output, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: output.status, meansPerCandidateAppearance: output.meansPerCandidateAppearance,
  comparisons: comparisons.map(({ candidate, reference, pairedPanelMeanDelta, conservativeFamilywise95CI, classification }) =>
    ({ candidate, reference, pairedPanelMeanDelta, conservativeFamilywise95CI, classification })), output: out }, null, 2));
