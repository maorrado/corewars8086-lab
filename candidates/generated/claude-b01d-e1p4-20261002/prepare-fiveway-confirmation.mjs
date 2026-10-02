import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const outDir = path.join(repo, 'experiments/b01d-fiveway-crossyear-20261002');
const baseDir = path.join(repo, 'experiments/widefield-fourway-20261002');
const b01dDir = path.join(repo, 'experiments/b01d-e1p4-validation-20261002-parallel');
if (fs.existsSync(outDir)) throw new Error(`refusing to overwrite ${outDir}`);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const shaFile = file => sha(fs.readFileSync(file));
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const baseManifestPath = path.join(baseDir, 'manifest.json');
const baseManifest = readJson(baseManifestPath);
if (shaFile(baseManifestPath) !== fs.readFileSync(`${baseManifestPath}.sha256`, 'utf8').trim()) throw new Error('widefield source manifest hash mismatch');
const b01dManifestPath = path.join(b01dDir, 'manifest.json');
const b01dManifest = readJson(b01dManifestPath);
if (shaFile(b01dManifestPath) !== fs.readFileSync(`${b01dManifestPath}.sha256`, 'utf8').trim()) throw new Error('b01d source manifest hash mismatch');

function assertInsideRepo(file) {
  const absolute = path.resolve(file);
  const relative = path.relative(repo, absolute);
  if (!relative || relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative)) {
    throw new Error(`input escapes repository: ${file}`);
  }
  return absolute;
}
function verifyBinary(record, label) {
  const file = assertInsideRepo(record.path);
  const bytes = fs.readFileSync(file);
  const digest = sha(bytes);
  if (bytes.length !== record.bytes || digest !== record.sha256) throw new Error(`${label} changed: ${file}`);
  return { path: file, bytes: bytes.length, sha256: digest };
}

const arms = ['m049', 'm050', 'e1p3', 'e1p4', 'b01d'];
const candidates = {};
for (const arm of arms) {
  const binaries = arm === 'b01d' ? b01dManifest.candidates.b01d : baseManifest.candidates[arm];
  if (!binaries || binaries.length !== 2) throw new Error(`missing pair for ${arm}`);
  candidates[arm] = binaries.map((record, index) => verifyBinary(record, `${arm} warrior ${index + 1}`));
}
const opponentTeams = baseManifest.opponentTeams.map(team => ({
  ...team,
  warriors: team.warriors.map((record, index) => verifyBinary(record, `${team.name} warrior ${index + 1}`)),
}));
if (opponentTeams.length !== 130) throw new Error(`expected 130 deduplicated opponent teams, found ${opponentTeams.length}`);
const zombies = baseManifest.zombies.map(zombie => {
  const file = assertInsideRepo(zombie.path);
  return { name: zombie.name, path: file, bytes: fs.statSync(file).size, sha256: shaFile(file) };
});
if (zombies.length !== 4) throw new Error(`expected four zombies, got ${zombies.length}`);
const engineJar = assertInsideRepo(baseManifest.engineJar.path);
if (shaFile(engineJar) !== baseManifest.engineJar.sha256) throw new Error('engine JAR changed');
const java = assertInsideRepo(path.join(repo, 'tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe'));

function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

