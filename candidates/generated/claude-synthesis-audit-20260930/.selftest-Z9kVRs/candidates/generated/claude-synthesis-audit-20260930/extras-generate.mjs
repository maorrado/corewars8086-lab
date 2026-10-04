import fs from 'node:fs';
import path from 'node:path';
import { here, audit, assert, sha, jsonText, relativeRoot, fileRecord } from './protocol.mjs';
import {
  extrasManifestPath, extraBinaryPaths, extraSourcePaths, extraVariants, frozenOriginal, makeExtraConfigs,
} from './extras-protocol.mjs';

assert(process.argv.length === 2, 'usage: node extras-generate.mjs');
const original = frozenOriginal();
const entries = makeExtraConfigs(original.protocol);
for (const destination of [extrasManifestPath, `${extrasManifestPath}.sha256`, ...entries.map(entry => path.join(here, entry.configPath))]) {
  assert(!fs.existsSync(destination), `refusing to overwrite ${destination}`);
}
for (const entry of entries) for (const field of ['outputPath', 'runDirectory']) {
  const destination = path.resolve(here, entry.config[field]);
  assert(!fs.existsSync(destination), `refusing to reuse ${destination}`);
}
const binaries = Object.values(extraBinaryPaths).map(fileRecord);
assert(binaries.every(record => record.bytes > 0), 'empty extra binary');
const manifest = {
  schemaVersion: 1, audit: `${audit}-extras`, frozenAt: new Date().toISOString(),
  parentManifestSha256: original.manifestHash,
  protocol: { phase: 'fresh', seeds: original.protocol.seeds.fresh, battlesPerBlock: 50,
    cohorts: 25, uniqueOpponentTeams: 75, zombies: 4, battlesPerVariant: 5000,
    candidateName: 'COD_pair', threads: 1, parallel: false, telemetry: false },
  variants: extraVariants, binaries, sources: extraSourcePaths.map(fileRecord),
  authoringFiles: ['extras-protocol.mjs', 'extras-generate.mjs'].map(file => fileRecord(relativeRoot(path.join(here, file)))),
  reusedReferenceConfigs: original.manifest.configs.filter(entry => entry.phase === 'fresh'),
  configs: entries.map(({ config, ...metadata }) => ({ ...metadata, sha256: sha(jsonText(config)) })),
  note: 'Added after the original candidate was frozen; same frozen fresh seed/cohort protocol. Reuses original fresh submitted, m049 and m050 results; no rerun of references.',
};
for (const entry of entries) fs.writeFileSync(path.join(here, entry.configPath), jsonText(entry.config), { flag: 'wx' });
const text = jsonText(manifest);
fs.writeFileSync(extrasManifestPath, text, { flag: 'wx' });
fs.writeFileSync(`${extrasManifestPath}.sha256`, `${sha(text)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ manifest: extrasManifestPath, manifestSha256: sha(text), parentManifestSha256: original.manifestHash,
  frozenAt: manifest.frozenAt, configFiles: entries.map(entry => entry.configPath), battlesPerVariant: 5000,
  reusedReferences: ['fresh-submitted', 'fresh-m049', 'fresh-m050'] }));
