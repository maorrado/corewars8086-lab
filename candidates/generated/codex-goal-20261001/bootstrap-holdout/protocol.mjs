import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(here, '../../../..');
export const freeze = path.join(here, 'frozen');
export const suite = 'codex-goal-20261001-bootstrap-holdout';
export const arms = ['entry_lea', 'both', 'm049', 'm050'];
export const assert = (ok, message) => { if (!ok) throw new Error(message); };
export const equal = (actual, expected, label) => assert(JSON.stringify(actual) === JSON.stringify(expected), `${label}: mismatch`);
export const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export const hashFile = file => sha(fs.readFileSync(file));
export const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
export const text = value => `${JSON.stringify(value, null, 2)}\n`;
export const record = file => ({ path: path.resolve(file), bytes: fs.statSync(file).size, sha256: hashFile(file) });
export const check = item => equal(record(item.path), item, `frozen file ${item.path}`);
export const absolute = file => path.resolve(root, file);
export const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
export const design = { arms, candidateName: 'COD_pair', panels: 1, cohorts: 25, distinctSeniorTeams: 62, slots: 75,
  distinctRepeatedTeams: 13, seeds: 2, battlesPerBlock: 50, blocksPerArm: 50, battlesPerArm: 2500, totalBattles: 10000,
  threads: 1, parallel: false, telemetry: false };
export const decision = {
  metric: 'team points per battle; not win percentage', candidates: ['entry_lea', 'both'], references: ['m049', 'm050'],
  comparisons: 4, familyAlpha: 0.05, bonferroniTwoSidedCoverage: 0.9875,
  usedCoverage: 0.99, degreesOfFreedom: 24, criticalValue: 2.79694,
  criticalValueNote: 'Conservative preselected 99% two-sided t(df=24) critical, rounded upward; stricter than the requested 98.75% Bonferroni intervals.',
  unit: '25 paired cohort means, each averaging its two paired seed/block deltas; never 2500 independent observed trials',
  gate: 'Each candidate independently passes only if ALL four conditions hold against EACH reference: pooled delta > 0; 99% cohort interval lower bound > 0; seed 1 delta > 0; seed 2 delta > 0.',
  interpretation: 'Approximate cohort-cluster sensitivity on one fresh grouping of the same fixed 62-team 2025 senior pool; repeated teams and common seeds limit independence. A pass supports this protocol, not a universal or unseen-opponent claim. No old-result pooling, 2024 transfer claim, or automatic final promotion.',
};
export const algorithm = 'sha256-counter-v1; rejection-sampled uint32 Fisher-Yates; choose 13 distinct repeats uniformly; shuffle 75 slots until each trio has distinct names; stop at 10000 attempts';
export const pinned = {
  'candidates/generated/codex-goal-20261001/lea-confirmation/manifest.json': 'e58f45cea58b81de33062edaa8e6275a378ee2433d7afa1d98fd08ef93eec17c',
  'candidates/generated/codex-goal-20261001/bootstrap-designs/screen/protocol.json': 'f3dd4cd0b84fc9561694b8b2b6972ee1518b9a871a329a0b971b4953f0252cdf',
  'candidates/generated/codex-goal-20261001/bootstrap-designs/screen/input-manifest.json': 'bee1ba3e32b1887af464bd554e4cf23225dbac8765fd94b9381bfa96c601996d',
  'candidates/generated/codex-goal-20261001/conditional-camper-screen/manifest.json': 'e4cf9d05a76e6dbb0e27b7d3d920ea2474d094321d257deef5c626c2e56d29bd',
};
export function seedRange(seed, battles) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (Math.imul(hash, 31) + seed.charCodeAt(i)) | 0;
  return { seed, firstWarSeed: hash, lastWarSeed: hash + battles - 1 };
}
export const overlaps = (a, b) => a.firstWarSeed <= b.lastWarSeed && b.firstWarSeed <= a.lastWarSeed;

