import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '../..');
const output = path.join(import.meta.dirname, 'profiles');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const parent = JSON.parse(fs.readFileSync(path.join(root, 'experiments/claude-synthesis-audit-20260930/fresh-m050.json')));
const ranked = [...parent.runs].sort((a, b) => a.elapsedSeconds - b.elapsedSeconds);
const which = process.argv[2] ?? 'median';
if (!['fast', 'median', 'slow'].includes(which)) throw new Error('usage: node profile-baseline.mjs [fast|median|slow]');
const run = which === 'fast' ? ranked[0] : which === 'slow' ? ranked.at(-1) : ranked[Math.floor(ranked.length / 2)];
const destination = path.join(output, which);
if (fs.existsSync(destination)) throw new Error(`Refusing to reuse ${destination}`);
const java = run.command.executable;
const originalArgs = run.command.args;
const jar = originalArgs[originalArgs.indexOf('-jar') + 1];
if (hash(fs.readFileSync(jar)) !== parent.engineJar.sha256) throw new Error('Engine changed');
for (const record of [...Object.values(run.inputs).flat(), ...run.zombies]) {
  if (hash(fs.readFileSync(record.target)) !== record.sha256) throw new Error(`Archived input changed: ${record.target}`);
}
fs.mkdirSync(destination, { recursive: true });
const copied = [];
for (const [kind, records] of [['survivors', Object.values(run.inputs).flat()], ['zombies', run.zombies]]) {
  const directory = path.join(destination, kind);
  fs.mkdirSync(directory);
  for (const record of records) {
    const target = path.join(directory, path.basename(record.target));
    fs.copyFileSync(record.target, target, fs.constants.COPYFILE_EXCL);
    copied.push({ path: target, sha256: hash(fs.readFileSync(target)) });
  }
}
const scorePath = path.join(destination, 'scores.csv');
const gcPath = path.join(destination, 'gc.log');
const args = [...originalArgs];
for (const [flag, value] of [['--warriorsDir', path.join(destination, 'survivors')], ['--zombiesDir', path.join(destination, 'zombies')], ['--outputFile', scorePath]]) args[args.indexOf(flag) + 1] = value;
args.unshift('-Xprof', `-Xloggc:${gcPath}`, '-XX:+PrintGCDetails', '-XX:+PrintGCTimeStamps');
const startedAt = new Date().toISOString();
const start = process.hrtime.bigint();
const child = spawnSync(java, args, { encoding: 'utf8', windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
const elapsedSeconds = Number(process.hrtime.bigint() - start) / 1e9;
fs.writeFileSync(path.join(destination, 'stdout.txt'), child.stdout ?? '', { flag: 'wx' });
fs.writeFileSync(path.join(destination, 'stderr.txt'), child.stderr ?? '', { flag: 'wx' });
const scores = fs.existsSync(scorePath) ? fs.readFileSync(scorePath, 'utf8') : '';
const normalize = text => text.replace(/\r\n/g, '\n').trim();
const result = { which, startedAt, elapsedSeconds, sourceRun: run.runId, battles: run.battles,
  command: { java, args }, copied, engineSha256: parent.engineJar.sha256,
  processStatus: child.status, processError: child.error?.message ?? null,
  scoresIdenticalToArchive: normalize(scores) === normalize(run.rawScoreText),
  completedWarsReported: (child.stdout ?? '').includes(`Competition is over. Ran ${run.battles} wars`),
  caveat: 'Sample profiler and existing concurrent workloads affect timings; this run locates hotspots, not an optimization speedup estimate.' };
fs.writeFileSync(path.join(destination, 'result.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(result, null, 2));
if (child.status !== 0 || !result.scoresIdenticalToArchive || !result.completedWarsReported) process.exitCode = 1;
