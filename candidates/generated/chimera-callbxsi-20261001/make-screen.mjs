import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const identify = file => ({ path: file, bytes: fs.statSync(file).size, sha256: sha(fs.readFileSync(file)) });
const m050Expected = {
  'ChimeraA.asm': 'b05ae79647c65b67d8486205597dc28c3c6467a80efbd9017bc257e2014999d8',
  'ChimeraB.asm': '6c909366137b736bf693090093d83a8c1436f7817ccc2cea51b3ea53bfc46144',
};
const e1p3Expected = {
  'e1p3-A.asm': 'f9b60994e70aa30ff649ae8f8c002ce438d2715c02b896c09a062ab8cfd45dda',
  'e1p3-B.asm': 'e9ba9c83727e2463c2a9c908a3edf3be9b496c80554123a881ec5bdf3693cfef',
};
const roots = {
  sources: path.join(here, 'sources'),
  build: path.join(here, 'build'),
  configs: path.join(repo, 'experiments/chimera-callbxsi-screen-20261001/configs'),
  output: path.join(repo, 'experiments/chimera-callbxsi-screen-20261001/accelerated'),
};
for (const directory of Object.values(roots)) {
  if (fs.existsSync(directory)) throw new Error(`refusing to overwrite existing path: ${directory}`);
}

const references = path.join(repo, 'candidates/generated/claude-e1-confirmation-20261001/frozen');
const frozenManifestPath = path.join(references, 'manifest.json');
const frozenManifestSha256 = sha(fs.readFileSync(frozenManifestPath));
if (frozenManifestSha256 !== 'e1e25fbe3ad90726f3894cfd23438c4f2954b96ae1f13d1d55a9125910ecc596')
  throw new Error(`unexpected frozen screen manifest: ${frozenManifestSha256}`);

const inputs = [
  { id: 'm050-callbxsi', sources: ['final/ChimeraA.asm', 'final/ChimeraB.asm'], expected: m050Expected, names: ['ChimeraA.asm', 'ChimeraB.asm'] },
  { id: 'e1p3-callbxsi', sources: ['candidates/generated/claude-e1p3-check-20261001/e1p3-A.asm', 'candidates/generated/claude-e1p3-check-20261001/e1p3-B.asm'], expected: e1p3Expected, names: ['ChimeraA.asm', 'ChimeraB.asm'] },
];
const records = [];
for (const input of inputs) {
  const sourceDirectory = path.join(roots.sources, input.id);
  const binaryDirectory = path.join(roots.build, input.id);
  fs.mkdirSync(sourceDirectory, { recursive: true });
  const sourceRecords = [];
  for (let index = 0; index < 2; index++) {
    const sourcePath = path.join(repo, input.sources[index]);
    const sourceBytes = fs.readFileSync(sourcePath);
    const sourceSha256 = sha(sourceBytes);
    const expected = input.expected[path.basename(sourcePath)];
    if (sourceSha256 !== expected) throw new Error(`baseline source changed: ${sourcePath} (${sourceSha256})`);
    const source = sourceBytes.toString('utf8');
    const matches = source.match(/call far \[bx\]/gi) ?? [];
    if (matches.length !== 2) throw new Error(`${sourcePath}: expected two and only two far-call anchors, got ${matches.length}`);
    const rewritten = source.replace(/call far \[bx\]/gi, 'call far [bx+si]');
    const target = path.join(sourceDirectory, input.names[index]);
    fs.writeFileSync(target, rewritten, { flag: 'wx' });
    sourceRecords.push({ original: input.sources[index], originalSha256: sourceSha256, path: target,
      sha256: sha(Buffer.from(rewritten)), bytes: Buffer.byteLength(rewritten), changedCalls: matches.length });
  }
  execFileSync(process.execPath, [path.join(repo, 'candidates/generated/claude-e1p3-check-20261001/assemble-local.mjs'),
    binaryDirectory, ...sourceRecords.map(item => item.path)], { stdio: 'inherit', windowsHide: true });
  const buildManifest = JSON.parse(fs.readFileSync(path.join(binaryDirectory, 'manifest.json'), 'utf8'));
  const binaries = buildManifest.files.map(item => ({ ...item, sha256: item.binarySha256 }));
  for (const binary of binaries) if (binary.bytes > 256) throw new Error(`${binary.binary} exceeds the byte limit`);
  records.push({ id: input.id, sourceRecords, binaries });
}

