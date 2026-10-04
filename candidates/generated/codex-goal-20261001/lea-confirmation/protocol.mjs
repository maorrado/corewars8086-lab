import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(here, '../../../..');
export const suite = 'codex-goal-20261001-lea-confirmation';
export const manifestPath = path.join(here, 'manifest.json');
export const sha = value => crypto.createHash('sha256').update(value).digest('hex');
export const hashFile = file => sha(fs.readFileSync(file));
export const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
export const jsonText = value => `${JSON.stringify(value, null, 2)}\n`;
export const assert = (condition, message) => { if (!condition) throw new Error(message); };
export const equal = (actual, expected, label) => assert(JSON.stringify(actual) === JSON.stringify(expected), `${label}: mismatch`);
export const rootPath = file => path.resolve(root, file);
export const slash = file => file.split(path.sep).join('/');
export const relativeRoot = file => slash(path.relative(root, file));
export const relativeHere = file => slash(path.relative(here, rootPath(file)));
export const fileRecord = file => ({ path: file, bytes: fs.statSync(rootPath(file)).size, sha256: hashFile(rootPath(file)) });
export const originalManifestPath = 'candidates/generated/claude-synthesis-audit-20260930/manifest.json';
export const extrasManifestPath = 'candidates/generated/claude-synthesis-audit-20260930/extras-manifest.json';
export const jointManifestPath = 'candidates/generated/claude-synthesis-joint-20260930/manifest.json';
export const referenceHashes = {
  'm049-m050-realistic-20260930-m049.json': 'b7f07980e42628a1f98eec95e4b007571af35c8f6a7b295e5438be7d59b77c00',
  'm049-m050-realistic-20260930-m050.json': '83743edf036f482537024dbc41b282ad9f757132fbe2cf011c348b8a5a067bc3',
  'm049-m050-realistic-20260930-m049-seed2.json': 'cbf7203423ce40c6558655dfea0b193386fc6c2c6d7145eaa740c2014ccbb9e8',
  'm049-m050-realistic-20260930-m050-seed2.json': 'b4baa9dbb65b3cfe741acf94de04ac517bdbee2730d4ab368e0bdb3d577b8a24',
  [originalManifestPath]: '73de3d03de97bfb7628bf6b7169f921dd3ab8ffdfb09ff5dd0dfc6eadd96eaa7',
  [extrasManifestPath]: '92c582ab107b8d4c43ded14ab39d6f6efd6d242d9667bbc9b8c4fa48ca2e9c39',
  [jointManifestPath]: 'c4873d8c2cd552ad8b50770696a01710b699dd8922593bca67c594f8638d67da',
};
export const originalVariants = {
  c090: ['build/claude-synthesis-audit-20260930/extras/LeaA', 'build/claude-synthesis-audit-20260930/extras/LeaB'],
  m049: ['build/chimera-zero-di-elision/b_pad_a', 'build/chimera-zero-di-elision/a_pad_b'],
  m050: ['build/final/ChimeraA', 'build/final/ChimeraB'],
};
export const localVariants = Object.fromEntries(Object.keys(originalVariants).map(variant => [variant, [`build/${variant}/A`, `build/${variant}/B`]]));
export const authoredFiles = ['preregistered-randomness.json', 'protocol.mjs', 'generate.mjs', 'README.md'];
export const algorithm = 'sha256-counter-stream-v1; unbiased rejection-sampled uint32 Fisher-Yates; 13 distinct repeats; full-slot reshuffle until every trio has three distinct teams';
export const decisionPlan = {
  metric: 'team points per battle', candidate: 'c090', references: ['m049', 'm050'], battlesPerArm: 5000,
  primaryUnit: 'one paired 50-battle cohort-seed aggregate', cohortClusters: 50,
  interval: 'two-sided 95% Student-t on 50 cohort means, df=49, t=2.0095752371292397',
  survivalGate: 'For BOTH references: pooled mean delta > 0; cohort CI lower bound > 0; both panel deltas > 0; all four panel-seed deltas > 0.',
  boundary: 'A pass supports this senior-2025 panel protocol only. No final replacement, broad universality claim, old-result pooling, or transfer-pool conclusion is authorized.',
};

