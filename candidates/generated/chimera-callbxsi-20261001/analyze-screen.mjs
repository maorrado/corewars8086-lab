import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const experiment = path.join(repo, 'experiments/chimera-callbxsi-screen-20261001');
const manifestPath = path.join(here, 'screen-manifest.json');
const executionPath = path.join(experiment, 'execution-index.json');
const outputPath = path.join(experiment, 'analysis.json');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const sd = values => Math.sqrt(values.reduce((sum, value) => sum + (value - mean(values)) ** 2, 0) / (values.length - 1));
const tCriticalDf7 = 2.3646242510102993;
const manifestBytes = fs.readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes);
const execution = readJson(executionPath);
if (execution.status !== 'COMPLETE' || execution.completed.length !== 16) throw new Error('screen execution index incomplete');
if (execution.manifestSha256 !== sha(manifestBytes)) throw new Error('execution index refers to a different freeze');
if (fs.existsSync(outputPath)) throw new Error(`refusing to overwrite ${outputPath}`);

const candidates = new Map();
for (const record of execution.completed) {
  const result = readJson(path.join(record.output, 'result.json'));
  if (sha(fs.readFileSync(path.join(record.output, 'result.json'))) !== record.resultSha256) throw new Error(`result hash mismatch: ${record.output}`);
  if (result.aggregate.battles !== 1250 || result.aggregate.teamPerBattle !== record.teamPerBattle) throw new Error(`result aggregate mismatch: ${record.output}`);
  const config = result.config;
  if (config.threads !== 1 || config.parallel !== false || config.telemetry !== false) throw new Error(`nonstandard execution config: ${record.output}`);
  const key = `${record.arm}:${record.panel}`;
  if (candidates.has(key)) throw new Error(`duplicate candidate panel: ${key}`);
  candidates.set(key, { score: result.aggregate.teamPerBattle, resultPath: path.join(record.output, 'result.json'),
    resultSha256: record.resultSha256, seeds: config.seeds, cohorts: config.cohorts });
}

const baselines = { m049: [], m050: [], e1p3: [] };
const candidateScores = Object.fromEntries(manifest.limits.armsRun.map(arm => [arm, []]));
for (let panel = 1; panel <= 8; panel++) {
  const id = String(panel).padStart(2, '0');
  const refPaths = {
    m049: path.join(repo, `experiments/claude-e1-confirmation-20261001/accelerated/panel-${id}-m049/result.json`),
    m050: path.join(repo, `experiments/claude-e1-confirmation-20261001/accelerated/panel-${id}-m050/result.json`),
    e1p3: path.join(repo, `experiments/claude-e1p3-screen-20261001/accelerated/panel-${id}-e1p3/result.json`),
  };
  const panelCandidates = {};
  for (const arm of manifest.limits.armsRun) {
    const value = candidates.get(`${arm}:${id}`);
    if (!value) throw new Error(`missing ${arm} panel ${id}`);
    panelCandidates[arm] = value;
    candidateScores[arm].push(value.score);
  }
  for (const [name, file] of Object.entries(refPaths)) {
    const result = readJson(file);
    if (result.aggregate.battles !== 1250) throw new Error(`reference panel battle-count mismatch: ${file}`);
    const firstCandidate = panelCandidates[manifest.limits.armsRun[0]];
    if (JSON.stringify(result.config.seeds) !== JSON.stringify(firstCandidate.seeds)
        || JSON.stringify(result.config.cohorts) !== JSON.stringify(firstCandidate.cohorts))
      throw new Error(`reference does not match paired inputs: ${file}`);
    baselines[name].push(result.aggregate.teamPerBattle);
  }
}

const contrasts = [];
for (const arm of manifest.limits.armsRun) for (const baseline of Object.keys(baselines)) {
  const differences = candidateScores[arm].map((score, index) => score - baselines[baseline][index]);
  const delta = mean(differences), margin = tCriticalDf7 * sd(differences) / Math.sqrt(differences.length);
  contrasts.push({ candidate: arm, reference: baseline, delta, nominalPaired95CI: [delta - margin, delta + margin],
    byPanel: differences.map((value, index) => ({ panel: String(index + 1).padStart(2, '0'), delta: value })),
    interpretation: 'Exploratory reused-seed screen only; nominal interval is descriptive and is not fresh holdout evidence.' });
}

const results = execution.completed.map(record => ({ arm: record.arm, panel: record.panel, battles: record.battles,
  teamPerBattle: record.teamPerBattle, resultPath: record.resultPath, resultSha256: record.resultSha256,
  planSha256: record.planSha256, engineJarSha256: record.engineJarSha256 }));
const analysis = {
  status: 'COMPLETE_EXPLORATORY_REUSED_SEED_SCREEN',
  metric: 'team points per candidate appearance',
  protocols: { frozenSuiteManifestSha256: manifest.frozenSuiteManifestSha256, candidateManifestSha256: sha(manifestBytes),
    executionIndexSha256: sha(fs.readFileSync(executionPath)), panels: 8, warsPerArm: 10000,
    teams: 'same 75 published 2025 online-stage entrant pairs + four online Zombies as the prior screen; not a verified historical final roster',
    engine: 'original deterministic v6 JAR, no overlays; isolated persistent serial execution; 1 thread; parallel=false' },
  pooledMeans: Object.fromEntries([...Object.entries(candidateScores).map(([key, value]) => [key, mean(value)]),
    ...Object.entries(baselines).map(([key, value]) => [key, mean(value)])]),
  contrasts,
  panelMeans: Array.from({ length: 8 }, (_, index) => ({ panel: String(index + 1).padStart(2, '0'),
    ...Object.fromEntries([...Object.entries(candidateScores).map(([key, value]) => [key, value[index]]),
      ...Object.entries(baselines).map(([key, value]) => [key, value[index]])]) })),
  results,
  limitations: ['Seeds and cohort composition were reused from a prior e1p3 screen; all results are exploratory.',
    'This result is not evidence of improvement on unseen opponents and is not a basis for promotion.',
    'The tested opponent pool is the 2025 online-stage pool, not the historical final roster.'],
};
fs.writeFileSync(outputPath, `${JSON.stringify(analysis, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: analysis.status, pooledMeans: analysis.pooledMeans,
  contrasts: contrasts.map(({ candidate, reference, delta, nominalPaired95CI }) => ({ candidate, reference, delta, nominalPaired95CI })), outputPath }, null, 2));