fs.mkdirSync(roots.configs, { recursive: true });
fs.mkdirSync(roots.output, { recursive: true });
const configs = [];
for (const record of records) {
  const binaryRoot = path.join(roots.build, record.id);
  for (let panel = 1; panel <= 8; panel++) {
    const panelId = String(panel).padStart(2, '0');
    const sourceConfigPath = path.join(references, `panel-${panelId}-m050.json`);
    const sourceConfigBytes = fs.readFileSync(sourceConfigPath);
    const config = JSON.parse(sourceConfigBytes);
    config.experimentId = `chimera-callbxsi-screen-20261001-${record.id}-panel-${panelId}`;
    config.candidate.warriors = [path.join(binaryRoot, 'ChimeraA'), path.join(binaryRoot, 'ChimeraB')];
    const outputDir = path.join(roots.output, record.id, `panel-${panelId}`);
    config.outputPath = path.join(outputDir, 'result.json');
    config.runDirectory = path.join(outputDir, 'runs');
    const target = path.join(roots.configs, `${record.id}-panel-${panelId}.json`);
    const configBytes = Buffer.from(`${JSON.stringify(config, null, 2)}\n`);
    fs.writeFileSync(target, configBytes, { flag: 'wx' });
    configs.push({ arm: record.id, panel: panelId, path: target, sha256: sha(configBytes),
      sourceConfig: sourceConfigPath, sourceConfigSha256: sha(sourceConfigBytes), seeds: config.seeds,
      cohortCount: config.cohorts.length, battlesPerCohort: config.battles,
      physicalWars: config.seeds.length * config.cohorts.length * config.battles });
  }
}

const manifest = {
  schemaVersion: 1,
  protocol: 'Exploratory paired signature-reencoding screen; same frozen eight-panel online-stage 2025 inputs as e1p3 screen; not fresh holdout evidence.',
  hypothesis: 'The m050/e1p3 far-call anchors are reached with SI=0 at every site, so CALL FAR [BX+SI] should resolve the same far pointer while replacing FF 1F by FF 18 without changing instruction length. A selective signature hunter may therefore fail to recognize the anchor; broader field performance must be measured.',
  frozenSuiteManifest: frozenManifestPath,
  frozenSuiteManifestSha256: frozenManifestSha256,
  baselines: [
    { id: 'm050', sourceA: 'final/ChimeraA.asm', sourceASha256: m050Expected['ChimeraA.asm'], sourceB: 'final/ChimeraB.asm', sourceBSha256: m050Expected['ChimeraB.asm'], binaryASha256: '0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44', binaryBSha256: '06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782' },
    { id: 'e1p3', sourceA: inputs[1].sources[0], sourceASha256: e1p3Expected['e1p3-A.asm'], sourceB: inputs[1].sources[1], sourceBSha256: e1p3Expected['e1p3-B.asm'] },
  ],
  variants: records,
  configs,
  limits: { armsRun: ['m050-callbxsi', 'e1p3-callbxsi'], panels: 8, warsPerArm: configs.filter(c => c.arm === records[0].id).reduce((sum, c) => sum + c.physicalWars, 0), threads: 1, parallel: false, overlays: [] },
};
const manifestPath = path.join(here, 'screen-manifest.json');
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: 'GENERATED', manifest: manifestPath, manifestSha256: sha(fs.readFileSync(manifestPath)), arms: manifest.limits.armsRun, panels: 8, warsPerArm: manifest.limits.warsPerArm, totalWars: manifest.limits.warsPerArm * 2 }, null, 2));
