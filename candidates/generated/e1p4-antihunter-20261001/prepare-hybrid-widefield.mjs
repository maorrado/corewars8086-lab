import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const sourceDir = path.join(repo, 'experiments/widefield-fourway-20261002');
const source = JSON.parse(fs.readFileSync(path.join(sourceDir, 'manifest.json'), 'utf8'));
const experimentDir = path.join(repo, 'experiments/e1p3-e1p4-hybrid-widefield-20261002');
if (fs.existsSync(experimentDir)) throw new Error(`refusing to overwrite ${experimentDir}`);
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const sourceArms = {
  e1p3: source.candidates.e1p3,
  e1p4: source.candidates.e1p4,
};
const specs = {
  e1p3: sourceArms.e1p3,
  e1p4: sourceArms.e1p4,
  hybrid_e1p3A_e1p4B: [sourceArms.e1p3[0], sourceArms.e1p4[1]],
  hybrid_e1p4A_e1p3B: [sourceArms.e1p4[0], sourceArms.e1p3[1]],
};
const candidates = Object.fromEntries(Object.entries(specs).map(([name, warriors]) => [name, warriors.map(warrior => {
  const bytes = fs.readFileSync(warrior.path);
  const hash = sha(bytes);
  if (hash !== warrior.sha256) throw new Error(`${name} input hash mismatch: ${warrior.path}`);
  return { path: warrior.path, bytes: bytes.length, sha256: hash };
})]));
const opponents = source.opponentTeams.map(team => ({
  name: team.name,
  year: team.year,
  source: team.source,
  warriors: team.warriors.map(warrior => warrior.path),
}));
const zombies = source.zombies;
const jar = source.engineJar;
const panels = [];
const configs = [];
function shuffle(values) {
  const output = [...values];
  for (let i = output.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}
fs.mkdirSync(path.join(experimentDir, 'configs'), { recursive: true });
fs.mkdirSync(path.join(experimentDir, 'results'), { recursive: true });
fs.mkdirSync(path.join(experimentDir, 'runs'), { recursive: true });
for (let panel = 1; panel <= 12; panel++) {
  const tag = String(panel).padStart(2, '0');
  const seed = `hybrid-widefield-2024-2025-p${tag}-${crypto.randomBytes(16).toString('hex')}`;
  const slots = shuffle(opponents);
  const tailCount = slots.length % 3;
  const used = new Set(slots.slice(slots.length - tailCount).map(team => team.name));
  for (const team of shuffle(opponents.filter(item => !used.has(item.name)))) {
    if (used.has(team.name)) continue;
    slots.push(team);
    used.add(team.name);
    if (slots.length % 3 === 0) break;
  }
  if (slots.length % 3 !== 0) throw new Error(`unbalanced panel ${tag}`);
  const cohorts = [];
  for (let i = 0; i < slots.length; i += 3) {
    const group = slots.slice(i, i + 3);
    if (group.length !== 3 || new Set(group.map(team => team.name)).size !== 3) throw new Error(`invalid cohort in panel ${tag}`);
    cohorts.push({ id: `p${tag}-c${String(cohorts.length + 1).padStart(2, '0')}`, opponents: group });
  }
  panels.push({ panel, seed, cohorts: cohorts.map(cohort => ({ id: cohort.id, teams: cohort.opponents.map(team => team.name) })) });
  for (const [arm, warriors] of Object.entries(candidates)) {
    const experimentId = `hybrid-widefield-20261002-p${tag}-${arm}`;
    const config = {
      experimentId,
      java: path.join(repo, 'tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe'),
      jar: jar.path,
      candidate: { name: `COD_${arm}`, warriors: warriors.map(item => item.path) },
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
const manifest = {
  status: 'FROZEN_BEFORE_RUN',
  objective: 'Fresh-seed screen of reciprocal A/B hybrids of e1p3 and e1p4 over the 130 exact-unique 2024/2025 official opponent teams from the preceding widefield study.',
  design: {
    panels: panels.length,
    arms: Object.keys(candidates),
    opponentTeams: opponents.length,
    opponentSources: Object.fromEntries([...new Set(opponents.map(team => team.source))].map(sourceName => [sourceName, opponents.filter(team => team.source === sourceName).length])),
    opponentGroupsPerBattle: 3,
    zombiesPerBattle: zombies.length,
    battlesPerCohort: 50,
    cohortsPerPanel: panels[0].cohorts.length,
    battlesPerArmPerPanel: panels[0].cohorts.length * 50,
    totalBattles: configs.reduce((sum, item) => sum + item.battles, 0),
    pairing: 'Each arm uses the same fresh panel seeds, random three-opponent groupings, battle counts, and four zombies.',
    interpretation: 'Exploratory hybrid screen only; any apparent winner must be tested on separately generated fresh holdout panels.',
  },
  engineJar: jar,
  candidates,
  opponentTeams: opponents,
  zombies,
  panels,
  configs,
};
const manifestPath = path.join(experimentDir, 'manifest.json');
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
fs.writeFileSync(`${manifestPath}.sha256`, `${sha(fs.readFileSync(manifestPath))}\n`, { flag: 'wx' });
console.log(JSON.stringify({ experimentDir, manifestSha256: sha(fs.readFileSync(manifestPath)), design: manifest.design, candidates }, null, 2));