export function panelFromSalt(salt, teams) {
  assert(/^[a-f0-9]{64}$/.test(salt), 'invalid panel salt');
  let counter = 0, bytes = Buffer.alloc(0), offset = 0;
  const bounded = bound => {
    const limit = Math.floor(0x100000000 / bound) * bound;
    let value;
    do {
      if (offset + 4 > bytes.length) {
        const count = Buffer.alloc(8); count.writeBigUInt64BE(BigInt(counter++));
        bytes = crypto.createHash('sha256').update(Buffer.from(salt, 'hex')).update(count).digest(); offset = 0;
      }
      value = bytes.readUInt32BE(offset); offset += 4;
    } while (value >= limit);
    return value % bound;
  };
  const shuffle = values => {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) { const j = bounded(i + 1); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
  };
  const repeats = shuffle(teams).slice(0, 13), slots = [...teams, ...repeats];
  let arranged, attempts = 0;
  do {
    assert(++attempts <= 10000, 'panel shuffle rejection cap reached');
    arranged = shuffle(slots);
  } while (Array.from({ length: 25 }, (_, i) => arranged.slice(i * 3, i * 3 + 3)).some(trio => new Set(trio.map(t => t.name)).size !== 3));
  return { salt, algorithm, attempts, repeatedTeams: repeats.map(t => t.name).sort(),
    exposureCounts: Object.fromEntries(teams.map(t => [t.name, arranged.filter(v => v.name === t.name).length])),
    cohorts: Array.from({ length: 25 }, (_, i) => ({ id: `holdout-${String(i + 1).padStart(2, '0')}`, opponents: arranged.slice(i * 3, i * 3 + 3) })) };
}

