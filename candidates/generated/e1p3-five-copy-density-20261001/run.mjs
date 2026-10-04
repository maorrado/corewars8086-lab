import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { arms, equal, sha } from './model.mjs';
import { record } from '../codex-goal-20261001/bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../..');
const freeze = path.join(here, 'frozen'), out = path.join(repo, 'experiments/e1p3-five-copy-density-20261001');
if (fs.existsSync(out)) throw new Error(`refusing existing run directory ${out}`);
const manifestBytes = fs.readFileSync(path.join(freeze, 'manifest.json'));
equal(sha(manifestBytes), fs.readFileSync(path.join(freeze, 'manifest.json.sha256'), 'utf8').trim(), 'manifest checksum');
const manifest = JSON.parse(manifestBytes), tool = path.join(repo, 'tools/engine-acceleration-20261001/runtime/research-batch.mjs');
const verifyInputs = () => manifest.files.forEach(f => equal(record(f.path), f, `frozen input ${f.path}`));
verifyInputs();
const jobs = manifest.design.strata.flatMap(k => Array.from({ length: manifest.design.cohortsPerStratum }, (_, i) =>
  `k${k}-${String(i + 1).padStart(2, '0')}`).flatMap(cohort => arms.flatMap(arm => [1, 2].map(o => `${cohort}-${arm}-o${o}`))));
if (jobs.length !== manifest.design.configs) throw new Error('job count differs from frozen design');
fs.mkdirSync(path.join(out, 'accelerated'), { recursive: true });
const log = path.join(out, 'run-log.jsonl'), start = Date.now();
for (let i = 0; i < jobs.length; i++) {
  const id = jobs[i], configPath = path.join(freeze, 'configs', `${id}.json`), target = path.join(out, 'accelerated', id);
  verifyInputs();
  const prepared = spawnSync(process.execPath, [tool, 'prepare', configPath, target], { cwd: repo, encoding: 'utf8', windowsHide: true });
  fs.appendFileSync(log, `${JSON.stringify({ at: new Date().toISOString(), index: i + 1, total: jobs.length,
    id, stage: 'prepare', status: prepared.status, signal: prepared.signal, stderr: prepared.stderr?.slice(-2000), stdoutTail: prepared.stdout?.slice(-1000) })}\n`, { flag: 'a' });
  if (prepared.status !== 0) throw new Error(`prepare failed for ${id}; preserved ${log}`);
  verifyInputs();
  const ran = spawnSync(process.execPath, [tool, 'run', target], { cwd: repo, encoding: 'utf8', windowsHide: true });
  fs.appendFileSync(log, `${JSON.stringify({ at: new Date().toISOString(), index: i + 1, total: jobs.length,
    id, stage: 'run', status: ran.status, signal: ran.signal, stderr: ran.stderr?.slice(-2000), stdoutTail: ran.stdout?.slice(-1200) })}\n`, { flag: 'a' });
  if (ran.status !== 0) throw new Error(`run failed for ${id}; preserved ${log}`);
  if ((i + 1) % 8 === 0 || i + 1 === jobs.length)
    process.stdout.write(`[${i + 1}/${jobs.length}] ${id}: ${ran.stdout.trim().split(/\r?\n/).at(-1)}\n`);
}
const complete = { status: 'ALL_DENSITY_JOBS_COMPLETE', configs: jobs.length, battles: manifest.design.totalBattles,
  elapsedSeconds: (Date.now() - start) / 1000, manifestSha256: sha(manifestBytes) };
fs.writeFileSync(path.join(out, 'runner-complete.json'), `${JSON.stringify(complete, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify(complete));