export function seedRange(seed, battles) {
  let hash = 0;
  for (let index = 0; index < seed.length; index++) hash = (Math.imul(hash, 31) + seed.charCodeAt(index)) | 0;
  return { seed, firstWarSeed: hash, lastWarSeed: hash + battles - 1 };
}
const overlaps = (a, b) => a.firstWarSeed <= b.lastWarSeed && b.firstWarSeed <= a.lastWarSeed;

function randomStream(salt) {
  let counter = 0;
  let buffer = Buffer.alloc(0);
  let offset = 0;
  const nextUint32 = () => {
    if (offset + 4 > buffer.length) {
      const countBytes = Buffer.alloc(8);
      countBytes.writeBigUInt64BE(BigInt(counter++));
      buffer = crypto.createHash('sha256').update(Buffer.from(salt, 'hex')).update(countBytes).digest();
      offset = 0;
    }
    const value = buffer.readUInt32BE(offset);
    offset += 4;
    return value;
  };
  return bound => {
    const limit = Math.floor(0x100000000 / bound) * bound;
    let value;
    do { value = nextUint32(); } while (value >= limit);
    return value % bound;
  };
}
function shuffle(values, randomInt) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const other = randomInt(index + 1);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}
function createPanel(specification, teams) {
  const randomInt = randomStream(specification.salt);
  const repeatTeams = shuffle(teams, randomInt).slice(0, 13);
  const slots = [...teams, ...repeatTeams];
  let attempts = 0;
  let arranged;
  do {
    assert(++attempts <= 10000, 'panel layout rejection cap exceeded');
    arranged = shuffle(slots, randomInt);
  } while (Array.from({ length: 25 }, (_, index) => arranged.slice(3 * index, 3 * index + 3))
    .some(trio => new Set(trio.map(team => team.name)).size !== 3));
  const cohorts = Array.from({ length: 25 }, (_, index) => ({
    id: `senior-p${specification.panel}-${String(index + 1).padStart(2, '0')}`,
    opponents: arranged.slice(3 * index, 3 * index + 3).map(team => ({ name: team.name, warriors: team.warriors.map(relativeHere) })),
  }));
  const counts = Object.fromEntries(teams.map(team => [team.name, arranged.filter(slot => slot.name === team.name).length]));
  assert(Object.values(counts).filter(count => count === 2).length === 13 && Object.values(counts).every(count => count === 1 || count === 2), 'invalid repeat allocation');
  return { ...specification, algorithm, rejectionAttempts: attempts,
    repeatedTeams: repeatTeams.map(team => team.name).sort(), exposureCounts: counts, cohorts };
}

