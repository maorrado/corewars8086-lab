import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const experimentDir = path.join(repo, 'experiments/e1p4-antihunter-20261001/final-2025');
const templatePath = path.join(repo, 'config-final-2025-m050-once.json');
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
if (template.battles !== 100 || template.cohorts.length !== 25 || template.seeds.length !== 1 || template.zombies.length !== 4)
  throw new Error('unexpected final-2025 benchmark shape');
if (template.seeds[0] !== 'final-2025-solo-20260929') throw new Error('unexpected reference seed');
const opponents = new Set(template.cohorts.flatMap(cohort => cohort.opponents.map(team => team.name)));
if (opponents.size !== 75 || template.cohorts.some(cohort => cohort.opponents.length !== 3))
  throw new Error('expected 75 distinct opposing teams, three per cohort');
const variants = {
  e1p3: {
    warriors: [
      path.join(repo, 'candidates/generated/claude-e1p3-check-20261001/build/e1p3A'),
      path.join(repo, 'candidates/generated/claude-e1p3-check-20261001/build/e1p3B'),
    ],
    hashes: ['caced989dd55b98a749d5dc3a2d20d533e14013affb08b84572c9f76f1a05117',
      '99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b'],
  },
  e1p4: {
    warriors: [
      path.join(repo, 'candidates/generated/e1p4-antihunter-20261001/build/e1p4A'),
      path.join(repo, 'candidates/generated/e1p4-antihunter-20261001/build/e1p4B'),
    ],
    hashes: ['99192c673e5af394ed8194932b52b4f18f092804384f38d1bb2828b189c76b93',
      'd307b92097ac68ce6073adc1e34917b2f51c0c396235c918dfc913cee7393354'],
  },
};
fs.mkdirSync(experimentDir, { recursive: true });
const manifest = { seed: template.seeds[0], battlesPerCohort: template.battles,
  cohorts: template.cohorts.length, otherTeams: opponents.size, zombies: template.zombies.length, configs: [] };
for (const [variant, candidate] of Object.entries(variants)) {
  candidate.warriors.forEach((p, i) => {
    if (sha(p) !== candidate.hashes[i]) throw new Error(variant + ' binary hash mismatch: ' + p);
  });
  const config = structuredClone(template);
  config.experimentId = 'final-2025-' + variant + '-once-20261001';
  config.outputPath = path.join(experimentDir, variant + '.json');
  config.runDirectory = path.join(experimentDir, 'runs', variant);
  config.candidate = { name: 'COD_' + variant, warriors: candidate.warriors };
  const configPath = path.join(repo, 'config-final-2025-' + variant + '-once-20261001.json');
  if (fs.existsSync(configPath) || fs.existsSync(config.outputPath) || fs.existsSync(config.runDirectory))
    throw new Error('refusing existing run/config path for ' + variant);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', { flag: 'wx' });
  manifest.configs.push({ variant, configPath, configSha256: sha(configPath), candidateWarriors: candidate.warriors.map((p, i) => ({
    path: p, bytes: fs.statSync(p).size, sha256: candidate.hashes[i],
  })) });
}
const manifestPath = path.join(experimentDir, 'manifest.json');
if (fs.existsSync(manifestPath)) throw new Error('refusing existing manifest: ' + manifestPath);
const bytes = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(manifestPath, bytes, { flag: 'wx' });
fs.writeFileSync(manifestPath + '.sha256', sha(manifestPath) + '\n', { flag: 'wx' });
console.log(JSON.stringify(manifest, null, 2));
