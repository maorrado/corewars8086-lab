import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const experimentDir = path.join(repo, 'experiments/e1p4-general-validation-20261001');
const configDir = path.join(experimentDir, 'configs');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const ensureAbsent = target => {
  if (fs.existsSync(target)) throw new Error(`refusing to overwrite existing path: ${target}`);
};
ensureAbsent(experimentDir);

const template = JSON.parse(fs.readFileSync(path.join(repo, 'config-2025-all-template.json'), 'utf8'));
const engineJar = path.join(repo, 'repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar');
const java = path.join(repo, 'tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe');
const arms = {
  m049: {
    warriors: ['build/chimera-zero-di-elision/b_pad_a', 'build/chimera-zero-di-elision/a_pad_b'],
    hashes: ['106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973', '7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77'],
  },
  m050: {
    warriors: ['build/final/ChimeraA', 'build/final/ChimeraB'],
    hashes: ['0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44', '06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782'],
  },
  e1p3: {
    warriors: ['candidates/generated/claude-e1p3-check-20261001/build/e1p3A', 'candidates/generated/claude-e1p3-check-20261001/build/e1p3B'],
    hashes: ['caced989dd55b98a749d5dc3a2d20d533e14013affb08b84572c9f76f1a05117', '99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b'],
  },
  e1p4: {
    warriors: ['candidates/generated/e1p4-antihunter-20261001/build/e1p4A', 'candidates/generated/e1p4-antihunter-20261001/build/e1p4B'],
    hashes: ['99192c673e5af394ed8194932b52b4f18f092804384f38d1bb2828b189c76b93', 'd307b92097ac68ce6073adc1e34917b2f51c0c396235c918dfc913cee7393354'],
  },
};

const candidateInputs = {};
for (const [arm, spec] of Object.entries(arms)) {
  candidateInputs[arm] = spec.warriors.map((relative, index) => {
    const file = path.resolve(repo, relative);
    const data = fs.readFileSync(file);
    const hash = sha(data);
    if (hash !== spec.hashes[index]) throw new Error(`${arm} warrior ${index + 1} hash mismatch: ${hash}`);
    return { path: file, bytes: data.length, sha256: hash };
  });
}

const opponentMap = new Map();
for (const cohort of template.cohorts) {
  for (const opponent of cohort.opponents) {
    if (opponentMap.has(opponent.name)) throw new Error(`duplicate opponent team: ${opponent.name}`);
    const warriors = opponent.warriors.map(relative => path.resolve(repo, relative));
    if (warriors.length !== 2) throw new Error(`${opponent.name} does not have exactly two warriors`);
    opponentMap.set(opponent.name, { name: opponent.name, warriors });
  }
}
const opponents = [...opponentMap.values()];
if (opponents.length !== 75) throw new Error(`expected 75 2025 teams, found ${opponents.length}`);
const rosterHashes = {};
for (const opponent of opponents) {
  for (const file of opponent.warriors) {
    const data = fs.readFileSync(file);
    rosterHashes[file] = { bytes: data.length, sha256: sha(data) };
  }
}
const zombies = template.zombies.map(zombie => ({ name: zombie.name, path: path.resolve(repo, zombie.path) }));
if (zombies.length !== 4) throw new Error(`expected four zombies, found ${zombies.length}`);
for (const zombie of zombies) fs.accessSync(zombie.path, fs.constants.R_OK);
fs.mkdirSync(configDir, { recursive: true });
fs.mkdirSync(path.join(experimentDir, 'results'), { recursive: true });
fs.mkdirSync(path.join(experimentDir, 'runs'), { recursive: true });

const seedPanels = [];
const configs = [];
function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

for (let panel = 1; panel <= 8; panel++) {
  const tag = String(panel).padStart(2, '0');
  const seed = `general-2025-p${tag}-${crypto.randomBytes(16).toString('hex')}`;
  const shuffled = shuffle(opponents);
  const cohorts = [];
  for (let i = 0; i < shuffled.length; i += 3) {
    const cohortTag = String(i / 3 + 1).padStart(2, '0');
    cohorts.push({ id: `p${tag}-c${cohortTag}`, opponents: shuffled.slice(i, i + 3) });
  }
  if (cohorts.length !== 25 || cohorts.some(cohort => cohort.opponents.length !== 3)) throw new Error(`bad panel composition ${tag}`);
  seedPanels.push({ panel, seed, cohorts: cohorts.map(cohort => ({ id: cohort.id, teams: cohort.opponents.map(team => team.name) })) });
  for (const [arm, spec] of Object.entries(arms)) {
    const experimentId = `e1p4-general-20261001-p${tag}-${arm}`;
    const config = {
      experimentId,
      java,
      jar: engineJar,
      candidate: { name: 'COD_ResearchCandidate', warriors: candidateInputs[arm].map(input => input.path) },
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
  objective: 'Paired fresh-seed general-field comparison of exact m049, m050, e1p3, e1p4 binaries against the complete 75-team 2025 roster.',
  design: {
    panels: 8,
    arms: Object.keys(arms),
    opponentTeams: opponents.length,
    opponentGroupsPerBattle: 3,
    zombiesPerBattle: zombies.length,
    battlesPerCohort: 50,
    cohortsPerPanel: 25,
    battlesPerArm: 10000,
    totalBattles: 40000,
    candidateNameFixedAcrossArms: true,
    sameRandomPartitionAndSeedAcrossArms: true,
    panelPairing: 'each panel independently reshuffles all 75 opponents into 25 three-opponent cohorts; a fresh seed is shared across all four arms',
    primaryMetric: 'candidate team score per battle, aggregated across the full 75-team field',
  },
  engineJar: { path: engineJar, sha256: sha(fs.readFileSync(engineJar)) },
  candidates: candidateInputs,
  opponentWarriorHashes: rosterHashes,
  panels: seedPanels,
  configs,
};
const manifestPath = path.join(experimentDir, 'manifest.json');
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
const manifestHashPath = path.join(experimentDir, 'manifest.json.sha256');
fs.writeFileSync(manifestHashPath, `${sha(fs.readFileSync(manifestPath))}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: manifest.status, manifestSha256: sha(fs.readFileSync(manifestPath)), panels: seedPanels.length,
  teams: opponents.length, configs: configs.length, battlesPerArm: manifest.design.battlesPerArm,
  totalBattles: manifest.design.totalBattles, candidates: candidateInputs }, null, 2));
