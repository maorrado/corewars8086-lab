// Secondary synthesis across three independently frozen e1p3 matched holdouts.
// The latest holdout's predeclared analysis remains the primary inference.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { record, sha, equal } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const suites = [
  { id: 'e1p3-original', folder: 'claude-e1p3-holdout-20261001', manifest: path.join(here, 'holdout/frozen/manifest.json') },
  { id: 'e1p3-with-nop4', folder: 'claude-e1p3-nop4-holdout-20261001', manifest: path.join(here, 'nop4-holdout/frozen/manifest.json') },
  { id: 'e1p3-third', folder: 'claude-e1p3-third-holdout-20261001', manifest: path.join(here, 'third-holdout/frozen/manifest.json') },
];
const observations = { 'e1p3-m049': [], 'e1p3-m050': [] }, bySuite = [];
for (const suite of suites) {
  const analysisPath = path.join(repo, 'experiments', suite.folder, 'analysis.json');
  const analysisBytes = fs.readFileSync(analysisPath), analysis = JSON.parse(analysisBytes);
  equal(analysis.manifestSha256, sha(fs.readFileSync(suite.manifest)), `${suite.id} frozen manifest`);
  const panels = analysis.panelScores;
  for (const arm of ['m049', 'm050', 'e1p3']) equal(panels[arm].length, 8, `${suite.id} panel count for ${arm}`);
  const deltas = {
    'e1p3-m049': panels.e1p3.map((value, i) => value - panels.m049[i]),
    'e1p3-m050': panels.e1p3.map((value, i) => value - panels.m050[i]),
  };
  for (const [comparison, values] of Object.entries(deltas)) observations[comparison].push(...values);
  bySuite.push({ id: suite.id, analysisPath, analysisSha256: sha(analysisBytes), pointsPerAppearance:
    Object.fromEntries(['m049', 'm050', 'e1p3'].map(arm => [arm, panels[arm].reduce((a, b) => a + b, 0) / 8])), deltas });
}
function summarize(values, comparison) {
  const n = values.length, mean = values.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1));
  const critical = 3.5, margin = critical * sd / Math.sqrt(n);
  return { comparison, panels: n, pairedMeanDelta: mean, conservativeDescriptiveCI: [mean - margin, mean + margin],
    criticalValue: critical,
    caveat: 'Secondary pooled summary across three independent holdouts; third holdout was initiated after reviewing the first two. This does not erase sequential-look selection and is not a universal or unseen-opponent claim.' };
}
const output = { status: 'COMPLETE_SECONDARY_POOLED_SUMMARY', suites: bySuite,
  pooled: Object.entries(observations).map(([comparison, values]) => summarize(values, comparison)),
  limitation: 'All three suites use new, nonoverlapping seeds and new cohort shuffles but the same 75 published 2025 online-stage teams and four Zombies. The NOP4 holdout also contains NOP4 as an extra arm; exact e1p3/m049/m050 inputs and matched panel schedule are used here.' };
const outputRoot = path.join(repo, 'experiments/claude-e1p3-pooled-confirmations-20261001');
fs.mkdirSync(outputRoot, { recursive: true });
const outputPath = path.join(outputRoot, 'analysis.json');
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: output.status, pooled: output.pooled.map(({ comparison, panels, pairedMeanDelta, conservativeDescriptiveCI }) =>
  ({ comparison, panels, pairedMeanDelta, conservativeDescriptiveCI })), outputPath }, null, 2));
