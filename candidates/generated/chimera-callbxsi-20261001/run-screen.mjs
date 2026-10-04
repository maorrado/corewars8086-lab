import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const experiment = path.join(repo, 'experiments/chimera-callbxsi-screen-20261001');
const manifestPath = path.join(here, 'screen-manifest.json');
const indexPath = path.join(experiment, 'execution-index.json');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const hashFile = file => sha(fs.readFileSync(file));
const manifestBytes = fs.readFileSync(manifestPath);
const manifestSha256 = sha(manifestBytes);
const manifest = JSON.parse(manifestBytes);
if (manifest.limits.totalWars !== 20000 || manifest.limits.threads !== 1 || manifest.limits.parallel !== false
    || manifest.limits.overlays.length !== 0) throw new Error('screen protocol changed or is not the expected bounded original-engine run');
if (fs.existsSync(indexPath)) throw new Error(`refusing to overwrite ${indexPath}`);
const runner = path.join(repo, 'tools/engine-acceleration-20261001/runtime/research-batch.mjs');
const startedAt = new Date().toISOString();
const records = [];
const writeIndex = status => fs.writeFileSync(indexPath, `${JSON.stringify({ schemaVersion: 1, status, startedAt,
  updatedAt: new Date().toISOString(), manifestPath, manifestSha256, completed: records }, null, 2)}\n`, 'utf8');

for (const configRecord of manifest.configs) {
  if (hashFile(configRecord.path) !== configRecord.sha256) throw new Error(`config changed after screen freeze: ${configRecord.path}`);
  const output = path.join(experiment, 'accelerated', configRecord.arm, `panel-${configRecord.panel}`);
  if (fs.existsSync(output)) throw new Error(`refusing existing output: ${output}`);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  console.log(`PREPARE ${configRecord.arm} panel-${configRecord.panel}`);
  execFileSync(process.execPath, [runner, 'prepare', configRecord.path, output], { stdio: 'inherit', windowsHide: true });
  console.log(`RUN ${configRecord.arm} panel-${configRecord.panel}`);
  execFileSync(process.execPath, [runner, 'run', output], { stdio: 'inherit', windowsHide: true });
  const resultPath = path.join(output, 'result.json');
  const resultBytes = fs.readFileSync(resultPath);
  const result = JSON.parse(resultBytes);
  if (result.aggregate.battles !== configRecord.physicalWars) throw new Error(`battle-count mismatch in ${resultPath}`);
  if (result.researchExecution.overlays.length !== 0) throw new Error(`unexpected overlay in ${resultPath}`);
  records.push({ arm: configRecord.arm, panel: configRecord.panel, configPath: configRecord.path,
    configSha256: configRecord.sha256, output, battles: result.aggregate.battles,
    teamPerBattle: result.aggregate.teamPerBattle, resultPath, resultBytes: resultBytes.length, resultSha256: sha(resultBytes),
    planPath: result.researchExecution.planPath, planSha256: result.researchExecution.planSha256,
    engineJarSha256: result.engineJar.sha256, elapsedSeconds: result.researchExecution.processElapsedSeconds });
  writeIndex('RUNNING');
}
writeIndex('COMPLETE');
console.log(JSON.stringify({ status: 'COMPLETE', manifestSha256, panels: records.length, wars: records.reduce((sum, record) => sum + record.battles, 0), indexPath }, null, 2));
