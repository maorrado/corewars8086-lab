import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

// Compile only. The replay launcher is recorded, never invoked here.
const here = import.meta.dirname;
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const record = file => ({ path: file, sha256: hash(file), bytes: fs.statSync(file).size });
const originalPlanPath = path.join(here, 'replay-plan.json');
const originalPlan = JSON.parse(fs.readFileSync(originalPlanPath));
const source = path.join(here, 'DeathDiagnosticMain.java');
const supersededSource = path.join(here, 'archive/DeathDiagnosticMain-no-ip.java');
const launcher = path.join(here, 'run-replay.mjs');
const classes = path.join(here, 'reviewed-classes');
const replay = path.join(here, 'replay-reviewed');
const planPath = path.join(here, 'replay-plan-reviewed.json');
const verify = () => {
  for (const item of [originalPlan.metadata, originalPlan.engineJar, originalPlan.baselineScores,
    originalPlan.baselineTelemetry, originalPlan.builder, ...originalPlan.inputs, ...originalPlan.compiledClasses]) {
    if (hash(item.path) !== item.sha256) throw new Error(`Original evidence changed: ${item.path}`);
  }
  if (hash(supersededSource) !== originalPlan.source.sha256) throw new Error('Original source archive differs');
};
verify();
const oldText = fs.readFileSync(supersededSource, 'utf8');
const anchor = '+ ",\\\"cs\\\":" + unsigned(s.getCS()) + ",\\\"ss\\\":" + unsigned(s.getSS())';
const replacement = '+ ",\\\"cs\\\":" + unsigned(s.getCS()) + ",\\\"ip\\\":" + unsigned(s.getIP()) + ",\\\"ss\\\":" + unsigned(s.getSS())';
if (!oldText.includes(anchor) || oldText.replace(anchor, replacement) !== fs.readFileSync(source, 'utf8')) {
  throw new Error('Expected only the explicit IP snapshot addition');
}
for (const output of [classes, replay, planPath]) if (fs.existsSync(output)) throw new Error(`Refusing to replace ${output}`);
fs.mkdirSync(classes);
fs.mkdirSync(replay);
const compileArgs = [...originalPlan.compileCommand.args];
compileArgs[compileArgs.indexOf('-d') + 1] = classes;
const compilation = spawnSync(originalPlan.compileCommand.executable, compileArgs,
  { encoding: 'utf8', windowsHide: true, timeout: 60000, maxBuffer: 1024 * 1024 });
if (compilation.status !== 0) throw new Error(JSON.stringify({ status: compilation.status,
  error: compilation.error?.message, stdout: compilation.stdout, stderr: compilation.stderr }));
const outputs = { scores: path.join(replay, 'scores.csv'), telemetry: path.join(replay, 'telemetry.csv'),
  diagnosticsJsonl: path.join(replay, 'deaths.jsonl'), stderr: path.join(replay, 'process.stderr.txt'),
  execution: path.join(replay, 'execution.json') };
const args = [...originalPlan.command.args];
args[args.indexOf('-cp') + 1] = classes + path.delimiter + originalPlan.engineJar.path;
args[args.indexOf('--outputFile') + 1] = outputs.scores;
args[args.indexOf('--telemetryFile') + 1] = outputs.telemetry;
verify();
const plan = { ...originalPlan, createdAt: new Date().toISOString(), status: 'compiled-awaiting-root-review-not-run',
  originalPlan: record(originalPlanPath), supersededSource: record(supersededSource),
  originalBuilder: originalPlan.builder, originalCompiledClasses: originalPlan.compiledClasses,
  source: record(source), builder: record(import.meta.filename), launcher: record(launcher),
  runtime: record(originalPlan.command.executable), compiler: record(originalPlan.compileCommand.executable),
  classesDirectory: classes, outputDirectory: replay,
  compiledClasses: fs.readdirSync(classes).filter(name => name.endsWith('.class')).map(name => record(path.join(classes, name))),
  compileCommand: { executable: originalPlan.compileCommand.executable, args: compileArgs },
  compileStdout: compilation.stdout, compileStderr: compilation.stderr,
  command: { executable: originalPlan.command.executable, args }, outputs,
  change: 'Only explicit unsigned IP was added to the snapshot. Original source is archived byte-for-byte; original plan and classes remain untouched.' };
fs.writeFileSync(planPath, JSON.stringify(plan, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ plan: record(planPath), source: record(source), compiledClasses: plan.compiledClasses,
  originalPlan: plan.originalPlan, launcher: plan.launcher, launched: false }, null, 2));
