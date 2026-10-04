import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { equal, sha } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const frozen = path.join(here, 'fourth-holdout/frozen');
const root = path.join(repo, 'experiments/claude-e1p3-fourth-holdout-20261001');
if (fs.existsSync(root)) throw new Error(`refusing existing experiment directory ${root}`);
const manifestBytes = fs.readFileSync(path.join(frozen, 'manifest.json'));
equal(sha(manifestBytes), fs.readFileSync(path.join(frozen, 'manifest.json.sha256'), 'utf8').trim(), 'manifest checksum');
const manifest = JSON.parse(manifestBytes);
const record = file => {
  const bytes = fs.readFileSync(file);
  return { path: path.resolve(file), bytes: bytes.length, sha256: sha(bytes) };
};
const verifyInputs = () => manifest.files.forEach(file => equal(record(file.path), file, `frozen input ${file.path}`));
verifyInputs();
const tool = path.join(repo, 'tools/engine-acceleration-20261001/runtime/research-batch.mjs');
const jobs = manifest.design.panels * manifest.design.arms.length;
fs.mkdirSync(path.join(root, 'accelerated'), { recursive: true });
const logPath = path.join(root, 'run-log.jsonl'), start = Date.now();
for (let p = 1; p <= manifest.design.panels; p++) for (const arm of manifest.design.arms) {
  const index = (p - 1) * manifest.design.arms.length + manifest.design.arms.indexOf(arm) + 1;
  const id = `panel-${String(p).padStart(2, '0')}-${arm}`;
  const config = path.join(frozen, 'configs', `${id}.json`), output = path.join(root, 'accelerated', id);
  const log = (stage, result) => fs.appendFileSync(logPath, `${JSON.stringify({ at: new Date().toISOString(), index,
    total: jobs, id, stage, status: result.status, signal: result.signal,
    stderr: result.stderr?.slice(-3000), stdoutTail: result.stdout?.slice(-1200) })}\n`, { flag: 'a' });
  verifyInputs();
  let result = spawnSync(process.execPath, [tool, 'prepare', config, output], { cwd: repo, encoding: 'utf8', windowsHide: true });
  log('prepare', result);
  if (result.status !== 0) throw new Error(`prepare failed for ${id}; see ${logPath}`);
  verifyInputs();
  result = spawnSync(process.execPath, [tool, 'run', output], { cwd: repo, encoding: 'utf8', windowsHide: true });
  log('run', result);
  if (result.status !== 0) throw new Error(`run failed for ${id}; see ${logPath}`);
  if (index % 3 === 0 || index === jobs)
    process.stdout.write(`[${index}/${jobs}] ${id}: ${result.stdout.trim().split(/\r?\n/).at(-1)}\n`);
}
const completion = { status: 'ALL_FOURTH_HOLDOUT_JOBS_COMPLETE', configs: jobs, battles: manifest.design.totalBattles,
  elapsedSeconds: (Date.now() - start) / 1000, manifestSha256: sha(manifestBytes) };
fs.writeFileSync(path.join(root, 'runner-complete.json'), `${JSON.stringify(completion, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify(completion));
