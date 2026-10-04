import fs from 'node:fs';
import path from 'node:path';
import {
  here, suite, manifestPath, assert, equal, sha, hashFile, jsonText, rootPath, relativeRoot,
  fileRecord, referenceHashes, originalVariants, localVariants, authoredFiles, algorithm,
  decisionPlan, readProtocol, makeConfigs,
} from './protocol.mjs';

const preview = process.argv[2] === '--plan';
assert(process.argv.length === (preview ? 3 : 2), 'usage: node generate.mjs [--plan]');
const protocol = readProtocol();
const entries = makeConfigs(protocol);
for (const destination of [manifestPath, `${manifestPath}.sha256`, ...entries.map(entry => path.join(here, entry.configPath)),
  ...['build', 'results', 'runs'].map(directory => path.join(here, directory))]) {
  assert(!fs.existsSync(destination), `refusing to overwrite or reuse ${destination}`);
}
const authored = authoredFiles.map(file => fileRecord(relativeRoot(path.join(here, file))));
const plan = {
  suite, mode: preview ? 'preview-no-writes' : 'freeze', configFiles: entries.map(entry => entry.configPath),
  battlesPerArm: 5000, totalBattleExecutions: 15000,
  panels: protocol.panels.map(panel => ({ panel: panel.panel, distinctTeams: 62, cohorts: 25, opponentSlots: 75,
    repeatedTeams: panel.repeatedTeams, shuffleAttempts: panel.rejectionAttempts, seeds: panel.seeds })),
  engineSeedRanges: protocol.ranges, decisionPlan,
};
if (preview) {
  console.log(JSON.stringify(plan, null, 2));
} else {
  const sourceMap = new Map(protocol.sourceBinaries.map(record => [record.path, record]));
  const frozenCopies = [];
  for (const [variant, sources] of Object.entries(originalVariants)) {
    sources.forEach((source, index) => {
      const destination = path.join(here, localVariants[variant][index]);
      const expected = sourceMap.get(source);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(rootPath(source), destination, fs.constants.COPYFILE_EXCL);
      equal(fs.statSync(destination).size, expected.bytes, `${variant} frozen copy length`);
      equal(hashFile(destination), expected.sha256, `${variant} frozen copy hash`);
      fs.chmodSync(destination, 0o444);
      frozenCopies.push({ path: relativeRoot(destination), bytes: expected.bytes, sha256: expected.sha256 });
    });
  }
  const manifest = {
    schemaVersion: 1, suite, frozenAt: new Date().toISOString(),
    design: { panels: 2, cohortsPerPanel: 25, uniqueSeniorTeams: 62, slotsPerPanel: 75,
      repeatedTeamsPerPanel: 13, seedsPerPanel: 2, battlesPerBlock: 50, battlesPerPanelArm: 2500,
      battlesPerArm: 5000, arms: ['c090', 'm049', 'm050'], candidateName: 'COD_pair', threads: 1, parallel: false, telemetry: false },
    decisionPlan, panelAlgorithm: algorithm, panels: protocol.panels,
    engineSeedRanges: protocol.ranges, excludedPriorEngineSeedRanges: protocol.priorRanges,
    references: Object.keys(referenceHashes).map(fileRecord),
    sourceVariants: originalVariants, variants: localVariants, sourceBinaries: protocol.sourceBinaries,
    c090Sources: protocol.c090Sources, inputs: [...frozenCopies, ...protocol.fieldBinaries],
    engine: protocol.original.engine, java: protocol.original.java, runner: protocol.original.runner,
    authoringFiles: authored,
    configs: entries.map(({ config, ...metadata }) => ({ ...metadata, sha256: sha(jsonText(config)) })),
  };
  assert(manifest.inputs.length === 134, 'expected six contender copies, 124 senior warriors and four Zombies');
  for (const entry of entries) fs.writeFileSync(path.join(here, entry.configPath), jsonText(entry.config), { flag: 'wx' });
  const text = jsonText(manifest);
  fs.writeFileSync(manifestPath, text, { flag: 'wx' });
  fs.writeFileSync(`${manifestPath}.sha256`, `${sha(text)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ ...plan, manifest: manifestPath, manifestSha256: sha(text), frozenAt: manifest.frozenAt }));
}
