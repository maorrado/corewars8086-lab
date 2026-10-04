import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const experimentDir = path.join(repo, 'experiments/widefield-fourway-20261002');
if (fs.existsSync(experimentDir)) throw new Error(`refusing to overwrite ${experimentDir}`);
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const template = JSON.parse(fs.readFileSync(path.join(repo, 'config-2025-all-template.json'), 'utf8'));
const historical = JSON.parse(fs.readFileSync(path.join(repo, 'experiments/2024-final2-baseline-seed1.json'), 'utf8'));
const stageDir = path.join(repo, 'repos/corewars8086-survivors/cgx2024/02-online2');
const stageNames = fs.readdirSync(stageDir);
const stageGroups = new Map();
for (const filename of stageNames) {
  if (!/[12]$/.test(filename)) continue;
  const teamName = filename.slice(0, -1);
  if (!stageGroups.has(teamName)) stageGroups.set(teamName, {});
  stageGroups.get(teamName)[filename.at(-1)] = path.join(stageDir, filename);
}
const opponentsByName = new Map();
for (const [name, pair] of stageGroups) {
  if (!pair['1'] || !pair['2']) throw new Error(`incomplete 2024 online2 pair: ${name}`);
  opponentsByName.set(`2024_${name}`, { name: `2024_${name}`, year: 2024, source: '2024-online2', warriors: [pair['1'], pair['2']] });
}
for (const team of historical.resolvedTeams) {
  if (team.warriors.length !== 2) throw new Error(`2024 final2 team is not a pair: ${team.name}`);
  const name = `2024_${team.name}`;
  opponentsByName.set(name, {
    name,
    year: 2024,
    source: '2024-final2',
    warriors: team.warriors.map(relative => path.resolve(repo, relative.replace(/^\.\.[\\/]/, ''))),
  });
}
for (const cohort of template.cohorts) for (const team of cohort.opponents) {
  const name = `2025_${team.name}`;
  if (opponentsByName.has(name)) throw new Error(`duplicate team identity: ${name}`);
  opponentsByName.set(name, { name, year: 2025, source: 'official-2025', warriors: team.warriors.map(relative => path.resolve(repo, relative)) });
}

const opponentsByPair = new Map();
for (const team of opponentsByName.values()) {
  const warriorHashes = team.warriors.map(file => {
    const bytes = fs.readFileSync(file);
    if (!bytes.length) throw new Error(`empty warrior file: ${file}`);
    return sha(bytes);
  });
  const pairKey = [...warriorHashes].sort().join(':');
  const existing = opponentsByPair.get(pairKey);
  if (!existing || team.year > existing.year || (team.year === existing.year && team.source === '2024-final2')) {
    opponentsByPair.set(pairKey, { ...team, warriorHashes });
  }
}
const opponents = [...opponentsByPair.values()].sort((a, b) => a.name.localeCompare(b.name));
if (opponents.length < 125 || opponents.length > 132) throw new Error(`unexpected unique opponent count: ${opponents.length}`);

