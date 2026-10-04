import { arms, cloneNames, weights, choose, combos, schedule, equal, assert, seedRange, overlaps } from './model.mjs';

equal(arms, ['m049', 'm050', 'e1p3', 'e1p3-xorb'], 'arms');
equal(weights.map(w => w.numerator), [67525, 13875, 750, 10], 'hypergeometric counts');
equal(choose(80, 3), 82160, 'opponent subset denominator');
assert(Math.abs(weights.reduce((s, w) => s + w.probability, 0) - 1) < 1e-14, 'probabilities sum to one');
assert(Math.abs(weights.reduce((s, w) => s + w.k * w.probability, 0) - 3 * 5 / 80) < 1e-14, 'expected clone count');
const pool = Array.from({ length: 75 }, (_, i) => ({ name: `PUBLIC_${String(i).padStart(2, '0')}` }));
const a = schedule(pool, '0'.repeat(64)), b = schedule([...pool].reverse(), '0'.repeat(64));
equal(a, b, 'schedule canonicalization'); equal(a.length, 40, '40 K-cohorts');
for (const k of [0, 1, 2, 3]) {
  const rows = a.filter(x => x.k === k); equal(rows.length, 10, `K=${k} cohort count`);
  for (const row of rows) { equal(row.opponents.length, 3, 'exactly three opponent teams');
    equal(row.cloneOpponents.length, k, 'exact clone count'); equal(new Set(row.opponents.map(x => x.name)).size, 3, 'unique names per battle'); }
  for (const subset of combos(cloneNames.map(name => ({ name })), k)) {
    equal(rows.filter(row => JSON.stringify(row.cloneOpponents) === JSON.stringify(subset.map(x => x.name))).length,
      10 / combos(cloneNames, k).length, `balanced subset at K=${k}`);
  }
}
assert(overlaps(seedRange('seed-a', 10), seedRange('seed-a', 10)), 'identical seed range overlap');
assert(!overlaps(seedRange('seed-001', 10), seedRange('seed-1000', 10)), 'example disjoint range');
console.log(JSON.stringify({ status: 'PASS_PURE_AUTHOR_TESTS', wars: 0, entropy: 0, filesWritten: 0, cohorts: a.length, weights }));
