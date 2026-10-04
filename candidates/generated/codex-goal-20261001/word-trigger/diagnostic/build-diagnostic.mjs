import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

// Compile and freeze a replay plan only. Never invokes java.exe or a competition.
const here = import.meta.dirname;
const root = path.resolve(here, '../../../../..');
const metadata = path.join(root, 'tools/engine-acceleration-20261001/measurements/differential-v1/baseline-r1-forward.json');
const archive = JSON.parse(fs.readFileSync(metadata));
const job = archive.jobs.find(job => job.id === 'baseline-r1-forward-median');
if (!job || job.battles !== 50 || job.fixture !== 'median') throw new Error('Expected original median 50-war job');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const record = file => ({ path: file, sha256: hash(file), bytes: fs.statSync(file).size });
const engineJar = job.command.args[job.command.args.indexOf('-jar') + 1];
const expectedEngineSha256 = '31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d';
const source = path.join(here, 'DeathDiagnosticMain.java');
const javac = path.join(root, 'tools/temurin8-jdk/jdk8u504-b01/bin/javac.exe');
const classes = path.join(here, 'classes');
const replay = path.join(here, 'replay-original');
const planPath = path.join(here, 'replay-plan.json');
const originalArgs = job.command.args.slice(job.command.args.indexOf('-jar') + 2);
const flagValue = flag => originalArgs[originalArgs.indexOf(flag) + 1];
const baselineScores = flagValue('--outputFile');
const baselineTelemetry = flagValue('--telemetryFile');
const verify = () => {
  if (hash(engineJar) !== expectedEngineSha256) throw new Error('Original JAR changed');
  for (const input of job.inputs) if (hash(input.path) !== input.sha256) throw new Error(`Archived input changed: ${input.path}`);
  if (hash(baselineScores) !== job.scoreSha256) throw new Error('Archived scores changed');
  if (hash(baselineTelemetry) !== job.telemetrySha256) throw new Error('Archived telemetry changed');
};
verify();
if (fs.existsSync(classes) || fs.existsSync(replay) || fs.existsSync(planPath)) throw new Error('Refusing to replace diagnostic outputs');
fs.mkdirSync(classes);
fs.mkdirSync(replay);
const compileArgs = ['-source', '8', '-target', '8', '-encoding', 'UTF-8', '-cp', engineJar,
  '-sourcepath', here, '-d', classes, source];
const compiled = spawnSync(javac, compileArgs, { encoding: 'utf8', windowsHide: true, timeout: 60000, maxBuffer: 1024 * 1024 });
if (compiled.status !== 0) throw new Error(JSON.stringify({ status: compiled.status, error: compiled.error?.message,
  stdout: compiled.stdout, stderr: compiled.stderr }));
const outputs = { scores: path.join(replay, 'scores.csv'), telemetry: path.join(replay, 'telemetry.csv'),
  diagnosticsJsonl: path.join(replay, 'deaths.jsonl'), stderr: path.join(replay, 'process.stderr.txt') };
const args = [...originalArgs];
args[args.indexOf('--outputFile') + 1] = outputs.scores;
args[args.indexOf('--telemetryFile') + 1] = outputs.telemetry;
verify();
const plan = { createdAt: new Date().toISOString(), status: 'compiled-not-run', baselineJobId: job.id,
  expectedWars: job.battles, seed: job.seed, metadata: record(metadata), engineJar: record(engineJar),
  baselineScores: record(baselineScores), baselineTelemetry: record(baselineTelemetry),
  inputs: job.inputs.map(input => record(input.path)), source: record(source), builder: record(import.meta.filename),
  compiledClasses: fs.readdirSync(classes).filter(name => name.endsWith('.class')).map(name => record(path.join(classes, name))),
  compileCommand: { executable: javac, args: compileArgs },
  compileStdout: compiled.stdout, compileStderr: compiled.stderr,
  command: { executable: job.command.java, args: ['-cp', classes + path.delimiter + engineJar,
    'DeathDiagnosticMain', ...args] }, outputs,
  acceptance: 'Run all original 50 wars. Require exact byte equality of scores and standard telemetry against baseline before interpreting death diagnostics. This is not a warrior-score improvement test.',
  notes: ['No java.exe or battle launch has occurred in this build.',
    'Original staged directories are reused read-only so their names and unsorted Zombie enumeration remain unchanged.',
    'Only output paths and the observer main class differ from the original serial job; engine seed/permutation logic remains original.',
    'stdout contains JSONL. The original score writer status line is routed to stderr; score CSV formatting remains original.'] };
fs.writeFileSync(planPath, JSON.stringify(plan, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ plan: record(planPath), source: record(source), compiledClasses: plan.compiledClasses,
  expectedWars: plan.expectedWars, baselineScoreSha256: plan.baselineScores.sha256,
  baselineTelemetrySha256: plan.baselineTelemetry.sha256, launched: false }, null, 2));
