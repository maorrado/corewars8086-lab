import fs from 'node:fs';
import path from 'node:path';
import {
  here, root, audit, manifestPath, sha, jsonText, relativeRoot, rootPath, assert,
  variants, basePath, runnerPath, javaPath, enginePath, readProtocol, makeConfigs, inputPaths, fileRecord,
} from './protocol.mjs';

// This freezes the already assembled candidate. It never assembles or runs Java.
assert(process.argv.length === 2, 'usage: node candidates/generated/claude-synthesis-audit-20260930/generate.mjs');
const protocol = readProtocol();
const entries = makeConfigs(protocol);
const destinations = [manifestPath, `${manifestPath}.sha256`, ...entries.map(entry => path.join(here, entry.configPath))];
for (const destination of destinations) assert(!fs.existsSync(destination), `refusing to overwrite ${destination}`);
for (const entry of entries) {
  for (const field of ['outputPath', 'runDirectory']) {
    const destination = path.resolve(here, entry.config[field]);
    assert(!fs.existsSync(destination), `refusing to reuse ${destination}`);
  }
}
const sources = ['SubmittedA.asm', 'SubmittedB.asm'].map(file => relativeRoot(path.join(here, file)));
const binaryFiles = inputPaths(protocol).map(fileRecord);
assert(binaryFiles.length === 160, 'expected 6 candidate/control binaries + 150 opponent binaries + 4 Zombies');
assert(Object.values(variants).flat().every(file => binaryFiles.find(record => record.path === file)?.bytes > 0), 'empty candidate/control binary');
const manifest = {
  schemaVersion: 1, audit, frozenAt: new Date().toISOString(), root,
  protocol: {
    soloName: 'COD_pair', threads: 1, parallel: false, telemetry: false,
    cohorts: 25, uniqueOpponentTeams: 75, zombies: 4,
    screen: { seeds: protocol.seeds.screen, battlesPerBlock: 50, battlesPerVariant: 2500 },
    fresh: { seeds: protocol.seeds.fresh, battlesPerBlock: 50, battlesPerVariant: 5000 },
    duels: { seeds: protocol.seeds.duel, battlesPerOrientationSeed: 125, orientations: 2, battlesPerControl: 1000 },
  },
  engine: fileRecord(enginePath), java: fileRecord(javaPath), runner: fileRecord(runnerPath),
  base: fileRecord(basePath),
  authoringFiles: ['seeds.json', 'protocol.mjs', 'generate.mjs'].map(file => fileRecord(relativeRoot(path.join(here, file)))),
  sources: sources.map(fileRecord), binaries: binaryFiles, variants,
  configs: entries.map(({ config, ...metadata }) => ({ ...metadata, sha256: sha(jsonText(config)) })),
  metric: 'Surviving-warrior score share per battle; aggregate scores do not identify battle wins.',
  uncertainty: 'Paired cohort-seed block deltas; approximate t intervals for block means, cohort means and seed means. No independent per-battle observations are assumed.',
};
// All validation happens before the first exclusive write; existing files are never overwritten.
for (const entry of entries) fs.writeFileSync(path.join(here, entry.configPath), jsonText(entry.config), { flag: 'wx' });
const manifestText = jsonText(manifest);
fs.writeFileSync(manifestPath, manifestText, { flag: 'wx' });
fs.writeFileSync(`${manifestPath}.sha256`, `${sha(manifestText)}\n`, { flag: 'wx' });
console.log(JSON.stringify({
  manifest: manifestPath, manifestSha256: sha(manifestText), frozenAt: manifest.frozenAt,
  configFiles: entries.map(entry => entry.configPath), binaryCount: binaryFiles.length,
  battlesPerVariant: { screen: 2500, fresh: 5000 }, duelBattlesPerControl: 1000,
}));
