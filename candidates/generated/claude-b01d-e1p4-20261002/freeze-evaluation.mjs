import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const experimentDir = path.join(repo, 'experiments/b01d-e1p4-validation-20261002');
const configDir = path.join(experimentDir, 'configs');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const shaFile = file => sha(fs.readFileSync(file));
if (fs.existsSync(configDir)) throw new Error(`refusing to overwrite ${configDir}`);
const template = JSON.parse(fs.readFileSync(path.join(repo, 'config-2025-all-template.json'), 'utf8'));
const sourceManifest = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'source-manifest.json'), 'utf8'));
const buildDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'build');
const compileManifest = JSON.parse(fs.readFileSync(path.join(buildDir, 'manifest.json'), 'utf8'));
const baselineExpected = sourceManifest.sourceOfTruth.e1p4BinarySha256;
const variants = {
  control: ['control-A', 'control-B'],
  a_decoy: ['a_decoy-A', 'a_decoy-B'],
  b_band_shift: ['b_band_shift-A', 'b_band_shift-B'],
  b01d: ['b01d-A', 'b01d-B'],
};
const binaries = {};
for (const [variant, files] of Object.entries(variants)) {
  binaries[variant] = files.map((name, i) => {
    const file = path.join(buildDir, name);
    if (!fs.existsSync(file)) throw new Error(`missing compiled binary ${file}`);
    const record = { path: file, bytes: fs.statSync(file).size, sha256: shaFile(file) };
    if (variant === 'control' && record.sha256 !== baselineExpected[i]) {
      throw new Error(`control ${i + 1} does not reproduce frozen e1p4: ${record.sha256}`);
    }
    const hasADecoy = variant === 'a_decoy' || variant === 'b01d';
    if (record.bytes !== (i === 0 ? (hasADecoy ? 192 : 187) : 115)) {
      throw new Error(`${variant} warrior ${i + 1} has unexpected size ${record.bytes}`);
    }
    return record;
  });
}

const engineJar = path.join(repo, 'repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar');
const java = path.join(repo, 'tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe');
if (!fs.existsSync(engineJar) || !fs.existsSync(java)) throw new Error('required deterministic jar or Java runtime is missing');
const engineHash = shaFile(engineJar);
if (engineHash !== '31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d') throw new Error(`unexpected deterministic engine hash ${engineHash}`);

const opponentMap = new Map();
for (const cohort of template.cohorts) {
  for (const opponent of cohort.opponents) {
    if (opponentMap.has(opponent.name)) throw new Error(`duplicate opponent team ${opponent.name}`);
    opponentMap.set(opponent.name, {
      name: opponent.name,
      warriors: opponent.warriors.map(file => path.resolve(repo, file)),
    });
  }
}
const opponents = [...opponentMap.values()];
if (opponents.length !== 75) throw new Error(`expected all 75 official 2025 teams, got ${opponents.length}`);
const opponentHashes = {};
for (const opponent of opponents) {
  if (opponent.warriors.length !== 2) throw new Error(`${opponent.name} must have two warriors`);
  for (const warrior of opponent.warriors) {
    if (!fs.existsSync(warrior)) throw new Error(`missing opponent file ${warrior}`);
    opponentHashes[warrior] = { bytes: fs.statSync(warrior).size, sha256: shaFile(warrior) };
  }
}
const zombies = template.zombies.map(zombie => ({ name: zombie.name, path: path.resolve(repo, zombie.path) }));
if (zombies.length !== 4) throw new Error(`expected four zombies, got ${zombies.length}`);
for (const zombie of zombies) if (!fs.existsSync(zombie.path)) throw new Error(`missing zombie ${zombie.path}`);