export function loadSources() {
  const files = new Map(), add = file => { const value = record(file); files.set(value.path, value); return value; };
  for (const [file, expected] of Object.entries(pinned)) equal(add(absolute(file)).sha256, expected, `pinned ${file}`);
  const leaFolder = path.resolve(here, '../lea-confirmation'), screenFolder = path.resolve(here, '../bootstrap-designs/screen');
  const lea = read(path.join(leaFolder, 'manifest.json')), bootstrap = read(path.join(screenFolder, 'protocol.json'));
  const bootstrapManifest = read(path.join(screenFolder, 'input-manifest.json'));
  const camper = read(path.resolve(here, '../conditional-camper-screen/manifest.json'));
  for (const item of bootstrapManifest.inputs) {
    const actual = add(path.resolve(screenFolder, item.path));
    equal(actual.sha256, item.sha256, `bootstrap frozen input ${item.path}`); equal(actual.bytes, item.bytes, 'bootstrap input length');
  }
  const poolConfigRecord = lea.configs.find(item => item.id === 'panel-1-m050');
  const poolFile = path.join(leaFolder, poolConfigRecord.configPath);
  equal(add(poolFile).sha256, poolConfigRecord.sha256, 'verified pool config');
  const poolConfig = read(poolFile), byName = new Map();
  for (const team of poolConfig.cohorts.flatMap(c => c.opponents)) {
    const normalized = { name: team.name, warriors: team.warriors.map(file => path.resolve(leaFolder, file)) };
    assert(team.name.startsWith('A_') && team.warriors.length === 2, 'non-senior pool team');
    if (byName.has(team.name)) equal(normalized, byName.get(team.name), 'inconsistent repeated team'); else byName.set(team.name, normalized);
  }
  const teams = [...byName.values()].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  assert(teams.length === 62, 'need exactly 62 verified senior teams');
  const zombies = poolConfig.zombies.map(z => ({ name: z.name, path: path.resolve(leaFolder, z.path) }));
  assert(zombies.length === 4, 'need four frozen Zombies');
  const leaInputs = new Map(lea.inputs.map(item => [absolute(item.path), item]));
  for (const file of [...teams.flatMap(t => t.warriors), ...zombies.map(z => z.path)]) {
    const expected = leaInputs.get(file); assert(expected, 'field input lacks frozen provenance');
    const actual = add(file); equal(actual.sha256, expected.sha256, 'field hash'); equal(actual.bytes, expected.bytes, 'field length');
  }
  const variants = {
    entry_lea: bootstrap.variants.entry_lea.map(file => path.resolve(screenFolder, file)),
    both: bootstrap.variants.both.map(file => path.resolve(screenFolder, file)),
    m049: ['A', 'B'].map(file => path.join(leaFolder, 'build/m049', file)),
    m050: ['A', 'B'].map(file => path.join(leaFolder, 'build/m050', file)),
  };
  for (const arm of arms) for (let i = 0; i < 2; i++) {
    const actual = add(variants[arm][i]);
    const expected = arm === 'entry_lea' || arm === 'both' ? bootstrap.candidateHashes[arm][i] : leaInputs.get(actual.path)?.sha256;
    equal(actual.sha256, expected, `${arm} exact binary`);
  }
  const assembly = bootstrapManifest.sourceBuildManifest;
  for (const item of assembly) {
    equal(add(item.input).sha256, item.sourceSha256, 'assembly source');
    equal(add(item.output).sha256, item.binarySha256, 'assembly binary');
  }
  const engine = add(absolute(lea.engine.path)), java = add(absolute(lea.java.path)), runner = add(absolute(lea.runner.path));
  equal(engine.sha256, lea.engine.sha256, 'base engine'); equal(java.sha256, lea.java.sha256, 'Java'); equal(runner.sha256, lea.runner.sha256, 'original runner');
  const runtimeBase = absolute('tools/engine-acceleration-20261001');
  const runtimeSources = ['runtime/research-batch.mjs', 'runtime/batch-format.mjs', 'runtime/SerialBatchMain.java', 'audit-derived.mjs'].map(file => add(path.join(runtimeBase, file)));
  const runtimeDirectories = ['runtime/classes', 'int87/classes', 'war/combined/classes'].map(file => path.join(runtimeBase, file));
  const runtimeClasses = [];
  function walk(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(file); else { assert(entry.isFile() && entry.name.endsWith('.class'), 'unexpected compiled runtime entry'); runtimeClasses.push(add(file)); }
    }
  }
  runtimeDirectories.forEach(walk);
  assert(runtimeClasses.length === 7, 'expected three wrapper and four reviewed overlay classes');
  const ranges = [...lea.engineSeedRanges, ...lea.excludedPriorEngineSeedRanges, bootstrap.randomness.range, ...bootstrap.randomness.excludedRanges,
    ...camper.protocol.seedRanges.map(r => ({ seed: r.seed, firstWarSeed: r.first, lastWarSeed: r.last }))];
  const impFile = path.resolve(here, '../stosb-imp/screen/manifest.json');
  let imp = { status: 'not yet frozen when holdout source preflight occurred' };
  if (fs.existsSync(impFile)) {
    const item = add(impFile); equal(item.sha256, fs.readFileSync(`${impFile}.sha256`, 'utf8').trim(), 'imp manifest checksum');
    const manifest = read(impFile); ranges.push(...manifest.protocol.seedRanges);
    imp = { status: 'frozen imp ranges excluded', manifest: item };
  }
  const excludedRanges = [...new Map(ranges.map(r => [JSON.stringify(r), r])).values()];
  for (const r of excludedRanges) equal(r, seedRange(r.seed, r.lastWarSeed - r.firstWarSeed + 1), 'known Java seed range');
  return { files: [...files.values()], teams, zombies, variants, engine, java, runner, runtimeSources, runtimeClasses, runtimeDirectories, excludedRanges, imp };
}

export function configsFor(panel, seeds, sources) {
  return arms.map(arm => ({ arm, path: path.join(freeze, `${arm}.json`), config: {
    experimentId: `${suite}-${arm}`, java: sources.java.path, jar: sources.engine.path,
    outputPath: path.join(freeze, 'official-results', `${arm}.json`), runDirectory: path.join(freeze, 'official-runs', arm),
    candidate: { name: 'COD_pair', warriors: ['A', 'B'].map(file => path.join(freeze, 'build', arm, file)) },
    battles: 50, threads: 1, parallel: false, telemetry: false, seeds, cohorts: panel.cohorts, zombies: sources.zombies,
  } }));
}
