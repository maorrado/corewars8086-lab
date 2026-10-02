// Resume the original, preregistered research after acceleration equivalence.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, spawn } from 'node:child_process';
const here = import.meta.dirname, root = path.resolve(here, '../..');
const base = path.join(root, 'candidates/generated/codex-goal-20261001');
const resultRoot = path.join(root, 'experiments/codex-goal-20261001/accelerated-screens');
const runtime = path.join(here, 'runtime/research-batch.mjs'), audit = path.join(here, 'audit-derived.mjs');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
function checked(args) {
  const child = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (child.status !== 0) throw new Error(child.stderr || child.error?.message || `Failed ${args[0]}`);
  return child.stdout;
}
if (fs.existsSync(resultRoot)) throw new Error('Refusing to reuse prior research outputs');
const replayAudit = checked([audit, 'replay', path.join(here, 'replay-panel1-m050'), path.join(base, 'lea-confirmation/results/panel-1-m050.json')]);
checked([path.join(base, 'bootstrap-designs/screen/analyze.mjs'), '--check-inputs']);
const bootstrapManifest = read(path.join(base, 'bootstrap-designs/screen/input-manifest.json'));
const camperFolder = path.join(base, 'conditional-camper-screen'), camperManifest = read(path.join(camperFolder, 'manifest.json'));
if (hash(path.join(camperFolder, 'manifest.json')) !== fs.readFileSync(path.join(camperFolder, 'manifest.json.sha256'), 'utf8').trim()) throw new Error('Camper manifest checksum');
for (const record of [...Object.values(camperManifest.references), camperManifest.source, camperManifest.assemblyManifest,
  ...camperManifest.authoring, ...camperManifest.binaries]) {
  if (hash(record.path) !== record.sha256 || fs.statSync(record.path).size !== record.bytes) throw new Error(`Camper input changed ${record.path}`);
}
const jobs = [
  ...bootstrapManifest.configs.map(record => ({ name: `bootstrap-${record.arm}`,
    config: path.resolve(base, 'bootstrap-designs/screen', record.path), expected: record.sha256,
    output: path.join(resultRoot, 'bootstrap', record.arm) })),
  ...camperManifest.configs.map(record => ({ name: `camper-${record.arm}`, config: record.path,
    expected: record.sha256, output: path.join(resultRoot, 'camper', record.arm) })),
];
for (const job of jobs) if (hash(job.config) !== job.expected) throw new Error(`Frozen configuration changed ${job.name}`);
fs.mkdirSync(resultRoot, { recursive: true });
fs.writeFileSync(path.join(resultRoot, 'replay-equivalence.json'), replayAudit, { flag: 'wx' });
fs.writeFileSync(path.join(resultRoot, 'resume-plan.json'), JSON.stringify({ createdAt: new Date().toISOString(),
  objective: 'Find a survivor pair generally better than exact m049 and m050, not only a counter duel.',
  frozenExperimentsUnchanged: true, maxConcurrentProcesses: 2, engineThreadsPerProcess: 1,
  originalEngineFinalConfirmationRequired: true, jobs,
  runtimeOverlays: [path.join(here, 'int87/classes'), path.join(here, 'war/combined/classes')] }, null, 2), { flag: 'wx' });
for (const job of jobs) {
  checked([runtime, 'prepare', job.config, job.output, '--overlay', path.join(here, 'int87/classes'),
    '--overlay', path.join(here, 'war/combined/classes')]);
}
console.log('Original research resumed: 5 bootstrap arms (2500 battles), 2 conditional-camper arms (400 battles). No game/config changes.');
let next = 0;
async function worker() {
  while (next < jobs.length) {
    const job = jobs[next++];
    console.log(`Starting ${job.name}`);
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [runtime, 'run', job.output], { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      const log = fs.createWriteStream(path.join(job.output, 'adapter.log'), { flags: 'wx' });
      let error = '';
      child.stdout.pipe(log, { end: false });
      child.stderr.on('data', chunk => { error += chunk; log.write(chunk); });
      child.on('error', reject);
      child.on('close', code => {
        log.end();
        if (code === 0) resolve(); else reject(new Error(`${job.name}: ${error || code}`));
      });
    });
    const result = read(path.join(job.output, 'result.json'));
    console.log(`${job.name}: ${result.aggregate.teamPerBattle.toFixed(9)}, ${result.aggregate.battles} battles complete`);
  }
}
await Promise.all([worker(), worker()]);
const bootstrap = checked([audit, 'bootstrap', path.join(resultRoot, 'bootstrap')]);
const camper = checked([audit, 'pair', path.join(resultRoot, 'camper/camper'), path.join(resultRoot, 'camper/control')]);
fs.writeFileSync(path.join(resultRoot, 'bootstrap-analysis.json'), bootstrap, { flag: 'wx' });
fs.writeFileSync(path.join(resultRoot, 'camper-analysis.json'), camper, { flag: 'wx' });
console.log(bootstrap);
console.log(camper);
