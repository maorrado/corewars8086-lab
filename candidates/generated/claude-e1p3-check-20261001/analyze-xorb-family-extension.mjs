import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { equal } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const extension = path.join(repo, 'experiments/m050-xorb-family-stress-20261001');
const stress = path.join(repo, 'candidates/generated/claude-family-stress-20261001/frozen');
const manifest = JSON.parse(fs.readFileSync(path.join(extension, 'manifest.json'), 'utf8'));
const baseManifest = JSON.parse(fs.readFileSync(path.join(stress, 'manifest.json'), 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const choose = (n, k) => { let result = 1; for (let i = 1; i <= k; i++) result = result * (n - i + 1) / i; return result; };
function relevant(config) { return { candidateName: config.candidate.name, seeds: config.seeds, battles: config.battles,
  cohorts: config.cohorts, zombies: config.zombies, threads: config.threads, parallel: config.parallel }; }
const recordMap = new Map();
const kRows = new Map(Array.from({ length: 4 }, (_, k) => [k, new Map()]));
for (const entry of manifest.configs) {
  const xConfig = JSON.parse(fs.readFileSync(entry.config, 'utf8'));
  const xResultPath = path.join(extension, 'accelerated', path.basename(entry.id, '.json'), 'result.json');
  const baseId = entry.id.replace('-xorb-', '-m050-');
  const baseConfigPath = path.join(stress, 'configs', baseId);
  const m049Id = baseId.replace('-m050-', '-m049-');
  const m049ConfigPath = path.join(stress, 'configs', m049Id);
  const baseResultPath = path.join(repo, 'experiments/claude-family-stress-20261001/accelerated', path.basename(baseId, '.json'), 'result.json');
  const m049ResultPath = path.join(repo, 'experiments/claude-family-stress-20261001/accelerated', path.basename(m049Id, '.json'), 'result.json');
  const baseConfig = JSON.parse(fs.readFileSync(baseConfigPath, 'utf8'));
  const m049Config = JSON.parse(fs.readFileSync(m049ConfigPath, 'utf8'));
  if (hash(entry.config) !== entry.configSha256) throw new Error(`extension config hash mismatch: ${entry.id}`);
  equal(relevant(xConfig), relevant(baseConfig), `paired scenario identity ${entry.id}`);
  const xResult = JSON.parse(fs.readFileSync(xResultPath, 'utf8'));
  const baseResult = JSON.parse(fs.readFileSync(baseResultPath, 'utf8'));
  const m049Result = JSON.parse(fs.readFileSync(m049ResultPath, 'utf8'));
  if (xResult.aggregate?.battles !== 10 || baseResult.aggregate?.battles !== 10 || m049Result.aggregate?.battles !== 10) throw new Error(`incomplete 10-war arm ${entry.id}`);
  if (xResult.configSha256 !== entry.configSha256 || baseResult.configSha256 !== hash(baseConfigPath) || m049Result.configSha256 !== hash(m049ConfigPath))
    throw new Error(`result/config identity mismatch: ${entry.id}`);
  equal(relevant(xConfig), relevant(m049Config), `paired m049 scenario identity ${entry.id}`);
  const k = entry.k, cohort = entry.cohortId, orientation = entry.orientation;
  const rows = kRows.get(k);
  if (!rows.has(cohort)) rows.set(cohort, new Map());
  const orientations = rows.get(cohort);
  if (orientations.has(orientation)) throw new Error(`duplicate orientation ${entry.id}`);
  orientations.set(orientation, { xorb: xResult.aggregate.teamPerBattle, m050: baseResult.aggregate.teamPerBattle,
    m049: m049Result.aggregate.teamPerBattle });
  recordMap.set(entry.id, { config: hash(entry.config), result: hash(xResultPath),
    m050Config: hash(baseConfigPath), m050Result: hash(baseResultPath), m049Config: hash(m049ConfigPath), m049Result: hash(m049ResultPath) });
}

const strata = [];
for (let k = 0; k < 4; k++) {
  const cohorts = [...kRows.get(k).entries()];
  if (cohorts.length !== 20 || cohorts.some(([, orientations]) => orientations.size !== 2)) throw new Error(`incomplete K=${k} paired cohort blocks`);
  const paired = cohorts.map(([cohortId, orientations]) => ({ cohortId,
    xorb: (orientations.get(1).xorb + orientations.get(2).xorb) / 2,
    m050: (orientations.get(1).m050 + orientations.get(2).m050) / 2,
    m049: (orientations.get(1).m049 + orientations.get(2).m049) / 2,
    xorbMinusM050: ((orientations.get(1).xorb - orientations.get(1).m050) + (orientations.get(2).xorb - orientations.get(2).m050)) / 2,
    xorbMinusM049: ((orientations.get(1).xorb - orientations.get(1).m049) + (orientations.get(2).xorb - orientations.get(2).m049)) / 2,
    m050MinusM049: ((orientations.get(1).m050 - orientations.get(1).m049) + (orientations.get(2).m050 - orientations.get(2).m049)) / 2 }));
  const mean = key => paired.reduce((sum, row) => sum + row[key], 0) / paired.length;
  const variances = Object.fromEntries(['xorbMinusM050', 'xorbMinusM049', 'm050MinusM049'].map(key => {
    const avg = mean(key); return [key, paired.reduce((sum, row) => sum + (row[key] - avg) ** 2, 0) / (paired.length - 1)];
  }));
  strata.push({ k, cohortCount: paired.length, xorbScore: mean('xorb'), m050Score: mean('m050'),
    m049Score: mean('m049'), pairedCohortDeltas: paired.map(({ cohortId, xorbMinusM050, xorbMinusM049, m050MinusM049 }) => ({ cohortId, xorbMinusM050, xorbMinusM049, m050MinusM049 })), variances });
}
const denominator = choose(80, 3);
const weights = strata.map(row => ({ k: row.k, probability: choose(5, row.k) * choose(75, 3 - row.k) / denominator }));
const weightOf = k => weights.find(row => row.k === k).probability;
const weighted = key => strata.reduce((sum, row) => sum + weightOf(row.k) * row[key], 0);
function contrast(key) {
  const components = strata.map(row => ({ k: row.k,
    varianceOfComponent: weightOf(row.k) ** 2 * row.variances[key] / row.cohortCount }));
  const varianceTotal = components.reduce((sum, row) => sum + row.varianceOfComponent, 0);
  const df = varianceTotal ** 2 / components.reduce((sum, row) => sum + row.varianceOfComponent ** 2 / 19, 0);
  const delta = strata.reduce((sum, row) => sum + weightOf(row.k) * row.pairedCohortDeltas.reduce((s, item) => s + item[key], 0) / row.cohortCount, 0);
  const se = Math.sqrt(varianceTotal);
  return { delta, standardError: se, welchSatterthwaiteDf: df, conservative95PairedClusterCI: [delta - 2.10 * se, delta + 2.10 * se] };
}
const output = { status: 'COMPLETE_PAIRED_FAMILY_EXTENSION_CORRECTED', supersedes: 'analysis.json (its contrast estimates are valid, but its absolute weighted score fields serialized as null due to a reporting-key mismatch)', recordedAt: new Date().toISOString(),
  interpretation: 'XOR-B extension uses the exact frozen K=0..3 mixed five-counter family population and exact same cohorts/seeds/orientations as the completed m050 arm. It adds one paired candidate arm; does not add independent samples to original m050 data.',
  sourceChecks: { stressManifestSha256: hash(path.join(stress, 'manifest.json')), extensionManifestSha256: hash(path.join(extension, 'manifest.json')),
    xorbAequalsM050: manifest.xorb.A.sha256 === baseManifest.expectedHashes.m050[0], xorbBOneByteDiff: manifest.xorb.m050BChanges,
    scoredConfigPairs: recordMap.size, resultFiles: Object.entries(Object.fromEntries(recordMap)).length },
  weights, strata,
  naturalWeighted: { xorbScore: weighted('xorbScore'), m050Score: weighted('m050Score'), m049Score: weighted('m049Score'),
    xorbMinusM050: contrast('xorbMinusM050'), xorbMinusM049: contrast('xorbMinusM049'), m050MinusM049: contrast('m050MinusM049'), criticalValue: 2.10,
    criticalNote: '2.10 is a conservative two-sided 95% t critical for df >= 19; four equally sized K strata each have 20 paired cohort means.' },
  scenarioK0: { xorbScore: strata[0].xorbScore, m050Score: strata[0].m050Score, m049Score: strata[0].m049Score,
    xorbMinusM050: strata[0].pairedCohortDeltas.reduce((sum, item) => sum + item.xorbMinusM050, 0) / 20 },
  scenarioK3: { xorbScore: strata[3].xorbScore, m050Score: strata[3].m050Score, m049Score: strata[3].m049Score,
    xorbMinusM050: strata[3].pairedCohortDeltas.reduce((sum, item) => sum + item.xorbMinusM050, 0) / 20 },
  files: Object.entries(recordMap).map(([id, identities]) => ({ id, ...identities })) };
const outputPath = path.join(extension, 'analysis-corrected.json');
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: output.status, naturalWeighted: output.naturalWeighted, weights,
  strata: output.strata.map(({k,xorbScore,m050Score,m049Score,pairedCohortDeltas,cohortCount})=>({k,xorbScore,m050Score,m049Score,deltaXorbMinusM050:pairedCohortDeltas.reduce((s,x)=>s+x.xorbMinusM050,0)/cohortCount,cohortCount})),
  outputPath, outputSha256: hash(outputPath) }, null, 2));
