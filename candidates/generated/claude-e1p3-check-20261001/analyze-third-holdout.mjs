import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { record, sha, equal } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const frozen = path.join(here, 'third-holdout/frozen');
const root = path.join(repo, 'experiments/claude-e1p3-third-holdout-20261001');
const manifestBytes = fs.readFileSync(path.join(frozen, 'manifest.json'));
equal(sha(manifestBytes), fs.readFileSync(path.join(frozen, 'manifest.json.sha256'), 'utf8').trim(), 'manifest checksum');
const manifest = JSON.parse(manifestBytes), design = manifest.design;
const scores = Object.fromEntries(design.arms.map(arm => [arm, []])), results = [];
for (const item of manifest.files) equal(record(item.path), item, `frozen input ${item.path}`);
for (let p = 1; p <= 8; p++) {
  const panel = `panel-${String(p).padStart(2, '0')}`;
  for (const arm of design.arms) {
    const cfg = path.join(frozen, 'configs', `${panel}-${arm}.json`);
    const cfgBytes = fs.readFileSync(cfg), config = JSON.parse(cfgBytes);
    const resultPath = path.join(root, 'accelerated', `${panel}-${arm}`, 'result.json');
    const resultBytes = fs.readFileSync(resultPath), result = JSON.parse(resultBytes);
    equal(result.configSha256, sha(cfgBytes), `${panel}/${arm} config hash`);
    equal(result.config, config, `${panel}/${arm} exact config`);
    if (result.aggregate.battles !== 1250 || result.runs.length !== 50
      || result.runs.reduce((sum, run) => sum + run.battles, 0) !== 1250) throw new Error(`incomplete panel ${panel}/${arm}`);
    if (result.researchExecution.mode !== 'isolated-persistent-serial' || result.researchExecution.overlays.length !== 0
      || result.researchExecution.baseEngine.sha256 !== manifest.engine.sha256) throw new Error(`wrong engine/overlay ${panel}/${arm}`);
    scores[arm].push(result.aggregate.teamPerBattle);
    results.push({ panel, arm, config: record(cfg), result: record(resultPath), planSha256: result.researchExecution.planSha256 });
  }
}
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
function contrast(candidate, reference) {
  const deltas = scores[candidate].map((x, i) => x - scores[reference][i]), center = mean(deltas);
  const sd = Math.sqrt(deltas.reduce((s, x) => s + (x - center) ** 2, 0) / (deltas.length - 1));
  const margin = design.confidence.criticalValue * sd / Math.sqrt(deltas.length);
  return { candidate, reference, pairedPanelMeanDelta: center, conservativeFamilywiseCI: [center - margin, center + margin],
    criticalValue: design.confidence.criticalValue,
    classification: center - margin > 0 ? 'higher-under-holdout-protocol' : center + margin < 0 ? 'lower-under-holdout-protocol' : 'inconclusive',
    pairedPanelDeltas: deltas };
}
const output = { status: 'COMPLETE_FRESH_HOLDOUT', manifestSha256: sha(manifestBytes), design,
  meansPerCandidateAppearance: Object.fromEntries(Object.entries(scores).map(([arm, xs]) => [arm, mean(xs)])),
  comparisons: [contrast('e1p3', 'm049'), contrast('e1p3', 'm050')],
  panelScores: scores,
  limitation: design.limitation,
  interpretation: 'Eight paired panel means are the independent units; seeds/cohorts are nested. No universal or unseen-opponent inference.',
  results };
const out = path.join(root, 'analysis.json');
fs.writeFileSync(out, `${JSON.stringify(output, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: output.status, meansPerCandidateAppearance: output.meansPerCandidateAppearance,
  comparisons: output.comparisons.map(({ candidate, reference, pairedPanelMeanDelta, conservativeFamilywiseCI, classification }) =>
    ({ candidate, reference, pairedPanelMeanDelta, conservativeFamilywiseCI, classification })), output: out }, null, 2));
