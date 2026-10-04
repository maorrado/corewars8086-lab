// Authoring-only model. No filesystem writes, entropy draws, or battle execution.
import crypto from 'node:crypto';

export const arms = ['m049', 'm050', 'c090', 'e1'];
export const duelOpponents = ['e1', 'c090', 'synthesis', 'fixed-toggle'];
export const clones = [
  { name: 'CF01_e1', variant: 'e1' },
  { name: 'CF02_e1', variant: 'e1' },
  { name: 'CF03_c090', variant: 'c090' },
  { name: 'CF04_synthesis', variant: 'synthesis' },
  { name: 'CF05_fixed_toggle', variant: 'fixed-toggle' },
];
export const candidateNames = ['A00_TEST', 'Z99_TEST'];
export const assert = (ok, message) => { if (!ok) throw new Error(message); };
export const equal = (actual, expected, message) => assert(JSON.stringify(actual) === JSON.stringify(expected), message);
export const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

export function choose(n, k) {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 1; i <= k; i++) result = result * (n - i + 1) / i;
  return result;
}
export const weights = [0, 1, 2, 3].map(k => ({
  k, numerator: choose(5, k) * choose(75, 3 - k), denominator: choose(80, 3),
  probability: choose(5, k) * choose(75, 3 - k) / choose(80, 3),
}));
export const design = {
  candidateArms: arms, publicTeams: 75, addedFamilyTeams: clones,
  scenarios: { baseline0: { opposingPool: 75, weights: [1, 0, 0, 0] },
    family5: { opposingPool: 80, weights: weights.map(w => w.probability) } },
  population: { strata: [0, 1, 2, 3], cohortsPerStratum: 20, nameOrientations: 2,
    battlesPerCohortOrientation: 10, independentEngineRanges: 80,
    executionsPerArm: 1600, actualExecutions: 6400 },
  duels: { logicalPairs: 16, seeds: 8, nameOrientations: 2, battlesPerSeedOrientation: 25,
    logicalExecutions: 6400, actualExecutions: 5600,
    note: 'Thirteen non-self unordered pairs use two orientations; two self pairs use one physical configuration and both score columns.' },
  totalActualExecutions: 12000, totalLogicalExecutions: 12800,
  threads: 1, parallel: false,
};
export const analysisPlan = {
  metric: 'Team points per candidate appearance, not battle win percentage.',
  populationUnit: 'Twenty sampled opponent sets per K, each averaging both candidate-name orientations and all ten wars.',
  populationCritical95: 2.093024054408263,
  duelUnit: 'Eight engine-seed blocks per logical matchup, each averaging both name orientations.',
  duelCritical95: 2.3646242510102993,
  contrasts: [['m049', 'm050'], ['m050', 'm049'], ['c090', 'm049'], ['c090', 'm050'], ['e1', 'm049'], ['e1', 'm050'], ['e1', 'c090']],
  densityChange: 'Scenario5 minus scenario0 uses coefficients [p0-1,p1,p2,p3] on independent K strata, not independent-scenario variance.',
  claim: 'Complete descriptive stress results only. Nominal approximate intervals, not familywise promotion tests, universal superiority, or immunity.',
};
export const mean = values => {
  assert(Array.isArray(values) && values.length > 0 && values.every(Number.isFinite), 'finite nonempty sample required');
  return values.reduce((sum, x) => sum + x, 0) / values.length;
};
export function summarize(values, critical) {
  assert(values.length >= 2 && Number.isFinite(critical) && critical > 0, 'at least two cluster values required');
  const average = mean(values), variance = values.reduce((sum, x) => sum + (x - average) ** 2, 0) / (values.length - 1);
  const varianceOfMean = variance / values.length, standardError = Math.sqrt(varianceOfMean);
  return { mean: average, clusters: values.length, varianceOfMean, standardError,
    descriptiveInterval95: [average - critical * standardError, average + critical * standardError] };
}
export function weightedSummary(summaries, coefficients, critical) {
  assert(summaries.length === 4 && coefficients.length === 4 && coefficients.every(Number.isFinite), 'four independent strata required');
  const average = summaries.reduce((sum, s, k) => sum + coefficients[k] * s.mean, 0);
  const varianceOfMean = summaries.reduce((sum, s, k) => sum + coefficients[k] ** 2 * s.varianceOfMean, 0);
  const standardError = Math.sqrt(varianceOfMean);
  return { mean: average, coefficients, independentStrata: 4, varianceOfMean, standardError,
    descriptiveInterval95: [average - critical * standardError, average + critical * standardError] };
}

export function seedRange(seed, battles) {
  assert(typeof seed === 'string' && /^[A-Za-z0-9_.-]+$/.test(seed), 'invalid seed label');
  assert(Number.isSafeInteger(battles) && battles > 0, 'invalid seed range length');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (Math.imul(hash, 31) + seed.charCodeAt(i)) | 0;
  return { seed, firstWarSeed: hash, lastWarSeed: hash + battles - 1 };
}
export const overlaps = (a, b) => a.firstWarSeed <= b.lastWarSeed && b.firstWarSeed <= a.lastWarSeed;
export const populationIds = Array.from({ length: 4 }, (_, k) => Array.from({ length: 20 }, (_, i) =>
  `k${k}-${String(i + 1).padStart(2, '0')}`)).flat();

