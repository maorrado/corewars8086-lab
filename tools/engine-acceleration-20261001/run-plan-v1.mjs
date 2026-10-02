import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { encodeBatch } from './runtime/batch-format.mjs';

const home = import.meta.dirname;
const root = path.resolve(home, '../..');
const [label, variantText, repeatText = '1', mode = 'validate'] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(label ?? '') || !variantText || !['validate', 'timing'].includes(mode)) {
  throw new Error('usage: node run-plan.mjs NEW-LABEL variants-comma-separated [repetitions] [validate|timing]');
}
const repeats = Number(repeatText);
if (!Number.isInteger(repeats) || repeats < 1 || repeats > 8) throw new Error('Invalid repetitions');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const archive = json(path.join(root, 'experiments/claude-synthesis-audit-20260930/fresh-m050.json'));
const ranked = [...archive.runs].sort((a, b) => a.elapsedSeconds - b.elapsedSeconds);
const fixtures = [ranked[0], ranked[Math.floor(ranked.length / 2)], ranked.at(-1)];
const fixtureNames = ['fast', 'median', 'slow'];
const jar = fixtures[0].command.args[fixtures[0].command.args.indexOf('-jar') + 1];
const java = fixtures[0].command.executable;
const cp = (...parts) => [...parts.map(p => path.join(home, p)), jar].join(path.delimiter);
const main = 'il.co.codeguru.corewars8086.CoreWarsEngine';
const profiles = {
  baseline: { prefix: ['-jar', jar] },
  'source-control': { prefix: ['-cp', cp('source-control/classes'), main] },
  int87: { prefix: ['-cp', cp('int87/classes'), main] },
  group: { prefix: ['-cp', cp('war/group-count/classes'), main] },
  speed: { prefix: ['-cp', cp('war/speed-lookup/classes'), main] },
  war: { prefix: ['-cp', cp('war/combined/classes'), main] },
  all: { prefix: ['-cp', cp('int87/classes', 'war/combined/classes'), main] },
  batch: { batch: true, prefix: ['-cp', cp('runtime/classes'), 'SerialBatchMain'] },
  'batch-all': { batch: true, prefix: ['-cp', cp('runtime/classes', 'int87/classes', 'war/combined/classes'), 'SerialBatchMain'] },
  serial: { prefix: ['-Xms128m', '-Xmx512m', '-XX:+UseSerialGC', '-XX:CICompilerCount=2', '-jar', jar] },
  c1: { prefix: ['-XX:TieredStopAtLevel=1', '-jar', jar] },
};
const variants = variantText.split(',');
if (new Set(variants).size !== variants.length || variants.some(name => !profiles[name]) || variants[0] !== 'baseline') {
  throw new Error('Unique known variants with baseline first required');
}
if (sha(fs.readFileSync(jar)) !== archive.engineJar.sha256) throw new Error('Original JAR mismatch');
const output = path.join(home, 'measurements', label);
if (fs.existsSync(output)) throw new Error(`Refusing existing experiment ${output}`);
fs.mkdirSync(output, { recursive: true });
const plan = { label, mode, repeats, variants, createdAt: new Date().toISOString(),
  engineSha256: archive.engineJar.sha256, java, javaSha256: sha(fs.readFileSync(java)),
  harnessSha256: sha(fs.readFileSync(new URL(import.meta.url))),
  fixtures: fixtures.map((run, i) => ({ id: fixtureNames[i], archiveRun: run.runId, battles: run.battles, seed: run.seed })),
  profiles: Object.fromEntries(variants.map(v => [v, profiles[v]])),
  ordering: 'Each repetition uses variants forward then reversed; each variant runs fast, median, slow. All jobs serial, full original battle counts.',
  caveat: 'Wall-clock measurement includes JVM, JIT, UI and simulation. Other pre-existing jobs may contend; paired balanced order mitigates but cannot eliminate host noise.' };
fs.writeFileSync(path.join(output, 'plan.json'), JSON.stringify(plan, null, 2), { flag: 'wx' });
const results = [];
const golden = new Map();

function stage(variant, repetition, orientation) {
  return fixtures.map((run, index) => {
    const id = `${variant}-r${repetition}-${orientation}-${fixtureNames[index]}`;
    const folder = path.join(output, id);
    fs.mkdirSync(folder);
    const inputs = [];
    for (const [kind, records] of [['survivors', Object.values(run.inputs).flat()], ['zombies', run.zombies]]) {
      const directory = path.join(folder, kind);
      fs.mkdirSync(directory);
      for (const record of records) {
        if (sha(fs.readFileSync(record.target)) !== record.sha256) throw new Error(`Archived file changed ${record.target}`);
        const target = path.join(directory, path.basename(record.target));
        fs.copyFileSync(record.target, target, fs.constants.COPYFILE_EXCL);
        inputs.push({ path: target, sha256: sha(fs.readFileSync(target)) });
      }
    }
    const args = run.command.args.slice(run.command.args.indexOf('-jar') + 2);
    for (const [flag, value] of [['--warriorsDir', path.join(folder, 'survivors')], ['--zombiesDir', path.join(folder, 'zombies')], ['--outputFile', path.join(folder, 'scores.csv')]]) {
      const location = args.indexOf(flag);
      if (location < 0) throw new Error(`Missing original argument ${flag}`);
      args[location + 1] = value;
    }
    if (mode === 'validate') args.push('--telemetryFile', path.join(folder, 'telemetry.csv'));
    return { id, folder, inputs, args, fixture: fixtureNames[index], original: run };
  });
}

