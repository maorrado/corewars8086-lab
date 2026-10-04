import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const experimentDir = path.join(repo, 'experiments/e1p4-ablation-20261002');
if (fs.existsSync(experimentDir)) throw new Error(`refusing to overwrite ${experimentDir}`);
const template = JSON.parse(fs.readFileSync(path.join(repo, 'config-2025-all-template.json'), 'utf8'));
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const armSpecs = {
  e1p3: {
    warriors: ['candidates/generated/claude-e1p3-check-20261001/build/e1p3A', 'candidates/generated/claude-e1p3-check-20261001/build/e1p3B'],
    hashes: ['caced989dd55b98a749d5dc3a2d20d533e14013affb08b84572c9f76f1a05117', '99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b'],
  },
  callcam: {
    warriors: ['candidates/generated/e1p4-ablation-20261002/build-callcam/e1p3callcam-A', 'candidates/generated/e1p4-ablation-20261002/build-callcam/e1p3callcam-B'],
    hashes: ['ce0b580bcd5aa8998e684092592e95add92a27d0644cc17e8da6f8b19991cd09', '632d2b0aef76402ca40aa5752b7dc4f849e70f6dac88e4804df22ddc32ebae29'],
  },
  payloadcam: {
    warriors: ['candidates/generated/e1p4-ablation-20261002/build-payloadcam/e1p3payloadcam-A', 'candidates/generated/e1p4-ablation-20261002/build-payloadcam/e1p3payloadcam-B'],
    hashes: ['43e0a9a716e27118404d50e9bf3d1dda74523e88d1220125e5628858308284b4', '7698520e25df5aac2225e7bec2a8e8964a5a21e91603dd1750f5fdd1a7577df4'],
  },
  e1p4: {
    warriors: ['candidates/generated/e1p4-antihunter-20261001/build/e1p4A', 'candidates/generated/e1p4-antihunter-20261001/build/e1p4B'],
    hashes: ['99192c673e5af394ed8194932b52b4f18f092804384f38d1bb2828b189c76b93', 'd307b92097ac68ce6073adc1e34917b2f51c0c396235c918dfc913cee7393354'],
  },
};
const candidates = {};
for (const [arm, spec] of Object.entries(armSpecs)) {
  candidates[arm] = spec.warriors.map((relative, index) => {
    const absolute = path.resolve(repo, relative);
    const bytes = fs.readFileSync(absolute);
    const hash = sha(bytes);
    if (hash !== spec.hashes[index]) throw new Error(`${arm} warrior ${index + 1} hash mismatch: ${hash}`);
    return { path: absolute, bytes: bytes.length, sha256: hash };
  });
}
const opponentMap = new Map();
for (const cohort of template.cohorts) for (const opponent of cohort.opponents) {
  if (opponentMap.has(opponent.name)) throw new Error(`duplicate team ${opponent.name}`);
  opponentMap.set(opponent.name, {
    name: opponent.name,
    warriors: opponent.warriors.map(relative => path.resolve(repo, relative)),
  });
}
const opponents = [...opponentMap.values()];
if (opponents.length !== 75) throw new Error(`expected 75 official teams, got ${opponents.length}`);
const opponentHashes = {};
for (const team of opponents) for (const file of team.warriors) {
  const bytes = fs.readFileSync(file);
  opponentHashes[file] = { bytes: bytes.length, sha256: sha(bytes) };
}
const zombies = template.zombies.map(zombie => ({ name: zombie.name, path: path.resolve(repo, zombie.path) }));
if (zombies.length !== 4) throw new Error(`expected four 2025 zombies, got ${zombies.length}`);

function shuffle(values) {
  const output = [...values];
  for (let index = output.length - 1; index > 0; index--) {
    const swap = crypto.randomInt(index + 1);
    [output[index], output[swap]] = [output[swap], output[index]];
  }
  return output;
}

fs.mkdirSync(path.join(experimentDir, 'configs'), { recursive: true });
fs.mkdirSync(path.join(experimentDir, 'results'), { recursive: true });
fs.mkdirSync(path.join(experimentDir, 'runs'), { recursive: true });
const panels = [];
const configs = [];
for (let panel = 1; panel <= 8; panel++) {
  const tag = String(panel).padStart(2, '0');
  const seed = `e1p4-ablation-2025-p${tag}-${crypto.randomBytes(16).toString('hex')}`;
  const shuffled = shuffle(opponents);
  const cohorts = [];
  for (let index = 0; index < shuffled.length; index += 3) {
    const group = shuffled.slice(index, index + 3);
    if (group.length !== 3) throw new Error(`incomplete opponent group in panel ${tag}`);
    cohorts.push({ id: `p${tag}-c${String(cohorts.length + 1).padStart(2, '0')}`, opponents: group });
  }
  if (cohorts.length !== 25) throw new Error(`expected 25 cohorts in panel ${tag}`);
  panels.push({ panel, seed, cohorts: cohorts.map(cohort => ({ id: cohort.id, teams: cohort.opponents.map(team => team.name) })) });
  for (const [arm, warriors] of Object.entries(candidates)) {
    const experimentId = `e1p4-ablation-20261002-p${tag}-${arm}`;
    const config = {
      experimentId,
      java: path.join(repo, 'tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe'),
      jar: path.join(repo, 'repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar'),
      candidate: { name: `COD_${arm}`, warriors: warriors.map(input => input.path) },
      zombies,
      cohorts,
      battles: 50,
      seeds: [seed],
      threads: 4,
      outputPath: path.join(experimentDir, 'results', `${experimentId}.json`),
      runDirectory: path.join(experimentDir, 'runs', experimentId),
    };
    const configPath = path.join(experimentDir, 'configs', `${experimentId}.json`);
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, { flag: 'wx' });
    configs.push({ arm, panel, path: configPath, sha256: sha(fs.readFileSync(configPath)), battles: 1250 });
  }
}
const engineJar = path.join(repo, 'repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar');
const manifest = {
  status: 'FROZEN_BEFORE_RUN',
  objective: 'Ablate the two byte-level changes from e1p3 to e1p4: change only the indirect far-call ModRM camouflage, change only the STOSW payload word, or use both.',
  design: {
    panels: 8,
    arms: Object.keys(candidates),
    opponentTeams: opponents.length,
    opponentGroupsPerBattle: 3,
    zombiesPerBattle: zombies.length,
    battlesPerCohort: 50,
    cohortsPerPanel: 25,
    battlesPerArm: 10000,
    totalBattles: 40000,
    pairing: 'All four candidates receive the same random partition and fresh seed within each panel; every one of the 75 teams appears once per panel.',
    primaryMetric: 'Candidate team score per battle over the complete 2025 pool.',
  },
  engineJar: { path: engineJar, sha256: sha(fs.readFileSync(engineJar)) },
  candidates,
  opponentHashes,
  zombies,
  panels,
  configs,
};
const manifestPath = path.join(experimentDir, 'manifest.json');
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
fs.writeFileSync(`${manifestPath}.sha256`, `${sha(fs.readFileSync(manifestPath))}\n`, { flag: 'wx' });
console.log(JSON.stringify({ experimentDir, manifestSha256: sha(fs.readFileSync(manifestPath)), configCount: configs.length, design: manifest.design }, null, 2));