fs.mkdirSync(path.join(outDir, 'configs'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'results'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'runs'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'logs'), { recursive: true });
const panels = [];
const configs = [];
for (let panel = 1; panel <= 16; panel++) {
  const tag = String(panel).padStart(2, '0');
  const seed = `b01d-fiveway-2024-2025-p${tag}-${crypto.randomBytes(16).toString('hex')}`;
  const slots = shuffle(opponentTeams);
  const remainder = slots.length % 3;
  const finalGroupNames = new Set(slots.slice(slots.length - remainder).map(team => team.name));
  for (const team of shuffle(opponentTeams.filter(item => !finalGroupNames.has(item.name)))) {
    if (finalGroupNames.has(team.name)) continue;
    slots.push(team);
    finalGroupNames.add(team.name);
    if (slots.length % 3 === 0) break;
  }
  if (slots.length !== 132) throw new Error(`bad triple balancing in panel ${tag}`);
  const cohorts = [];
  for (let index = 0; index < slots.length; index += 3) {
    const group = slots.slice(index, index + 3);
    if (group.length !== 3 || new Set(group.map(team => team.name)).size !== 3) throw new Error(`invalid triple in panel ${tag}`);
    cohorts.push({
      id: `p${tag}-c${String(cohorts.length + 1).padStart(2, '0')}`,
      opponents: group.map(team => ({ name: team.name, warriors: team.warriors.map(warrior => warrior.path) })),
    });
  }
  if (cohorts.length !== 44) throw new Error(`expected 44 cohorts in panel ${tag}`);
  const repeatedTeams = slots.slice(opponentTeams.length).map(team => team.name);
  const executionOrder = shuffle(arms);
  panels.push({
    panel,
    seed,
    executionOrder,
    repeatedTeams,
    cohorts: cohorts.map(cohort => ({
      id: cohort.id,
      teams: cohort.opponents.map(opponent => {
        const source = opponentTeams.find(team => team.name === opponent.name);
        return { name: source.name, year: source.year, source: source.source };
      }),
    })),
  });
  for (const arm of executionOrder) {
    const experimentId = `b01d-fiveway-crossyear-p${tag}-${arm}`;
    const config = {
      experimentId,
      java,
      jar: engineJar,
      candidate: { name: `COD_${arm}`, warriors: candidates[arm].map(warrior => warrior.path) },
      zombies: zombies.map(({ name, path: zombiePath }) => ({ name, path: zombiePath })),
      cohorts,
      battles: 50,
      seeds: [seed],
      threads: 4,
      outputPath: path.join(outDir, 'results', `${experimentId}.json`),
      runDirectory: path.join(outDir, 'runs', experimentId),
    };
    const configPath = path.join(outDir, 'configs', `${experimentId}.json`);
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, { flag: 'wx' });
    configs.push({ arm, panel, path: configPath, sha256: shaFile(configPath), battles: cohorts.length * 50 });
  }
}

const manifest = {
  status: 'FROZEN_BEFORE_RUN',
  objective: 'Fresh-seed, paired five-way comparison of b01d, e1p4, e1p3, m050, and m049 over every deduplicated 2024/2025 opponent team-pair available in the repository.',
  design: {
    panels: 16,
    arms,
    opponentTeams: opponentTeams.length,
    opponentSources: baseManifest.design.opponentSources,
    opponentGroupsPerBattle: 3,
    zombiesPerBattle: zombies.length,
    battlesPerCohort: 50,
    cohortsPerPanel: 44,
    repeatedDistinctTeamsPerPanel: 2,
    battlesPerArmPerPanel: 2200,
    battlesPerArm: 35200,
    totalBattles: configs.reduce((sum, item) => sum + item.battles, 0),
    pairing: 'Every arm shares each fresh panel seed and exact random grouping of the complete 130-team roster; execution order is randomized per panel.',
    metric: 'Candidate team points per battle, averaged over all opponent cohorts and panel seeds.',
    note: 'The repository contains 130 deduplicated 2024/2025 team-pairs for this broad comparison, not Claude’s claimed 984-team historic pool.',
  },
  sourceWidefieldManifestPath: baseManifestPath,
  sourceWidefieldManifestSha256: shaFile(baseManifestPath),
  sourceB01dManifestPath: b01dManifestPath,
  sourceB01dManifestSha256: shaFile(b01dManifestPath),
  engineJar: { path: engineJar, sha256: shaFile(engineJar) },
  java,
  candidates,
  opponentTeams,
  zombies,
  panels,
  configs,
  execution: { workers: 2, threadsPerBenchmark: 4, engineSemantics: 'Original deterministic JAR; no accelerated engine or reduced battle count.' },
};
if (manifest.design.totalBattles !== 176000 || configs.length !== 80) throw new Error('unexpected frozen design dimensions');
const manifestPath = path.join(outDir, 'manifest.json');
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
fs.writeFileSync(`${manifestPath}.sha256`, `${shaFile(manifestPath)}\n`, { flag: 'wx' });
console.log(JSON.stringify({
  experimentDir: outDir,
  manifestSha256: shaFile(manifestPath),
  design: manifest.design,
  candidateHashes: Object.fromEntries(Object.entries(candidates).map(([arm, binaries]) => [arm, binaries.map(x => x.sha256)])),
}, null, 2));
