// Pure author tests: deterministic TEST-ONLY schedule, no entropy, files or wars.
import { arms, clones, design, weights, choose, combinations, populationSchedule, duelSchedule,
  validateRandomness, populationIds, seedRange, overlaps, equal, assert, summarize, weightedSummary, analysisPlan } from './model.mjs';

equal(weights.map(w => w.numerator), [67525, 13875, 750, 10], 'hypergeometric numerators');
equal(choose(80, 3), 82160, 'hypergeometric denominator');
assert(Math.abs(weights.reduce((s, w) => s + w.probability, 0) - 1) < 1e-14, 'weights sum');
assert(Math.abs(weights.reduce((s, w) => s + w.k * w.probability, 0) - 3 * 5 / 80) < 1e-14, 'expected counter count');
const pool = Array.from({ length: 75 }, (_, i) => ({ name: `PUBLIC_${String(i).padStart(2, '0')}`, warriors: [`A${i}`, `B${i}`] }));
const schedule = populationSchedule(pool, '0'.repeat(64));
equal(schedule, populationSchedule([...pool].reverse(), '0'.repeat(64)), 'canonical ordering/reproducibility');
equal(schedule.map(c => c.id), populationIds, 'schedule IDs');
for (const k of [0, 1, 2, 3]) {
  const stratum = schedule.filter(c => c.k === k);
  equal(stratum.length, 20, 'stratum count');
  const subsets = combinations(clones, k);
  for (const c of stratum) {
    equal(c.publicNames.length, 3 - k, 'public count'); equal(c.counterNames.length, k, 'counter count');
    equal(new Set([...c.publicNames, ...c.counterNames]).size, 3, 'exactly three unique opponents');
  }
  for (const subset of subsets) equal(stratum.filter(c => JSON.stringify(c.counterNames) === JSON.stringify(subset.map(t => t.name))).length,
    20 / subsets.length, 'balanced conditional clone subset');
}
const duels = duelSchedule();
for (const item of duels.logical) {
  const p = duels.physical.find(v => v.id === item.physicalId);
  equal(p.mapping[item.candidateName], item.candidate, 'logical candidate binary mapping');
  equal(p.mapping[item.opponentName], item.opponent, 'logical opponent binary mapping');
}
equal(duels.physical.length * 8 * 25 + schedule.length * arms.length * 2 * 10, design.totalActualExecutions, 'battle budget');
// Numeric string seeds, widely spaced in label space, are only synthetic tests.
const randomness = { salt: '0'.repeat(64), provenance: 'TEST ONLY deterministic input; never a research freeze',
  population: Object.fromEntries(populationIds.map((id, i) => [id, `selftest-pop-${1000000 + i * 1000}`])),
  duel: Array.from({ length: 8 }, (_, i) => `selftest-duel-${9000000 + i * 1000}`) };
const ranges = validateRandomness(randomness, []);
equal(ranges.length, 88, '88 fresh ranges');
let rejected = false;
try { validateRandomness(randomness, [seedRange(randomness.duel[0], 25)]); } catch { rejected = true; }
assert(rejected, 'duplicate old range must be rejected');
assert(overlaps(seedRange('all-001', 50), seedRange('all-002', 50)), 'adjacent string labels do not establish independent engine seeds');
const clusters = Array.from({ length: 20 }, (_, i) => i / 100);
const summary = summarize(clusters, analysisPlan.populationCritical95);
assert(Math.abs(summary.mean - 0.095) < 1e-14, 'cluster mean');
equal(summary.clusters, 20, 'two name positions must not become 40 clusters');
const constant = summarize(Array.from({ length: 20 }, () => 0.25), analysisPlan.populationCritical95);
equal(constant.descriptiveInterval95, [0.25, 0.25], 'constant cluster interval');
const natural = weights.map(w => w.probability);
const unchanged = weightedSummary(Array(4).fill(constant), natural, analysisPlan.populationCritical95);
assert(Math.abs(unchanged.mean - 0.25) < 1e-14, 'natural weighting preserves constant response');
const change = weightedSummary(Array(4).fill(summary), natural.map((p, k) => p - (k === 0 ? 1 : 0)), analysisPlan.populationCritical95);
assert(Math.abs(change.mean) < 1e-14, 'equal conditional means imply zero density change');
const expectedVariance = summary.varianceOfMean * natural.reduce((s, p, k) => s + (p - (k === 0 ? 1 : 0)) ** 2, 0);
assert(Math.abs(change.varianceOfMean - expectedVariance) < 1e-18, 'density-change variance accounts for shared K=0');
console.log(JSON.stringify({ status: 'PASS_AUTHOR_TESTS_ONLY', filesWritten: 0, entropyDraws: 0, wars: 0,
  scheduleRows: schedule.length, duelPhysicalConfigs: duels.physical.length, totalExecutions: design.totalActualExecutions,
  weights, independence: 'Different actual Java seed ranges verified, not merely different seed strings.' }, null, 2));
