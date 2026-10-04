import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const experimentDir = path.join(repo, 'experiments/e1p4-crossyear-confirmation-20261002');
if (fs.existsSync(experimentDir)) throw new Error(`refusing to overwrite ${experimentDir}`);
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const template = JSON.parse(fs.readFileSync(path.join(repo, 'config-2025-all-template.json'), 'utf8'));
const historical = JSON.parse(fs.readFileSync(path.join(repo, 'experiments/2024-final2-baseline-seed1.json'), 'utf8'));
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
  candidates[arm] = spec.warriors.map((relative, index) => {
    const file = path.resolve(repo, relative);
    const bytes = fs.readFileSync(file);
    const hash = sha(bytes);
    if (hash !== spec.hashes[index]) throw new Error(`${arm} hash mismatch: ${hash}`);
    return { path: file, bytes: bytes.length, sha256: hash };
  });
}
const opponentMap = new Map();
for (const cohort of template.cohorts) for (const team of cohort.opponents) {
  if (opponentMap.has(team.name)) throw new Error(`duplicate 2025 team ${team.name}`);
  opponentMap.set(team.name, {
    name: team.name,
    year: 2025,
    warriors: team.warriors.map(relative => path.resolve(repo, relative)),
  });
}
if (opponentMap.size !== 75) throw new Error(`expected 75 2025 teams, got ${opponentMap.size}`);
for (const team of historical.resolvedTeams) {
  const name = `2024_${team.name}`;
  if (opponentMap.has(name)) throw new Error(`duplicate historical team ${name}`);
  if (team.warriors.length !== 2) throw new Error(`${name} is not a complete pair`);
  opponentMap.set(name, {
    name,
    year: 2024,
    warriors: team.warriors.map(relative => path.resolve(repo, relative.replace(/^\.\.[\\/]/, ''))),
  });
}
const opponents = [...opponentMap.values()];
if (opponents.length !== 86) throw new Error(`expected 86 teams across 2024+2025, got ${opponents.length}`);
const opponentHashes = {};
for (const team of opponents) for (const warrior of team.warriors) {
  const bytes = fs.readFileSync(warrior);
  opponentHashes[warrior] = { bytes: bytes.length, sha256: sha(bytes) };
}
const zombies = template.zombies.map(zombie => ({ name: zombie.name, path: path.resolve(repo, zombie.path) }));

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
for (let panel = 1; panel <= 16; panel++) {
  const tag = String(panel).padStart(2, '0');
  const seed = `crossyear-24-25-p${tag}-${crypto.randomBytes(16).toString('hex')}`;
  const shuffled = shuffle(opponents);
  const remainder = shuffled.slice(84);
  const duplicate = opponents[(panel - 1) % opponents.length];
  let repeat = duplicate;
  while (remainder.some(team => team.name === repeat.name)) repeat = opponents[(opponents.indexOf(repeat) + 1) % opponents.length];
  const slots = [...shuffled.slice(0, 84), ...remainder, repeat];
  const cohorts = [];
  for (let index = 0; index < slots.length; index += 3) {
    const group = slots.slice(index, index + 3);
    if (group.length !== 3 || new Set(group.map(team => team.name)).size !== 3) throw new Error(`invalid group in panel ${tag}`);
    cohorts.push({ id: `p${tag}-c${String(cohorts.length + 1).padStart(2, '0')}`, opponents: group });
  }
  if (cohorts.length !== 29) throw new Error(`expected 29 groups in panel ${tag}`);
  panels.push({
    panel,
    seed,
    repeatedTeam: repeat.name,
    cohorts: cohorts.map(cohort => ({ id: cohort.id, teams: cohort.opponents.map(team => team.name) })),
  });
  for (const [arm, warriors] of Object.entries(candidates)) {
    const experimentId = `e1p3-e1p4-crossyear-20261002-p${tag}-${arm}`;
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
    configs.push({ arm, panel, path: configPath, sha256: sha(fs.readFileSync(configPath)), battles: 1450 });
  }
}
const engineJar = path.join(repo, 'repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar');
const manifest = {
  status: 'FROZEN_BEFORE_RUN',
  objective: 'Independent cross-year confirmation comparing e1p3 and e1p4 over all 75 official 2025 teams and all 11 2024 final2 teams, under the current four-zombie 2025 arena.',
  design: {
    panels: 16,
    arms: Object.keys(candidates),
    opponentTeams: opponents.length,
    opponentYears: { 2024: 11, 2025: 75 },
    opponentGroupsPerBattle: 3,
    zombiesPerBattle: zombies.length,
    battlesPerCohort: 50,
    cohortsPerPanel: 29,
    battlesPerArm: 23200,
    totalBattles: 46400,
    balancing: 'All teams occur at least once per panel; one distinct team is repeated per panel to complete 29 full three-team cohorts, rotating the repeat across panel order.',
    pairing: 'Fresh panel partition and seed are shared by both candidates.',
    primaryMetric: 'Candidate team score per battle averaged over the complete 86-team cross-year field.',
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