function execute(args, location) {
  const start = process.hrtime.bigint();
  const child = spawnSync(java, args, { encoding: 'utf8', windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
  const seconds = Number(process.hrtime.bigint() - start) / 1e9;
  fs.writeFileSync(`${location}.stdout.txt`, child.stdout ?? '', { flag: 'wx' });
  fs.writeFileSync(`${location}.stderr.txt`, child.stderr ?? '', { flag: 'wx' });
  if (child.status !== 0 || child.error || /Exception|Error:/.test(child.stderr ?? '')) {
    throw new Error(`Failed ${location}: ${child.error?.message ?? child.stderr}`);
  }
  return { seconds, stdout: child.stdout, command: { java, args } };
}

function validate(job, variant, stdout) {
  const score = fs.readFileSync(path.join(job.folder, 'scores.csv'));
  // Exact original scores, not an approximate scalar comparison.
  if (score.toString() !== job.original.rawScoreText) throw new Error(`CSV differs from archive: ${job.id}`);
  const complete = `Competition is over. Ran ${job.original.battles} wars`;
  if (!stdout.includes(complete)) throw new Error(`Missing completion: ${job.id}`);
  let telemetrySha256 = null;
  if (mode === 'validate') {
    const telemetry = fs.readFileSync(path.join(job.folder, 'telemetry.csv'));
    telemetrySha256 = sha(telemetry);
    if (!golden.has(job.fixture)) {
      if (variant !== 'baseline') throw new Error('Missing original telemetry');
      golden.set(job.fixture, telemetry);
    }
    if (!telemetry.equals(golden.get(job.fixture))) throw new Error(`Telemetry differs: ${job.id}`);
    const rows = telemetry.toString().trim().split(/\r?\n/).slice(1);
    const wars = new Set(rows.map(row => Number(row.slice(0, row.indexOf(',')))));
    if (wars.size !== job.original.battles || Math.min(...wars) !== 0 || Math.max(...wars) !== job.original.battles - 1) throw new Error(`Telemetry battle count mismatch: ${job.id}`);
  }
  for (const input of job.inputs) if (sha(fs.readFileSync(input.path)) !== input.sha256) throw new Error('Staged input modified');
  return { id: job.id, fixture: job.fixture, battles: job.original.battles, seed: job.original.seed,
    scoreSha256: sha(score), telemetrySha256, exactArchiveScores: true, exactOriginalTelemetry: mode === 'validate', inputs: job.inputs };
}

for (let repetition = 1; repetition <= repeats; ++repetition) {
  for (const [orientation, order] of [['forward', variants], ['reverse', [...variants].reverse()]]) {
    for (const variant of order) {
      const jobs = stage(variant, repetition, orientation);
      const profile = profiles[variant];
      let record;
      if (profile.batch) {
        const file = path.join(output, `${variant}-r${repetition}-${orientation}.nul`);
        fs.writeFileSync(file, encodeBatch(jobs.map(({ id, args }) => ({ id, args }))), { flag: 'wx' });
        const execution = execute([...profile.prefix, file], file);
        const jobRecords = jobs.map(job => {
          const marker = new RegExp(`BATCH_V1_DONE ${job.id} (\\d+) (\\d+)`).exec(execution.stdout);
          if (!marker || Number(marker[1]) !== job.original.battles) throw new Error(`Missing batch completion ${job.id}`);
          return { ...validate(job, variant, execution.stdout), inJvmSeconds: Number(marker[2]) / 1e9 };
        });
        record = { variant, repetition, orientation, seconds: execution.seconds, command: execution.command, jobs: jobRecords };
      } else {
        const jobRecords = jobs.map(job => {
          const execution = execute([...profile.prefix, ...job.args], path.join(job.folder, 'process'));
          return { ...validate(job, variant, execution.stdout), seconds: execution.seconds, command: execution.command };
        });
        record = { variant, repetition, orientation, seconds: jobRecords.reduce((s, j) => s + j.seconds, 0), jobs: jobRecords };
      }
      results.push(record);
      fs.writeFileSync(path.join(output, `${variant}-r${repetition}-${orientation}.json`), JSON.stringify(record, null, 2), { flag: 'wx' });
      console.log(`${variant} r${repetition} ${orientation}: ${record.seconds.toFixed(3)}s; ${jobs.reduce((s,j)=>s+j.original.battles,0)} battles; exact output`);
    }
  }
}
const totals = Object.fromEntries(variants.map(variant => [variant, results.filter(r => r.variant === variant).reduce((sum, r) => sum + r.seconds, 0)]));
const summary = { ...plan, results, totalBattles: results.flatMap(r => r.jobs).reduce((n, j) => n + j.battles, 0), totals,
  speedup: Object.fromEntries(variants.map(v => [v, totals.baseline / totals[v]])),
  runtimeReductionPercent: Object.fromEntries(variants.map(v => [v, (1 - totals[v] / totals.baseline) * 100])) };
fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify(summary, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ totals, speedup: summary.speedup, totalBattles: summary.totalBattles }));
