import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { record, sha, equal } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../..');
const freeze = path.join(here, 'frozen'), root = path.join(repo, 'experiments/e1p3-xorb-screen-20261001');
const bytes = fs.readFileSync(path.join(freeze, 'manifest.json'));
equal(sha(bytes), fs.readFileSync(path.join(freeze, 'manifest.json.sha256'), 'utf8').trim(), 'manifest hash');
const manifest = JSON.parse(bytes), tool = path.join(repo, 'tools/engine-acceleration-20261001/runtime/research-batch.mjs');
for (const file of manifest.files) equal(record(file.path), file, `frozen input ${file.path}`);
const configs = manifest.design.scenarios.flatMap(s => manifest.design.arms.map(a => ({ id: `${s}-${a}`, path: path.join(freeze, 'configs', `${s}-${a}.json`) })));
const log = path.join(root, 'run-log.jsonl');
if (fs.existsSync(root)) throw new Error(`refusing existing experiment root ${root}`);
fs.mkdirSync(path.join(root, 'accelerated'), { recursive: true });
const start = Date.now();
for (let i = 0; i < configs.length; i++) {
  const c = configs[i], output = path.join(root, 'accelerated', c.id);
  for (const file of manifest.files) equal(record(file.path), file, `pre-run input ${file.path}`);
  for (const stage of ['prepare', 'run']) {
    const args = stage === 'prepare' ? [tool, 'prepare', c.path, output] : [tool, 'run', output];
    const result = spawnSync(process.execPath, args, { cwd: repo, encoding: 'utf8', windowsHide: true });
    fs.appendFileSync(log, `${JSON.stringify({ at: new Date().toISOString(), index: i + 1, total: configs.length,
      config: c.id, stage, status: result.status, signal: result.signal, stderr: result.stderr?.slice(-2500),
      stdoutTail: result.stdout?.slice(-1000) })}\n`, { flag: 'a' });
    if (result.status !== 0) throw new Error(`${stage} failed for ${c.id}; see ${log}`);
    if (stage === 'run') process.stdout.write(`[${i + 1}/${configs.length}] ${c.id}: ${result.stdout.trim().split(/\r?\n/).at(-1)}\n`);
  }
}
const complete = { status: 'ALL_SCREEN_JOBS_COMPLETE', configs: configs.length, battles: manifest.design.totalBattles,
  elapsedSeconds: (Date.now() - start) / 1000 };
fs.writeFileSync(path.join(root, 'runner-complete.json'), `${JSON.stringify(complete, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify(complete));