const armSpecs = {
  m049: {
    warriors: ['build/chimera-anchor-alias/alias_b_a', 'build/chimera-anchor-alias/alias_a_b'],
    hashes: ['106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973', '7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77'],
  },
  m050: {
    warriors: ['build/codex-goal-20261001/conditional-camper-screen/frozen/m050-A', 'build/codex-goal-20261001/conditional-camper-screen/frozen/m050-B'],
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
const candidates = {};
for (const [arm, spec] of Object.entries(armSpecs)) {
  candidates[arm] = spec.warriors.map((relative, index) => {
    const file = path.resolve(repo, relative);
    const bytes = fs.readFileSync(file);
    const hash = sha(bytes);
    if (hash !== spec.hashes[index]) throw new Error(`${arm} warrior ${index + 1} hash mismatch: ${hash}`);
    return { path: file, bytes: bytes.length, sha256: hash };
  });
}
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
  const seed = `widefield-2024-2025-p${tag}-${crypto.randomBytes(16).toString('hex')}`;
  const slots = shuffle(opponents);
  const remainder = slots.length % 3;
  const tailNames = new Set(slots.slice(slots.length - remainder).map(team => team.name));
  const repeatPool = shuffle(opponents.filter(team => !tailNames.has(team.name)));
  for (const team of repeatPool) {
    if (tailNames.has(team.name)) continue;
    slots.push(team);
    tailNames.add(team.name);
    if (slots.length % 3 === 0) break;
  }
  if (slots.length % 3 !== 0) throw new Error(`could not balance teams into triples in panel ${tag}`);
  const cohorts = [];
  for (let index = 0; index < slots.length; index += 3) {
    const group = slots.slice(index, index + 3);
    if (group.length !== 3 || new Set(group.map(team => team.name)).size !== 3) throw new Error(`invalid team group in panel ${tag}`);
    cohorts.push({ id: `p${tag}-c${String(cohorts.length + 1).padStart(2, '0')}`, opponents: group });
  }
  panels.push({ panel, seed, repeatedTeams: slots.slice(opponents.length).map(team => team.name), cohorts: cohorts.map(cohort => ({ id: cohort.id, teams: cohort.opponents.map(team => team.name) })) });
  for (const [arm, warriors] of Object.entries(candidates)) {
    const experimentId = `widefield-fourway-20261002-p${tag}-${arm}`;
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
    configs.push({ arm, panel, path: configPath, sha256: sha(fs.readFileSync(configPath)), battles: cohorts.length * 50 });
  }
}
const engineJar = path.join(repo, 'repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar');
const manifest = {
  status: 'FROZEN_BEFORE_RUN',
  objective: 'Direct four-candidate comparison over all unique official 2024 online2/final2 and official 2025 finalist team-pair binaries available in this repository, under the current 2025 four-zombie rules.',
  design: {
    panels: 16,
    arms: Object.keys(candidates),
    opponentTeams: opponents.length,
    opponentSources: { '2024-online2': [...opponentsByPair.values()].filter(team => team.source === '2024-online2').length, '2024-final2': [...opponentsByPair.values()].filter(team => team.source === '2024-final2').length, 'official-2025': [...opponentsByPair.values()].filter(team => team.source === 'official-2025').length },
    opponentGroupsPerBattle: 3,
    zombiesPerBattle: zombies.length,
    battlesPerCohort: 50,
    cohortsPerPanel: panels[0].cohorts.length,
    battlesPerArmPerPanel: panels[0].cohorts.length * 50,
    totalBattles: configs.reduce((sum, record) => sum + record.battles, 0),
    deduplication: 'Exact duplicate opponent pairs, identified by the unordered SHA-256 pair of warrior binaries, are represented once; the latest-year copy is preferred, and 2024 final2 replaces the 2024 online2 snapshot for the same team name.',
    balancing: 'Every opponent team appears once per panel; if needed, a small number of distinct teams is repeated only to fill complete three-opponent cohorts.',
    pairing: 'All four candidates face identical panel seeds and opponent groupings.',
    primaryMetric: 'Candidate team score per battle averaged over all included official team-pair opponents.',
  },
  engineJar: { path: engineJar, sha256: sha(fs.readFileSync(engineJar)) },
  candidates,
  opponentTeams: opponents.map(team => ({ name: team.name, year: team.year, source: team.source, warriors: team.warriors.map(file => ({ path: file, ...opponentHashes[file] })) })),
  zombies,
  panels,
  configs,
};
const manifestPath = path.join(experimentDir, 'manifest.json');
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
fs.writeFileSync(`${manifestPath}.sha256`, `${sha(fs.readFileSync(manifestPath))}\n`, { flag: 'wx' });
console.log(JSON.stringify({ experimentDir, manifestSha256: sha(fs.readFileSync(manifestPath)), configCount: configs.length, design: manifest.design, candidates }, null, 2));
