import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const frozen = path.join(repo, 'candidates/generated/claude-e1-confirmation-20261001/frozen');
const sourceRoot = path.join(here, 'sources');
const buildRoot = path.join(here, 'build');
const configRoot = path.join(repo, 'experiments/chimera-callbxsi-screen-20261001/configs');
const outputRoot = path.join(repo, 'experiments/chimera-callbxsi-screen-20261001/accelerated');
const manifestPath = path.join(here, 'screen-manifest.json');
if (fs.existsSync(manifestPath)) throw new Error(`refusing to overwrite ${manifestPath}`);
const frozenManifestPath = path.join(frozen, 'manifest.json');
const frozenSuiteManifestSha256 = sha(fs.readFileSync(frozenManifestPath));
if (frozenSuiteManifestSha256 !== 'e1e25fbe3ad90726f3894cfd23438c4f2954b96ae1f13d1d55a9125910ecc596')
  throw new Error(`unexpected frozen screen manifest: ${frozenSuiteManifestSha256}`);

const definitions = [
  { id: 'm050-callbxsi', sourcePaths: ['final/ChimeraA.asm', 'final/ChimeraB.asm'], names: ['ChimeraA.asm', 'ChimeraB.asm'], hashes: ['b05ae79647c65b67d8486205597dc28c3c6467a80efbd9017bc257e2014999d8', '6c909366137b736bf693090093d83a8c1436f7817ccc2cea51b3ea53bfc46144'] },
  { id: 'e1p3-callbxsi', sourcePaths: ['candidates/generated/claude-e1p3-check-20261001/e1p3-A.asm', 'candidates/generated/claude-e1p3-check-20261001/e1p3-B.asm'], names: ['ChimeraA.asm', 'ChimeraB.asm'], hashes: ['f9b60994e70aa30ff649ae8f8c002ce438d2715c02b896c09a062ab8cfd45dda', 'e9ba9c83727e2463c2a9c908a3edf3be9b496c80554123a881ec5bdf3693cfef'] },
];
const variants = [], configs = [];
for (const arm of definitions) {
  const sourceDir = path.join(sourceRoot, arm.id);
  const binaryDir = path.join(buildRoot, arm.id);
  const sourceRecords = [], binaries = [];
  for (let index = 0; index < 2; index++) {
    const baseSource = path.join(repo, arm.sourcePaths[index]);
    if (sha(fs.readFileSync(baseSource)) !== arm.hashes[index]) throw new Error(`baseline source changed: ${baseSource}`);
    const source = path.join(sourceDir, arm.names[index]);
    const sourceBytes = fs.readFileSync(source);
    if ((sourceBytes.toString('utf8').match(/call far \[bx\+si\]/gi) ?? []).length !== 2
        || /call far \[bx\]/i.test(sourceBytes.toString('utf8')))
      throw new Error(`rewritten anchor count/contents invalid: ${source}`);
    const buildManifest = readJson(path.join(binaryDir, 'manifest.json'));
    const entry = buildManifest.files.find(item => path.resolve(item.source) === path.resolve(source));
    if (!entry) throw new Error(`source absent from assembler manifest: ${source}`);
    const binaryPath = entry.binary;
    const binaryBytes = fs.readFileSync(binaryPath);
    if (binaryBytes.length !== entry.bytes || sha(binaryBytes) !== entry.binarySha256 || binaryBytes.length > 256)
      throw new Error(`binary identity/size mismatch: ${binaryPath}`);
    sourceRecords.push({ original: arm.sourcePaths[index], originalSha256: arm.hashes[index], path: source,
      bytes: Buffer.byteLength(sourceBytes), sha256: sha(sourceBytes), changedCalls: 2 });
    binaries.push({ path: binaryPath, bytes: binaryBytes.length, sha256: sha(binaryBytes) });
  }
  for (let panel = 1; panel <= 8; panel++) {
    const panelId = String(panel).padStart(2, '0');
    const inputPath = path.join(frozen, `panel-${panelId}-m050.json`);
    const inputBytes = fs.readFileSync(inputPath);
    const input = readJson(inputPath);
    const actualPath = path.join(configRoot, `${arm.id}-panel-${panelId}.json`);
    const actualBytes = fs.readFileSync(actualPath);
    const actual = JSON.parse(actualBytes);
    const expected = structuredClone(input);
    const actualOutput = path.join(outputRoot, arm.id, `panel-${panelId}`);
    expected.experimentId = `chimera-callbxsi-screen-20261001-${arm.id}-panel-${panelId}`;
    expected.candidate.warriors = [path.join(buildRoot, arm.id, 'ChimeraA'), path.join(buildRoot, arm.id, 'ChimeraB')];
    expected.outputPath = path.join(actualOutput, 'result.json');
    expected.runDirectory = path.join(actualOutput, 'runs');
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`config differs from expected paired transform: ${actualPath}`);
    configs.push({ arm: arm.id, panel: panelId, path: actualPath, bytes: actualBytes.length, sha256: sha(actualBytes),
      sourceConfig: inputPath, sourceConfigBytes: inputBytes.length, sourceConfigSha256: sha(inputBytes), seeds: actual.seeds,
      cohortCount: actual.cohorts.length, battlesPerCohort: actual.battles,
      physicalWars: actual.seeds.length * actual.cohorts.length * actual.battles });
  }
  variants.push({ id: arm.id, sources: sourceRecords, binaries });
}
const warsPerArm = configs.filter(item => item.arm === definitions[0].id).reduce((sum, item) => sum + item.physicalWars, 0);
if (configs.length !== 16 || configs.some(item => item.physicalWars !== 1250)) throw new Error('expected 16 matched configs, 1,250 wars each');
const manifest = {
  schemaVersion: 1,
  protocol: 'Exploratory paired signature-reencoding screen; same frozen eight-panel online-stage 2025 inputs as e1p3 screen; not fresh holdout evidence.',
  hypothesis: 'CALL FAR [BX+SI] should address the same far pointer at SI=0 at every bootstrap/worker call site, with the same instruction length but a different ModRM byte (FF 18 instead of FF 1F). This may disrupt signature-specific targeting; general field score is measured separately.',
  frozenSuiteManifest: frozenManifestPath,
  frozenSuiteManifestSha256,
  variants,
  configs,
  limits: { armsRun: definitions.map(item => item.id), panels: 8, warsPerArm, totalWars: warsPerArm * definitions.length, threads: 1, parallel: false, overlays: [] },
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: 'FINALIZED_AND_VERIFIED', manifest: manifestPath, manifestSha256: sha(fs.readFileSync(manifestPath)), arms: manifest.limits.armsRun, panels: 8, warsPerArm, totalWars: manifest.limits.totalWars }, null, 2));
