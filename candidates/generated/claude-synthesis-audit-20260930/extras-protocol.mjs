import fs from 'node:fs';
import path from 'node:path';
import {
  here, audit, manifestPath, sha, hashFile, rootPath, relativeHere, relativeRoot,
  assert, equal, readJson, readProtocol, makeConfigs,
} from './protocol.mjs';

export const extrasManifestPath = path.join(here, 'extras-manifest.json');
export const extraBinaryPaths = Object.fromEntries(['BombNrgA', 'LeaA', 'LeaB', 'BombPlainA', 'BombPlainNoPadA'].map(name => [name, `build/${audit}/extras/${name}`]));
extraBinaryPaths.BombPlainNoPadA = `build/${audit}/c039-exact/BombPlainNoPadA`;
export const extraSourcePaths = Object.keys(extraBinaryPaths).map(name => relativeRoot(path.join(here, `${name}.asm`)));
export const extraVariants = {
  'bomb-nrg': [extraBinaryPaths.BombNrgA, 'build/final/ChimeraB'],
  'lea-only': [extraBinaryPaths.LeaA, extraBinaryPaths.LeaB],
  'bomb-no-nrg': [extraBinaryPaths.BombPlainA, 'build/final/ChimeraB'],
  'bomb-no-nrg-no-pad': [extraBinaryPaths.BombPlainNoPadA, 'build/final/ChimeraB'],
};

export function frozenOriginal() {
  const manifestBytes = fs.readFileSync(manifestPath);
  const manifestHash = sha(manifestBytes);
  equal(fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim(), manifestHash, 'original manifest hash');
  const manifest = JSON.parse(manifestBytes);
  assert(manifest.audit === audit && manifest.schemaVersion === 1, 'wrong original audit manifest');
  const protocol = readProtocol();
  equal(manifest.protocol.fresh.seeds, protocol.seeds.fresh, 'original fresh seeds');
  for (const record of [...manifest.binaries, ...manifest.sources, ...manifest.authoringFiles, manifest.engine, manifest.java, manifest.runner, manifest.base]) {
    equal(fs.statSync(rootPath(record.path)).size, record.bytes, `${record.path} frozen length`);
    equal(hashFile(rootPath(record.path)), record.sha256, `${record.path} frozen hash`);
  }
  const expected = makeConfigs(protocol);
  for (const entry of expected.filter(entry => entry.phase === 'fresh')) {
    const record = manifest.configs.find(config => config.id === entry.id);
    assert(record, `missing original ${entry.id}`);
    equal(hashFile(path.join(here, entry.configPath)), record.sha256, `original ${entry.id} config hash`);
  }
  return { manifest, manifestHash, protocol };
}

export function makeExtraConfigs(protocol) {
  const template = makeConfigs(protocol).find(entry => entry.id === 'fresh-submitted').config;
  return Object.entries(extraVariants).map(([variant, warriors]) => {
    const id = `fresh-${variant}`;
    const config = structuredClone(template);
    config.experimentId = `${audit}-${id}`;
    config.outputPath = relativeHere(`experiments/${audit}/${id}.json`);
    config.runDirectory = relativeHere(`build/official-runs/${audit}/${id}`);
    config.candidate = { name: 'COD_pair', warriors: warriors.map(relativeHere) };
    return { id, phase: 'extras', variant, configPath: `${id}.json`, observedTeam: 'COD_pair', totalBattles: 5000, config };
  });
}

export function readExtrasManifest(originalHash, protocol) {
  const bytes = fs.readFileSync(extrasManifestPath);
  const extrasHash = sha(bytes);
  equal(fs.readFileSync(`${extrasManifestPath}.sha256`, 'utf8').trim(), extrasHash, 'extras manifest hash');
  const manifest = readJson(extrasManifestPath);
  assert(manifest.schemaVersion === 1 && manifest.audit === `${audit}-extras`, 'wrong extras manifest');
  equal(manifest.parentManifestSha256, originalHash, 'extras parent manifest');
  equal(manifest.variants, extraVariants, 'extras variants');
  equal(manifest.protocol.seeds, protocol.seeds.fresh, 'extras fresh seeds');
  equal(manifest.binaries.map(record => record.path), Object.values(extraBinaryPaths), 'extras binary paths');
  equal(manifest.sources.map(record => record.path), extraSourcePaths, 'extras source paths');
  equal(manifest.authoringFiles.map(record => record.path), ['extras-protocol.mjs', 'extras-generate.mjs'].map(file => relativeRoot(path.join(here, file))), 'extras authoring paths');
  return { manifest, hash: extrasHash };
}
