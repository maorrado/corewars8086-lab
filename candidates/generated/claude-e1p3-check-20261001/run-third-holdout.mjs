import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { record, sha, equal } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const frozen = path.join(here, 'third-holdout/frozen');
const root = path.join(repo, 'experiments/claude-e1p3-third-holdout-20261001');
const manifestBytes = fs.readFileSync(path.join(frozen, 'manifest.json'));
equal(sha(manifestBytes), fs.readFileSync(path.join(frozen, 'manifest.json.sha256'), 'utf8').trim(), 'manifest hash');
const manifest = JSON.parse(manifestBytes);
for (const file of manifest.files) equal(record(file.path), file, `frozen input ${file.path}`);
const tool = path.join(repo, 'tools/engine-acceleration-20261001/runtime/research-batch.mjs');
const jobs = [];
for (let p = 1; p <= 8; p++) for (const arm of manifest.design.arms)
  jobs.push({ panel: `panel-${String(p).padStart(2, '0')}`, arm });
const logPath = path.join(root, 'run-log.jsonl');
if (fs.existsSync(logPath)) throw new Error(`refusing existing run log ${logPath}`);
fs.mkdirSync(path.join(root, 'accelerated'), { recursive: true });
const start = Date.now();
for (let i = 0; i < jobs.length; i++) {
  const { panel, arm } = jobs[i], id = `${panel}-${arm}`;
  const config = path.join(frozen, 'configs', `${id}.json`), output = path.join(root, 'accelerated', id);
  const recordLog = (stage, result) => fs.appendFileSync(logPath, `${JSON.stringify({ at: new Date().toISOString(), index: i + 1,
    total: jobs.length, id, stage, status: result.status, code: result.status === 'signal' ? result.signal : result.status,
    stderr: result.stderr?.slice(-3000), stdoutTail: result.stdout?.slice(-1000) })}\n`, { flag: 'a' });
  for (const file of manifest.files) equal(record(file.path), file, `pre-run input ${file.path}`);
  let result = spawnSync(process.execPath, [tool, 'prepare', config, output], { cwd: repo, encoding: 'utf8', windowsHide: true });
  recordLog('prepare', result);
  if (result.status !== 0) throw new Error(`prepare failed for ${id}; see ${logPath}`);
  result = spawnSync(process.execPath, [tool, 'run', output], { cwd: repo, encoding: 'utf8', windowsHide: true });
  recordLog('run', result);
  if (result.status !== 0) throw new Error(`run failed for ${id}; see ${logPath}`);
  process.stdout.write(`[${i + 1}/${jobs.length}] ${id}: ${result.stdout.trim().split(/\r?\n/).at(-1)}\n`);
}
const finish = { status: 'ALL_JOBS_COMPLETE', elapsedSeconds: (Date.now() - start) / 1000, jobs: jobs.length, battles: manifest.design.totalBattles };
fs.writeFileSync(path.join(root, 'runner-complete.json'), `${JSON.stringify(finish, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify(finish));
