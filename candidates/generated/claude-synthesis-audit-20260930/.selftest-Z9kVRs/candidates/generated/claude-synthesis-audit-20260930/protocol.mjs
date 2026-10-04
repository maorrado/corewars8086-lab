import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(here, '../../..');
export const audit = 'claude-synthesis-audit-20260930';
export const manifestPath = path.join(here, 'manifest.json');
export const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
export const hashFile = (file) => sha(fs.readFileSync(file));
export const jsonText = (value) => `${JSON.stringify(value, null, 2)}\n`;
export const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
export const slash = (value) => value.split(path.sep).join('/');
export const rootPath = (file) => path.resolve(root, file);
export const relativeRoot = (file) => slash(path.relative(root, file));
export const relativeHere = (file) => slash(path.relative(here, rootPath(file)));
export const assert = (condition, message) => { if (!condition) throw new Error(message); };
export const equal = (actual, expected, label) => assert(JSON.stringify(actual) === JSON.stringify(expected), `${label}: mismatch`);
export const variants = {
  submitted: [`build/${audit}/SubmittedA`, `build/${audit}/SubmittedB`],
  m049: ['build/chimera-zero-di-elision/b_pad_a', 'build/chimera-zero-di-elision/a_pad_b'],
  m050: ['build/final/ChimeraA', 'build/final/ChimeraB'],
};
export const basePath = 'config-final-2025-m049-once.json';
export const runnerPath = 'official-benchmark.mjs';
export const javaPath = 'tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe';
export const enginePath = 'repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar';
export const expectedHashes = {
  [basePath]: '5fec9af2cd632d5c5dcbc095304168e5fe1c15e97d7893db8a5820ae3c1d481d',
  [runnerPath]: '6618a0d865be0b87389056e09a972fcef88f43d4d2e9f2a9f48bfc8a7ba2d786',
  [enginePath]: '31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d',
  [variants.m049[0]]: '106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973',
  [variants.m049[1]]: '7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77',
  [variants.m050[0]]: '0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44',
  [variants.m050[1]]: '06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782',
};

export function readProtocol() {
  for (const [file, expected] of Object.entries(expectedHashes)) {
    equal(hashFile(rootPath(file)), expected, `frozen reference ${file}`);
  }
  const base = readJson(rootPath(basePath));
  const seeds = readJson(path.join(here, 'seeds.json'));
  equal(seeds.screen, ['all-001', 'all-002'], 'screen seeds');
  assert(seeds.fresh.length === 4 && seeds.duel.length === 4, 'need four fresh field and four duel seeds');
  const allSeeds = [...seeds.screen, ...seeds.fresh, ...seeds.duel];
  assert(new Set(allSeeds).size === 10 && allSeeds.every(seed => /^[A-Za-z0-9_.-]+$/.test(seed)), 'seeds must be distinct safe identifiers');
  assert(base.cohorts.length === 25 && base.cohorts.every(cohort => cohort.opponents.length === 3), 'expected 25 cohorts of three opponents');
  const teams = base.cohorts.flatMap(cohort => cohort.opponents);
  assert(teams.length === 75 && new Set(teams.map(team => team.name)).size === 75, 'expected exactly 75 unique opponents');
  assert(base.zombies.length === 4, 'expected four Zombies');
  const cohorts = base.cohorts.map(cohort => ({
    id: cohort.id,
    opponents: cohort.opponents.map(team => ({ name: team.name, warriors: team.warriors.map(relativeHere) })),
  }));
  const zombies = base.zombies.map(zombie => ({ name: zombie.name, path: relativeHere(zombie.path) }));
  return { base, seeds, cohorts, zombies };
}

export function makeConfigs(protocol) {
  const entries = [];
  const team = (variant, name = 'COD_pair') => ({ name, warriors: variants[variant].map(relativeHere) });
  function add(id, phase, config, metadata) {
    const configPath = `${id}.json`;
    const output = `experiments/${audit}/${id}.json`;
    const run = `build/official-runs/${audit}/${id}`;
    entries.push({
      id, phase, configPath, ...metadata,
      config: {
        experimentId: `${audit}-${id}`,
        java: relativeHere(javaPath), jar: relativeHere(enginePath),
        outputPath: relativeHere(output), runDirectory: relativeHere(run),
        threads: 1, parallel: false, telemetry: false,
        ...config, zombies: protocol.zombies,
      },
    });
  }
  for (const phase of ['screen', 'fresh']) {
    for (const variant of Object.keys(variants)) {
      add(`${phase}-${variant}`, phase, {
        candidate: team(variant), battles: 50, seeds: protocol.seeds[phase], cohorts: protocol.cohorts,
      }, { variant, observedTeam: 'COD_pair', totalBattles: phase === 'screen' ? 2500 : 5000 });
    }
  }
  for (const control of ['m049', 'm050']) {
    for (const orientation of ['submitted-first', 'submitted-second']) {
      const first = orientation === 'submitted-first' ? 'submitted' : control;
      const second = orientation === 'submitted-first' ? control : 'submitted';
      add(`duel-${control}-${orientation}`, 'duels', {
        candidate: team(first, 'COD_A'), battles: 125, seeds: protocol.seeds.duel,
        cohorts: [{ id: `duel-${control}`, opponents: [team(second, 'COD_B')] }],
      }, {
        control, orientation, observedTeam: first === 'submitted' ? 'COD_A' : 'COD_B',
        controlTeam: first === 'submitted' ? 'COD_B' : 'COD_A', totalBattles: 500,
      });
    }
  }
  return entries;
}

export function inputPaths(protocol) {
  return [...new Set([
    ...Object.values(variants).flat(),
    ...protocol.base.cohorts.flatMap(cohort => cohort.opponents.flatMap(team => team.warriors)),
    ...protocol.base.zombies.map(zombie => zombie.path),
  ])];
}

export function fileRecord(file) {
  return { path: file, bytes: fs.statSync(rootPath(file)).size, sha256: hashFile(rootPath(file)) };
}
