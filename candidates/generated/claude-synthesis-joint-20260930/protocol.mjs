import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(here, '../../..');
export const audit = 'claude-synthesis-joint-20260930';
export const manifestPath = path.join(here, 'manifest.json');
export const priorManifestPath = 'candidates/generated/claude-synthesis-audit-20260930/manifest.json';
export const priorManifestHash = '73de3d03de97bfb7628bf6b7169f921dd3ab8ffdfb09ff5dd0dfc6eadd96eaa7';
export const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export const hashFile = file => sha(fs.readFileSync(file));
export const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
export const jsonText = value => `${JSON.stringify(value, null, 2)}\n`;
export const assert = (condition, label) => { if (!condition) throw new Error(label); };
export const equal = (actual, expected, label) => assert(JSON.stringify(actual) === JSON.stringify(expected), `${label}: mismatch`);
export const rootPath = file => path.resolve(root, file);
export const slash = file => file.split(path.sep).join('/');
export const relativeRoot = file => slash(path.relative(root, file));
export const relativeHere = file => slash(path.relative(here, rootPath(file)));
export const fileRecord = file => ({ path: file, bytes: fs.statSync(rootPath(file)).size, sha256: hashFile(rootPath(file)) });
export const variants = {
  submitted: ['build/claude-synthesis-audit-20260930/SubmittedA', 'build/claude-synthesis-audit-20260930/SubmittedB'],
  m049: ['build/chimera-zero-di-elision/b_pad_a', 'build/chimera-zero-di-elision/a_pad_b'],
  m050: ['build/final/ChimeraA', 'build/final/ChimeraB'],
};
export const orientations = [
  { id: 'orientation-1', mapping: { COD_A: 'submitted', COD_B: 'm049', COD_C: 'm050' } },
  { id: 'orientation-2', mapping: { COD_A: 'm049', COD_B: 'm050', COD_C: 'submitted' } },
  { id: 'orientation-3', mapping: { COD_A: 'm050', COD_B: 'submitted', COD_C: 'm049' } },
];
export function seedRange(seed, battles) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (Math.imul(hash, 31) + seed.charCodeAt(i)) | 0;
  return { seed, firstWarSeed: hash, lastWarSeed: hash + battles - 1 };
}
export const overlaps = (a, b) => a.firstWarSeed <= b.lastWarSeed && b.firstWarSeed <= a.lastWarSeed;

export function readProtocol() {
  equal(hashFile(rootPath(priorManifestPath)), priorManifestHash, 'pinned prior manifest hash');
  equal(fs.readFileSync(`${rootPath(priorManifestPath)}.sha256`, 'utf8').trim(), priorManifestHash, 'prior manifest sidecar');
  const prior = readJson(rootPath(priorManifestPath));
  equal(prior.variants, variants, 'prior exact variant paths');
  const references = [prior.base, prior.runner, prior.java, prior.engine, ...prior.sources, ...prior.binaries];
  for (const record of references) {
    equal(fs.statSync(rootPath(record.path)).size, record.bytes, `${record.path} prior length`);
    equal(hashFile(rootPath(record.path)), record.sha256, `${record.path} prior hash`);
  }
  assert(prior.binaries.length === 160, 'expected 160 frozen binary inputs');
  const base = readJson(rootPath(prior.base.path));
  const teams = base.cohorts.flatMap(cohort => cohort.opponents);
  assert(base.cohorts.length === 25 && teams.length === 75 && new Set(teams.map(team => team.name)).size === 75, 'expected exactly 75 unique published teams');
  assert(teams.every(team => team.warriors.length === 2 && /^[A-Za-z0-9_.-]+$/.test(team.name)), 'invalid opponent team');
  assert(base.zombies.length === 4, 'expected four Zombies');
  const seeds = readJson(path.join(here, 'seeds.json')).seeds;
  assert(seeds.length === 3 && new Set(seeds).size === 3 && seeds.every(seed => /^[A-Za-z0-9_.-]+$/.test(seed)), 'expected three unique safe seeds');
  const seedRanges = seeds.map(seed => seedRange(seed, 10));
  const previousSeedRanges = [
    ...prior.protocol.screen.seeds.map(seed => seedRange(seed, prior.protocol.screen.battlesPerBlock)),
    ...prior.protocol.fresh.seeds.map(seed => seedRange(seed, prior.protocol.fresh.battlesPerBlock)),
    ...prior.protocol.duels.seeds.map(seed => seedRange(seed, prior.protocol.duels.battlesPerOrientationSeed)),
  ];
  for (const [index, current] of seedRanges.entries()) {
    for (const other of [...previousSeedRanges, ...seedRanges.slice(0, index)]) {
      assert(!overlaps(current, other), `overlapping joint engine seed range: ${current.seed} / ${other.seed}`);
    }
  }
  return { prior, base, teams, seeds, seedRanges, previousSeedRanges };
}

export function makeConfigs(protocol) {
  return orientations.map(orientation => {
    const team = name => ({ name, warriors: variants[orientation.mapping[name]].map(relativeHere) });
    const config = {
      experimentId: `${audit}-${orientation.id}`,
      outputPath: relativeHere(`experiments/${audit}/${orientation.id}.json`),
      runDirectory: relativeHere(`build/official-runs/${audit}/${orientation.id}`),
      java: relativeHere(protocol.prior.java.path), jar: relativeHere(protocol.prior.engine.path),
      threads: 1, parallel: false, telemetry: false,
      candidate: team('COD_A'), battles: 10, seeds: protocol.seeds,
      cohorts: protocol.teams.map((opponent, index) => ({
        id: `field-${String(index + 1).padStart(3, '0')}`,
        opponents: [team('COD_B'), team('COD_C'), { name: opponent.name, warriors: opponent.warriors.map(relativeHere) }],
      })),
      zombies: protocol.base.zombies.map(zombie => ({ name: zombie.name, path: relativeHere(zombie.path) })),
    };
    return { ...orientation, configPath: `${orientation.id}.json`, totalBattles: 2250, config };
  });
}
