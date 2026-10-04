import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { equal, sha } from '../model.mjs';
import { record } from '../../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../..');
const freeze = path.join(here, 'frozen');
const out = path.join(repo, 'experiments/m050-xorb-e1p3-density-extension-20261001');
if (fs.existsSync(out)) throw new Error(`refusing existing run directory ${out}`);

const manifestBytes = fs.readFileSync(path.join(freeze, 'manifest.json'));
equal(sha(manifestBytes), fs.readFileSync(path.join(freeze, 'manifest.json.sha256'), 'utf8').trim(), 'manifest checksum');
const manifest = JSON.parse(manifestBytes);
const tool = path.join(repo, 'tools/engine-acceleration-20261001/runtime/research-batch.mjs');
const verifyInputs = () => manifest.files.forEach(file => equal(record(file.path), file, `frozen input ${file.path}`));
verifyInputs();
fs.mkdirSync(path.join(out, 'accelerated'), { recursive: true });
const log = path.join(out, 'run-log.jsonl'), started = Date.now();

for (let i = 0; i < manifest.configs.length; i++) {
  const item = manifest.configs[i];
  const config = path.join(freeze, 'configs', `${item.id}.json`);
  const target = path.join(out, 'accelerated', item.id);
  verifyInputs();
  const prepared = spawnSync(process.execPath, [tool, 'prepare', config, target], {
    cwd: repo, encoding: 'utf8', windowsHide: true,
  });
  fs.appendFileSync(log, `${JSON.stringify({ at: new Date().toISOString(), index: i + 1, total: manifest.configs.length,
    id: item.id, stage: 'prepare', status: prepared.status, signal: prepared.signal,
    stderr: prepared.stderr?.slice(-2000), stdoutTail: prepared.stdout?.slice(-1000) })}\n`, { flag: 'a' });
  if (prepared.status !== 0) throw new Error(`prepare failed for ${item.id}; preserved ${log}`);
  verifyInputs();
  const ran = spawnSync(process.execPath, [tool, 'run', target], { cwd: repo, encoding: 'utf8', windowsHide: true });
  fs.appendFileSync(log, `${JSON.stringify({ at: new Date().toISOString(), index: i + 1, total: manifest.configs.length,
    id: item.id, stage: 'run', status: ran.status, signal: ran.signal,
    stderr: ran.stderr?.slice(-2000), stdoutTail: ran.stdout?.slice(-1200) })}\n`, { flag: 'a' });
  if (ran.status !== 0) throw new Error(`run failed for ${item.id}; preserved ${log}`);
  if ((i + 1) % 8 === 0 || i + 1 === manifest.configs.length)
    process.stdout.write(`[${i + 1}/${manifest.configs.length}] ${item.id}: ${ran.stdout.trim().split(/\r?\n/).at(-1)}\n`);
}

const complete = { status: 'ALL_XORB_EXTENSION_JOBS_COMPLETE', configs: manifest.configs.length,
  battles: manifest.design.totalNewBattles, elapsedSeconds: (Date.now() - started) / 1000,
  manifestSha256: sha(manifestBytes), parentManifestSha256: manifest.parentManifestSha256 };
fs.writeFileSync(path.join(out, 'runner-complete.json'), `${JSON.stringify(complete, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify(complete));