fs.mkdirSync(configDir, { recursive: true });
fs.mkdirSync(path.join(experimentDir, 'results'), { recursive: true });
fs.mkdirSync(path.join(experimentDir, 'runs'), { recursive: true });
const arms = Object.keys(variants);
const panels = [];
const configs = [];
function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
for (let panel = 1; panel <= 16; panel++) {
  const tag = String(panel).padStart(2, '0');
  const seed = `b01d-e1p4-full-2025-p${tag}-${crypto.randomBytes(16).toString('hex')}`;
  const shuffledOpponents = shuffle(opponents);
  const cohorts = [];
  for (let i = 0; i < shuffledOpponents.length; i += 3) {
    cohorts.push({
      id: `p${tag}-c${String(i / 3 + 1).padStart(2, '0')}`,
      opponents: shuffledOpponents.slice(i, i + 3),
    });
  }
  if (cohorts.length !== 25 || cohorts.some(cohort => cohort.opponents.length !== 3)) throw new Error(`panel ${tag} is not 25 x 3 opponents`);
  const executionOrder = shuffle(arms);
  panels.push({ panel, seed, executionOrder, cohorts: cohorts.map(cohort => ({ id: cohort.id, teams: cohort.opponents.map(x => x.name) })) });
  for (const arm of executionOrder) {
    const experimentId = `b01d-e1p4-p${tag}-${arm}`;
    const config = {
      experimentId,
      java,
      jar: engineJar,
      candidate: { name: `COD_${arm}`, warriors: binaries[arm].map(x => x.path) },
      zombies,
      cohorts,
      battles: 50,
      seeds: [seed],
      threads: 4,
      outputPath: path.join(experimentDir, 'results', `${experimentId}.json`),
      runDirectory: path.join(experimentDir, 'runs', experimentId),
    };
    const configPath = path.join(configDir, `${experimentId}.json`);
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, { flag: 'wx' });
    configs.push({ panel, arm, path: configPath, sha256: shaFile(configPath), battles: 1250 });
  }
}
const frozen = {
  status: 'FROZEN_BEFORE_RUN',
  objective: 'Paired fresh-seed comparison of exact e1p4 and the two b01d components plus their combination against all 75 official 2025 teams.',
  design: {
    panels: 16,
    arms,
    opponentTeams: opponents.length,
    groupsPerBattle: 4,
    opponentsPerBattle: 3,
    zombiesPerBattle: 4,
    battlesPerCohort: 50,
    cohortsPerPanel: 25,
    battlesPerArm: 20000,
    totalBattles: 80000,
    pairing: 'Each panel has a new seed and a fresh random partition of the complete 75-team field; all four arms share the exact same panel seed and cohorts.',
    metric: 'Candidate team points divided by battles, averaged over all 75-team field contexts.',
    components: 'e1p4 control; A decoy only; B band shift only; combined b01d.',
  },
  engineJar: { path: engineJar, sha256: engineHash },
  java,
  candidates: binaries,
  opponentHashes,
  zombies: zombies.map(zombie => ({ ...zombie, sha256: shaFile(zombie.path), bytes: fs.statSync(zombie.path).size })),
  sourceManifestSha256: shaFile(path.join(path.dirname(fileURLToPath(import.meta.url)), 'source-manifest.json')),
  compileManifestSha256: shaFile(path.join(buildDir, 'manifest.json')),
  panels,
  configs,
};
const manifestPath = path.join(experimentDir, 'manifest.json');
fs.writeFileSync(manifestPath, `${JSON.stringify(frozen, null, 2)}\n`, { flag: 'wx' });
fs.writeFileSync(`${manifestPath}.sha256`, `${shaFile(manifestPath)}\n`, { flag: 'wx' });
console.log(JSON.stringify({
  manifestPath,
  manifestSha256: shaFile(manifestPath),
  engineSha256: engineHash,
  candidates: Object.fromEntries(Object.entries(binaries).map(([key, value]) => [key, value.map(x => ({ bytes: x.bytes, sha256: x.sha256 }))])),
  panels: panels.length,
  opponentTeams: opponents.length,
  configs: configs.length,
}, null, 2));
