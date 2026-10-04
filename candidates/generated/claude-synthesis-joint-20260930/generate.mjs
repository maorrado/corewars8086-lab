import fs from 'node:fs';
import path from 'node:path';
import {
  here, audit, manifestPath, priorManifestPath, priorManifestHash, sha, jsonText,
  assert, relativeRoot, fileRecord, variants, readProtocol, makeConfigs,
} from './protocol.mjs';

assert(process.argv.length === 2, 'usage: node candidates/generated/claude-synthesis-joint-20260930/generate.mjs');
const protocol = readProtocol();
const entries = makeConfigs(protocol);
for (const destination of [manifestPath, `${manifestPath}.sha256`, ...entries.map(entry => path.join(here, entry.configPath))]) {
  assert(!fs.existsSync(destination), `refusing to overwrite ${destination}`);
}
for (const entry of entries) for (const field of ['outputPath', 'runDirectory']) {
  const destination = path.resolve(here, entry.config[field]);
  assert(!fs.existsSync(destination), `refusing to reuse ${destination}`);
}
const manifest = {
  schemaVersion: 1, audit, frozenAt: new Date().toISOString(),
  priorManifest: { path: priorManifestPath, sha256: priorManifestHash },
  protocol: { publishedTeams: 75, contenders: 3, orientations: 3, seeds: protocol.seeds,
    battlesPerBlock: 10, battlesPerOrientation: 2250, battlesTotal: 6750,
    threads: 1, parallel: false, telemetry: false,
    seedRanges: protocol.seedRanges, previousSeedRanges: protocol.previousSeedRanges },
  variants, binaries: protocol.prior.binaries, sources: protocol.prior.sources,
  engine: protocol.prior.engine, java: protocol.prior.java, runner: protocol.prior.runner, base: protocol.prior.base,
  authoringFiles: ['seeds.json', 'protocol.mjs', 'generate.mjs'].map(file => fileRecord(relativeRoot(path.join(here, file)))),
  configs: entries.map(({ config, ...metadata }) => ({ ...metadata, sha256: sha(jsonText(config)) })),
  interpretation: 'All three contenders appear together against one published field team in every battle. Three cyclic name/order mappings give each contender each COD slot once; this is not all six permutations. Scores are points per battle, not win rates.',
};
for (const entry of entries) fs.writeFileSync(path.join(here, entry.configPath), jsonText(entry.config), { flag: 'wx' });
const text = jsonText(manifest);
fs.writeFileSync(manifestPath, text, { flag: 'wx' });
fs.writeFileSync(`${manifestPath}.sha256`, `${sha(text)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ manifest: manifestPath, manifestSha256: sha(text), frozenAt: manifest.frozenAt,
  configFiles: entries.map(entry => entry.configPath), battlesPerOrientation: 2250, battlesTotal: 6750,
  newSeedRanges: protocol.seedRanges, disjointFromPriorAudit: true }));