export function combinations(items, k) {
  const output = [];
  function visit(start, current) {
    if (current.length === k) { output.push(current); return; }
    for (let i = start; i <= items.length - (k - current.length); i++) visit(i + 1, [...current, items[i]]);
  }
  visit(0, []);
  return output;
}

export function stream(salt) {
  assert(/^[a-f0-9]{64}$/.test(salt), 'need 32-byte hexadecimal salt');
  let counter = 0, buffer = Buffer.alloc(0), offset = 0;
  const bounded = bound => {
    assert(Number.isInteger(bound) && bound > 0 && bound <= 0x100000000, 'bad random bound');
    const limit = Math.floor(0x100000000 / bound) * bound;
    let value;
    do {
      if (offset + 4 > buffer.length) {
        const count = Buffer.alloc(8); count.writeBigUInt64BE(BigInt(counter++));
        buffer = crypto.createHash('sha256').update(Buffer.from(salt, 'hex')).update(count).digest(); offset = 0;
      }
      value = buffer.readUInt32BE(offset); offset += 4;
    } while (value >= limit);
    return value % bound;
  };
  return {
    shuffle(items) {
      const result = [...items];
      for (let i = result.length - 1; i > 0; i--) { const j = bounded(i + 1); [result[i], result[j]] = [result[j], result[i]]; }
      return result;
    },
  };
}

export function populationSchedule(publicTeams, salt) {
  assert(publicTeams.length === 75 && new Set(publicTeams.map(t => t.name)).size === 75, 'need 75 distinct public entrants');
  const sorted = [...publicTeams].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  assert(sorted.every(t => !clones.some(c => c.name === t.name) && !candidateNames.includes(t.name)), 'name collision');
  const rng = stream(salt), cohorts = [];
  for (const k of [0, 1, 2, 3]) {
    // Each clone subset appears equally often. Uniformly permuting this list
    // gives the exact uniform conditional clone-subset distribution in each slot.
    const subsets = combinations(clones, k);
    assert(20 % subsets.length === 0, 'unbalanced clone-subset allocation');
    const counterSchedule = rng.shuffle(Array.from({ length: 20 / subsets.length }, () => subsets).flat());
    for (let i = 0; i < 20; i++) {
      // Public subsets are sampled independently across cohorts, without
      // replacement within a cohort. Never redraw based on battle outcomes.
      const publicSubset = rng.shuffle(sorted).slice(0, 3 - k);
      const counterSubset = counterSchedule[i];
      cohorts.push({ id: `k${k}-${String(i + 1).padStart(2, '0')}`, k,
        publicNames: publicSubset.map(t => t.name), counterNames: counterSubset.map(t => t.name),
        publicOpponents: publicSubset, familyOpponents: counterSubset,
      });
    }
  }
  return cohorts;
}

export function duelSchedule() {
  const physical = new Map(), logical = [];
  for (const candidate of arms) for (const opponent of duelOpponents) for (const orientation of [0, 1]) {
    const mapping = orientation === 0 ? { DUEL_A: candidate, DUEL_B: opponent } : { DUEL_A: opponent, DUEL_B: candidate };
    const key = `${mapping.DUEL_A}__${mapping.DUEL_B}`;
    if (!physical.has(key)) physical.set(key, { id: `duel-${key}`, mapping });
    logical.push({ candidate, opponent, orientation, physicalId: physical.get(key).id,
      candidateName: orientation === 0 ? 'DUEL_A' : 'DUEL_B', opponentName: orientation === 0 ? 'DUEL_B' : 'DUEL_A' });
  }
  equal(physical.size, 28, 'expected 28 unique physical duel configurations');
  equal(logical.length, 32, 'expected 32 logical oriented comparisons');
  return { physical: [...physical.values()], logical };
}

export function validateRandomness(randomness, excludedRanges) {
  assert(typeof randomness.provenance === 'string' && randomness.provenance.length >= 20, 'randomness needs recorded provenance');
  assert(/^[a-f0-9]{64}$/.test(randomness.salt), 'invalid schedule salt');
  equal(Object.keys(randomness.population).sort(), [...populationIds].sort(), 'exactly 80 population seed labels required');
  assert(Array.isArray(randomness.duel) && randomness.duel.length === 8, 'eight duel seed labels required');
  const ranges = [...populationIds.map(id => ({ purpose: id, ...seedRange(randomness.population[id], 10) })),
    ...randomness.duel.map((seed, i) => ({ purpose: `duel-${i + 1}`, ...seedRange(seed, 25) }))];
  const canonical = range => seedRange(range.seed, range.lastWarSeed - range.firstWarSeed + 1);
  for (const range of excludedRanges) equal({ seed: range.seed, firstWarSeed: range.firstWarSeed, lastWarSeed: range.lastWarSeed }, canonical(range), 'invalid exclusion range');
  for (const [i, range] of ranges.entries()) for (const other of [...excludedRanges, ...ranges.slice(0, i)]) {
    assert(!overlaps(range, other), `overlapping Java war seed ranges: ${range.seed} / ${other.seed}`);
  }
  return ranges;
}