export function readProtocol() {
  for (const [file, expected] of Object.entries(referenceHashes)) equal(hashFile(rootPath(file)), expected, `${file} pinned hash`);
  const original = readJson(rootPath(originalManifestPath));
  const extras = readJson(rootPath(extrasManifestPath));
  const joint = readJson(rootPath(jointManifestPath));
  equal(extras.parentManifestSha256, referenceHashes[originalManifestPath], 'extras parent linkage');
  equal(extras.variants['lea-only'], originalVariants.c090, 'exact c090 variant');
  for (const name of ['m049', 'm050']) equal(original.variants[name], originalVariants[name], `exact ${name} variant`);
  const poolConfigs = Object.keys(referenceHashes).filter(file => file.startsWith('m049-m050-realistic')).map(file => readJson(rootPath(file)));
  const collectTeams = config => {
    const byName = new Map();
    for (const team of config.cohorts.flatMap(cohort => cohort.opponents)) {
      assert(team.name.startsWith('A_') && team.warriors.length === 2 && team.warriors.every(file => file.startsWith('official-2025/survivors-online/')), 'non-senior team in reference pool');
      if (byName.has(team.name)) equal(byName.get(team.name), team, `inconsistent ${team.name}`);
      else byName.set(team.name, team);
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'en'));
  };
  const teams = collectTeams(poolConfigs[0]);
  assert(teams.length === 62, 'expected exactly 62 verified senior teams');
  for (const config of poolConfigs.slice(1)) equal(collectTeams(config), teams, 'senior pool identity');
  for (const config of poolConfigs) equal(config.zombies, poolConfigs[0].zombies, 'reference Zombie set');
  const frozenMap = new Map([...original.binaries, ...extras.binaries].map(record => [record.path, record]));
  const sourceBinaries = Object.values(originalVariants).flat().map(file => frozenMap.get(file));
  const opponentFiles = [...new Set(teams.flatMap(team => team.warriors))];
  const zombieFiles = poolConfigs[0].zombies.map(zombie => zombie.path);
  const fieldBinaries = [...opponentFiles, ...zombieFiles].map(file => frozenMap.get(file));
  assert(sourceBinaries.every(Boolean) && fieldBinaries.every(Boolean) && fieldBinaries.length === 128, 'a binary lacks prior frozen provenance');
  const c090Sources = extras.sources.filter(record => /\/Lea[AB]\.asm$/.test(record.path));
  assert(c090Sources.length === 2, 'missing c090 source provenance');
  for (const record of [...sourceBinaries, ...fieldBinaries, ...c090Sources, original.engine, original.java, original.runner]) {
    equal(fs.statSync(rootPath(record.path)).size, record.bytes, `${record.path} source length`);
    equal(hashFile(rootPath(record.path)), record.sha256, `${record.path} source hash`);
  }
  const specifications = readJson(path.join(here, 'preregistered-randomness.json')).panels;
  equal(specifications.map(specification => specification.panel), [1, 2], 'two panel identifiers');
  assert(specifications.every(specification => /^[a-f0-9]{64}$/.test(specification.salt) && specification.seeds.length === 2), 'invalid panel salt/seeds');
  assert(new Set(specifications.map(specification => specification.salt)).size === 2, 'panel salts must differ');
  const seeds = specifications.flatMap(specification => specification.seeds);
  assert(new Set(seeds).size === 4 && seeds.every(seed => /^[A-Za-z0-9_.-]+$/.test(seed)), 'four distinct safe battle seeds required');
  const priorRanges = [
    ...original.protocol.screen.seeds.map(seed => seedRange(seed, 50)),
    ...original.protocol.fresh.seeds.map(seed => seedRange(seed, 50)),
    ...original.protocol.duels.seeds.map(seed => seedRange(seed, 125)),
    ...joint.protocol.seeds.map(seed => seedRange(seed, 10)),
    ...poolConfigs.flatMap(config => config.seeds.map(seed => seedRange(seed, config.battles))),
  ];
  const ranges = seeds.map(seed => seedRange(seed, 50));
  ranges.forEach((range, index) => {
    for (const old of [...priorRanges, ...ranges.slice(0, index)]) assert(!overlaps(range, old), `seed range overlaps ${range.seed} / ${old.seed}`);
  });
  const panels = specifications.map(specification => createPanel(specification, teams));
  assert(JSON.stringify(panels[0].cohorts.map(cohort => cohort.opponents)) !== JSON.stringify(panels[1].cohorts.map(cohort => cohort.opponents)), 'panel layouts unexpectedly identical');
  return { original, extras, teams, panels, sourceBinaries, fieldBinaries, c090Sources, ranges, priorRanges,
    zombies: poolConfigs[0].zombies.map(zombie => ({ name: zombie.name, path: relativeHere(zombie.path) })) };
}

export function makeConfigs(protocol) {
  return protocol.panels.flatMap(panel => Object.entries(localVariants).map(([variant, warriors]) => {
    const id = `panel-${panel.panel}-${variant}`;
    return { id, panel: panel.panel, variant, configPath: `${id}.json`, totalBattles: 2500,
      config: {
        experimentId: `${suite}-${id}`, outputPath: `results/${id}.json`, runDirectory: `runs/${id}`,
        java: relativeHere(protocol.original.java.path), jar: relativeHere(protocol.original.engine.path),
        candidate: { name: 'COD_pair', warriors }, battles: 50, threads: 1, parallel: false, telemetry: false,
        seeds: panel.seeds, cohorts: panel.cohorts, zombies: protocol.zombies,
      } };
  }));
}
