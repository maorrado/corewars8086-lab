import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const experimentDir = process.argv[2]
  ? path.resolve(repo, process.argv[2])
  : path.join(repo, 'experiments/e1p4-general-confirmation-20261002');
const configDir = path.join(experimentDir, 'configs');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
if (fs.existsSync(experimentDir)) throw new Error(`refusing to overwrite ${experimentDir}`);

const template = JSON.parse(fs.readFileSync(path.join(repo, 'config-2025-all-template.json'), 'utf8'));
const engineJar = path.join(repo, 'repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar');
const java = path.join(repo, 'tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe');
const armSpecs = {
  e1p3: {
    warriors: ['candidates/generated/claude-e1p3-check-20261001/build/e1p3A', 'candidates/generated/claude-e1p3-check-20261001/build/e1p3B'],
    hashes: ['caced989dd55b98a749d5dc3a2d20d533e14013affb08b84572c9f76f1a05117', '99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b'],
  },
  e1p4: {
    warriors: ['candidates/generated/e1p4-antihunter-20261001/build/e1p4A', 'candidates/generated/e1p4-antihunter-20261001/build/e1p4B'],
    hashes: ['99192c673e5af394ed8194932b52b4f18f092804384f38d1bb2828b189c76b93', 'd307b92097ac68ce6073adc1e34917b2f51c0c396235c918dfc913cee7393354'],
  },
};
const candidates = {};
for (const [arm, spec] of Object.entries(armSpecs)) {
  candidates[arm] = spec.warriors.map((relative, i) => {
    const file = path.resolve(repo, relative);
    const bytes = fs.readFileSync(file);
    const hash = sha(bytes);
    if (hash !== spec.hashes[i]) throw new Error(`${arm} binary ${i + 1} hash mismatch: ${hash}`);
    return { path: file, bytes: bytes.length, sha256: hash };
  });
}

const opponentMap = new Map();
for (const cohort of template.cohorts) for (const opponent of cohort.opponents) {
  if (opponentMap.has(opponent.name)) throw new Error(`duplicate team ${opponent.name}`);
  const warriors = opponent.warriors.map(relative => path.resolve(repo, relative));
  if (warriors.length !== 2) throw new Error(`${opponent.name} is not a complete pair`);
  opponentMap.set(opponent.name, { name: opponent.name, warriors });
}
const opponents = [...opponentMap.values()];
if (opponents.length !== 75) throw new Error(`expected all 75 official 2025 teams; found ${opponents.length}`);
const opponentHashes = {};
for (const team of opponents) for (const file of team.warriors) {
  const bytes = fs.readFileSync(file);
  opponentHashes[file] = { bytes: bytes.length, sha256: sha(bytes) };
}
const zombies = template.zombies.map(zombie => ({ name: zombie.name, path: path.resolve(repo, zombie.path) }));
if (zombies.length !== 4) throw new Error(`expected four official zombies; found ${zombies.length}`);
for (const zombie of zombies) fs.accessSync(zombie.path, fs.constants.R_OK);
fs.mkdirSync(configDir, { recursive: true });
fs.mkdirSync(path.join(experimentDir, 'results'), { recursive: true });
fs.mkdirSync(path.join(experimentDir, 'runs'), { recursive: true });

function shuffle(values) {
  const output = [...values];
  for (let i = output.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}
const panels = [];
const configs = [];
for (let panel = 1; panel <= 16; panel++) {
  const tag = String(panel).padStart(2, '0');
  const seed = `general-confirm-2025-p${tag}-${crypto.randomBytes(16).toString('hex')}`;
  const shuffled = shuffle(opponents);
  const cohorts = [];
  for (let i = 0; i < shuffled.length; i += 3) {
    cohorts.push({ id: `p${tag}-c${String(i / 3 + 1).padStart(2, '0')}`, opponents: shuffled.slice(i, i + 3) });
  }
  if (cohorts.length !== 25 || cohorts.some(cohort => cohort.opponents.length !== 3)) throw new Error(`bad panel ${tag}`);
  panels.push({ panel, seed, cohorts: cohorts.map(cohort => ({ id: cohort.id, teams: cohort.opponents.map(team => team.name) })) });
  for (const [arm, warriorInputs] of Object.entries(candidates)) {
    const experimentId = `e1p3-e1p4-confirm-20261002-p${tag}-${arm}`;
    const config = {
      experimentId,
      java,
      jar: engineJar,
      candidate: { name: 'COD_ResearchCandidate', warriors: warriorInputs.map(input => input.path) },
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
    configs.push({ arm, panel, path: configPath, sha256: sha(fs.readFileSync(configPath)), battles: 1250 });
  }
}
const manifest = {
  status: 'FROZEN_BEFORE_RUN',
  objective: 'Independent preplanned paired follow-up comparing exact e1p3/e1p4 binaries over the complete 75-team 2025 field, prompted by a small e1p4 lead in the preceding four-arm validation.',
  design: {
    panels: 16,
    arms: Object.keys(candidates),
    opponentTeams: 75,
    opponentGroupsPerBattle: 3,
    zombiesPerBattle: 4,
    battlesPerCohort: 50,
    cohortsPerPanel: 25,
    battlesPerArm: 20000,
    totalBattles: 40000,
    pairing: 'Each fresh panel randomly partitions all 75 teams into 25 three-opponent cohorts; one fresh seed and identical cohort assignment are shared by both candidates.',
    primaryMetric: 'Candidate team score per battle averaged over the complete field.',
  },
  engineJar: { path: engineJar, sha256: sha(fs.readFileSync(engineJar)) },
  candidates,
  opponentWarriorHashes: opponentHashes,
  panels,
  configs,
};
const manifestPath = path.join(experimentDir, 'manifest.json');
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
fs.writeFileSync(path.join(experimentDir, 'manifest.json.sha256'), `${sha(fs.readFileSync(manifestPath))}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: manifest.status, manifestSha256: sha(fs.readFileSync(manifestPath)), panels: panels.length, teams: opponents.length, configs: configs.length, battlesPerArm: manifest.design.battlesPerArm, totalBattles: manifest.design.totalBattles }, null, 2));
