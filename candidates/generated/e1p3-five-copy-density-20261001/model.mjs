import crypto from 'node:crypto';

export const arms = ['m049', 'm050', 'e1p3', 'e1p3-xorb'];
export const cloneNames = ['CF01_e1p3', 'CF02_e1p3', 'CF03_e1p3', 'CF04_e1p3', 'CF05_e1p3'];
export const candidateNames = ['A00_TEST', 'Z99_TEST'];
export const assert = (ok, message) => { if (!ok) throw new Error(message); };
export const equal = (a, b, message) => assert(JSON.stringify(a) === JSON.stringify(b), `${message}: mismatch`);
export const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

export function choose(n, k) {
  if (k < 0 || k > n) return 0;
  let out = 1;
  for (let i = 1; i <= k; i++) out = out * (n - i + 1) / i;
  return out;
}
export const weights = [0, 1, 2, 3].map(k => ({ k,
  numerator: choose(5, k) * choose(75, 3 - k), denominator: choose(80, 3),
  probability: choose(5, k) * choose(75, 3 - k) / choose(80, 3) }));

export function seedRange(seed, battles) {
  assert(typeof seed === 'string' && /^[A-Za-z0-9_.-]+$/.test(seed), 'bad seed label');
  let firstWarSeed = 0;
  for (let i = 0; i < seed.length; i++) firstWarSeed = (Math.imul(firstWarSeed, 31) + seed.charCodeAt(i)) | 0;
  return { seed, firstWarSeed, lastWarSeed: firstWarSeed + battles - 1 };
}
export const overlaps = (a, b) => a.firstWarSeed <= b.lastWarSeed && b.firstWarSeed <= a.lastWarSeed;

export function combos(items, k) {
  const out = [];
  function visit(start, picked) {
    if (picked.length === k) { out.push(picked); return; }
    for (let i = start; i <= items.length - (k - picked.length); i++) visit(i + 1, [...picked, items[i]]);
  }
  visit(0, []); return out;
}

export function stream(salt) {
  assert(/^[a-f0-9]{64}$/.test(salt), 'bad SHA-256 salt');
  let counter = 0, bytes = Buffer.alloc(0), offset = 0;
  const bounded = n => {
    const limit = Math.floor(0x100000000 / n) * n;
    let x;
    do {
      if (offset + 4 > bytes.length) { const count = Buffer.alloc(8); count.writeBigUInt64BE(BigInt(counter++));
        bytes = crypto.createHash('sha256').update(Buffer.from(salt, 'hex')).update(count).digest(); offset = 0; }
      x = bytes.readUInt32BE(offset); offset += 4;
    } while (x >= limit);
    return x % n;
  };
  return { shuffle(values) { const out = [...values]; for (let i = out.length - 1; i > 0; i--) {
    const j = bounded(i + 1); [out[i], out[j]] = [out[j], out[i]]; } return out; } };
}

export function schedule(publicTeams, salt, cohortsPerK = 10) {
  assert(publicTeams.length === 75 && new Set(publicTeams.map(t => t.name)).size === 75, 'expected 75 distinct public teams');
  const clones = cloneNames.map(name => ({ name })), sorted = [...publicTeams].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  assert(sorted.every(t => !cloneNames.includes(t.name) && !candidateNames.includes(t.name)), 'name collision');
  const rng = stream(salt), out = [];
  for (const k of [0, 1, 2, 3]) {
    const all = combos(clones, k); assert(cohortsPerK % all.length === 0, `unbalanced clone subsets at K=${k}`);
    const subsetSchedule = rng.shuffle(Array.from({ length: cohortsPerK / all.length }, () => all).flat());
    for (let i = 0; i < cohortsPerK; i++) {
      const publicOpponents = rng.shuffle(sorted).slice(0, 3 - k), familyOpponents = subsetSchedule[i];
      out.push({ id: `k${k}-${String(i + 1).padStart(2, '0')}`, k,
        publicOpponents: publicOpponents.map(t => t.name), cloneOpponents: familyOpponents.map(t => t.name),
        opponents: [...publicOpponents, ...familyOpponents.map(c => ({ name: c.name, kind: 'e1p3' }))] });
    }
  }
  return out;
}

export const tCritical95df19 = 2.093024054408263;
