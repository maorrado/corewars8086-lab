import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const here = path.join(repo, 'candidates/generated/e1p4-antihunter-20261001');
const e1p3Dir = path.join(repo, 'candidates/generated/claude-e1p3-check-20261001');
const templateDir = path.join(e1p3Dir, 'fourth-holdout/frozen/configs');
const experimentDir = path.join(repo, 'experiments/e1p4-antihunter-screen-20261001');
const buildDir = path.join(here, 'build');
const frozenDir = path.join(here, 'frozen');
const configDir = path.join(frozenDir, 'configs');
const expected = {
  e1p3A: 'caced989dd55b98a749d5dc3a2d20d533e14013affb08b84572c9f76f1a05117',
  e1p3B: '99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b',
  e1p4A: '99192c673e5af394ed8194932b52b4f18f092804384f38d1bb2828b189c76b93',
  e1p4B: 'd307b92097ac68ce6073adc1e34917b2f51c0c396235c918dfc913cee7393354',
};
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const ensureAbsent = p => { if (fs.existsSync(p)) throw new Error('refusing existing path: ' + p); };
ensureAbsent(buildDir);
ensureAbsent(frozenDir);
ensureAbsent(experimentDir);

fs.mkdirSync(buildDir, { recursive: true });
fs.mkdirSync(configDir, { recursive: true });

const binaries = {};
for (const suffix of ['A', 'B']) {
  const sourcePath = path.join(e1p3Dir, 'build/e1p3' + suffix);
  const source = fs.readFileSync(sourcePath);
  if (sha(source) !== expected['e1p3' + suffix]) throw new Error('unexpected e1p3 binary hash: ' + suffix);
  const binary = Buffer.from(source);
  let replacements = 0;
  for (let i = 0; i < binary.length - 1; i++) {
    if (binary[i] === 0xff && binary[i + 1] === 0x1f) {
      binary[i + 1] = 0x18;
      replacements++;
    }
  }
  if (replacements !== 3) throw new Error('expected three FF 1F camouflage sites in ' + suffix + ', got ' + replacements);
  const targetPath = path.join(buildDir, 'e1p4' + suffix);
  if (sha(binary) !== expected['e1p4' + suffix]) throw new Error('e1p4 hash mismatch: ' + suffix);
  fs.writeFileSync(targetPath, binary, { flag: 'wx' });
  binaries['e1p4' + suffix] = { path: targetPath, bytes: binary.length, sha256: sha(binary), replacements };
}

const arms = ['m049', 'm050', 'e1p3', 'e1p4'];
const randomSeeds = [];
const configs = [];
for (let panel = 1; panel <= 4; panel++) {
  const tag = String(panel).padStart(2, '0');
  const e1p3TemplatePath = path.join(templateDir, 'panel-' + tag + '-e1p3.json');
  const e1p3Template = JSON.parse(fs.readFileSync(e1p3TemplatePath, 'utf8'));
  const byArm = Object.fromEntries(['m049', 'm050', 'e1p3'].map(arm => {
    const value = JSON.parse(fs.readFileSync(path.join(templateDir, 'panel-' + tag + '-' + arm + '.json'), 'utf8'));
    return [arm, value.candidate.warriors];
  }));
  byArm.e1p4 = [binaries.e1p4A.path, binaries.e1p4B.path];
  const seeds = [1, 2].map(index => {
    const seed = 'e1p4-fresh-20261001-p' + tag + '-s' + index + '-' + crypto.randomBytes(12).toString('hex');
    randomSeeds.push(seed);
    return seed;
  });
  for (const arm of arms) {
    const config = structuredClone(e1p3Template);
    const id = 'panel-' + tag + '-' + arm;
    config.experimentId = 'e1p4-antihunter-screen-20261001-' + id;
    config.candidate.warriors = byArm[arm];
    config.seeds = seeds;
    config.outputPath = path.join(experimentDir, 'unused-official-output', id + '.json');
    config.runDirectory = path.join(experimentDir, 'unused-official-runs', id);
    const configPath = path.join(configDir, id + '.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', { flag: 'wx' });
    configs.push({ id, path: configPath, sha256: sha(fs.readFileSync(configPath)), cohorts: config.cohorts.length,
      battlesPerCohort: config.battles, seeds: config.seeds, candidateWarriors: config.candidate.warriors });
  }
}

const rosterHashes = {};
const candidateHashes = {};
for (const config of configs) {
  const value = JSON.parse(fs.readFileSync(config.path, 'utf8'));
  for (const warriorPath of value.candidate.warriors) candidateHashes[warriorPath] = sha(fs.readFileSync(warriorPath));
  for (const cohort of value.cohorts) for (const opponent of cohort.opponents)
    for (const warriorPath of opponent.warriors) if (!rosterHashes[warriorPath]) rosterHashes[warriorPath] = sha(fs.readFileSync(warriorPath));
}
const manifest = {
  status: 'FROZEN_SCREEN_INPUTS',
  objective: 'Fresh-seed screen of exact e1p4 binary against e1p3, m049 and m050 on 2025 published roster.',
  design: { arms, panels: 4, teams: 75, cohortsPerPanel: 25, seedsPerPanel: 2, battlesPerCohort: 25,
    battlesPerArm: 5000, totalBattles: 20000, metric: 'candidate team points per battle',
    pairing: 'same cohort compositions and seed strings across all arms',
    limitation: 'screen only; opponent-conditioned scores are not pure one-on-one results' },
  sourceDerivation: 'Byte-identical to the user-supplied source as verified by the supplied SHA-256 hashes; derived from the audited e1p3 binaries by changing each FF 1F byte pair to FF 18.',
  binaries,
  candidateWarriorSha256: candidateHashes,
  configs,
  randomSeeds,
  rosterWarriorSha256: rosterHashes,
};
const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(frozenDir, 'manifest.json'), manifestBytes, { flag: 'wx' });
fs.writeFileSync(path.join(frozenDir, 'manifest.json.sha256'), sha(manifestBytes) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: manifest.status, manifestSha256: sha(manifestBytes), configs: configs.length,
  binaries, distinctOpponentWarriors: Object.keys(rosterHashes).length, seeds: randomSeeds }, null, 2));
