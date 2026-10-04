// No process launches. Entropy is drawn only by an explicit --freeze invocation.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { here, freeze, suite, arms, assert, equal, sha, hashFile, record, check, read, text,
  design, decision, algorithm, seedRange, overlaps, panelFromSalt, loadSources, configsFor } from './protocol.mjs';

const mode = process.argv[2];
assert(process.argv.length === 3 && ['--preflight', '--freeze', '--verify'].includes(mode), 'usage: node generate.mjs --preflight|--freeze|--verify');
const manifestPath = path.join(freeze, 'manifest.json');
if (mode === '--verify') {
  equal(hashFile(manifestPath), fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim(), 'holdout manifest checksum');
  const manifest = read(manifestPath);
  equal(manifest.design, design, 'design'); equal(manifest.decision, decision, 'decision gate');
  manifest.files.forEach(check);
  equal(manifest.panel, panelFromSalt(manifest.randomness.panelSalt, manifest.teams), 'deterministic panel reconstruction');
  console.log(JSON.stringify({ status: 'verified; no entropy/outcomes/processes', files: manifest.files.length, manifestSha256: hashFile(manifestPath) }));
  process.exit(0);
}
assert(!fs.existsSync(freeze), 'Refusing existing frozen directory, including a failed prior entropy draw');
const sources = loadSources();
const authoring = ['protocol.mjs', 'generate.mjs', 'analyze.mjs', 'README.md'].map(file => record(path.join(here, file)));
const preflight = { suite, design, decision, sourceFiles: sources.files.length, imp: sources.imp,
  proposedConfigs: arms.map(arm => path.join(freeze, `${arm}.json`)), entropyDrawn: false };
if (mode === '--preflight') { console.log(text(preflight)); process.exit(0); }

// Claim before drawing. Any interrupted attempt remains visible and cannot be
// silently rerun. Draw all values once; collisions stop, without a redraw.
fs.mkdirSync(freeze);
const randomness = { drawnAt: new Date().toISOString(), provenance: 'One crypto.randomBytes(32) panel salt and two crypto.randomBytes(12) seed suffixes, after input preflight; no automatic redraw or outcome-dependent selection.',
  panelSalt: crypto.randomBytes(32).toString('hex'),
  seeds: [1, 2].map(i => `bootstrap-holdout-20261001-${i}-${crypto.randomBytes(12).toString('hex')}`),
  excludedRanges: sources.excludedRanges, imp: sources.imp };
randomness.seedRanges = randomness.seeds.map(seed => seedRange(seed, 50));
randomness.collisions = randomness.seedRanges.flatMap((range, index) => [...sources.excludedRanges, ...randomness.seedRanges.slice(0, index)]
  .filter(prior => overlaps(range, prior)).map(prior => ({ range, prior })));
fs.writeFileSync(path.join(freeze, 'randomness.json'), text(randomness), { flag: 'wx' });
assert(randomness.collisions.length === 0, 'Seed collision recorded; stop without automatic redraw');
const panel = panelFromSalt(randomness.panelSalt, sources.teams);
const copies = [];
for (const arm of arms) for (let i = 0; i < 2; i++) {
  const source = sources.variants[arm][i], target = path.join(freeze, 'build', arm, ['A', 'B'][i]);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
  equal(hashFile(target), hashFile(source), `${arm} immutable copy`);
  copies.push({ source: record(source), frozen: record(target) });
}
const configs = configsFor(panel, randomness.seeds, sources);
for (const item of configs) fs.writeFileSync(item.path, text(item.config), { flag: 'wx' });
[...sources.files, ...authoring].forEach(check);
const manifest = { schemaVersion: 1, suite, frozenAt: new Date().toISOString(), design, decision, algorithm, randomness, panel,
  teams: sources.teams, zombies: sources.zombies, sourceVariants: sources.variants, copies,
  engine: sources.engine, java: sources.java, runner: sources.runner,
  researchRuntime: { sources: sources.runtimeSources, classes: sources.runtimeClasses, directories: sources.runtimeDirectories,
    mode: 'isolated-persistent-serial', requiredJvmOptions: [], originalEngineFinalConfirmationRequired: true },
  configs: configs.map(item => ({ arm: item.arm, ...record(item.path), battles: 2500 })),
  files: [...sources.files, ...authoring, ...copies.map(item => item.frozen), record(path.join(freeze, 'randomness.json')), ...configs.map(item => record(item.path))],
  interpretation: decision.interpretation };
const serialized = text(manifest);
fs.writeFileSync(manifestPath, serialized, { flag: 'wx' });
fs.writeFileSync(`${manifestPath}.sha256`, `${sha(serialized)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: 'frozen; no battles launched', manifest: manifestPath, manifestSha256: sha(serialized),
  seedRanges: randomness.seedRanges, repeatedTeams: panel.repeatedTeams, configs: configs.map(c => c.path), design }));
