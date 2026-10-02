import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const here = import.meta.dirname;
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const record = file => ({ path: file, sha256: hash(file), bytes: fs.statSync(file).size });
const manifestPath = path.join(here, 'build-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath));
const source = path.join(here, 'WarEdgeFixture.java');
const classes = path.join(here, 'edge-fixture-classes');
const resultsPath = path.join(here, 'edge-fixture-results.json');
if (fs.existsSync(classes) || fs.existsSync(resultsPath)) throw new Error('Refusing to replace edge-fixture outputs');
const verifyInputs = () => {
  for (const input of [manifest.baselineSource, manifest.baselineJar, manifest.compiler, manifest.runtime,
    ...manifest.outputs.flatMap(output => [output.source, output.compiledClass])]) {
    if (hash(input.path) !== input.sha256) throw new Error(`Frozen input changed: ${input.path}`);
  }
};
verifyInputs();
fs.mkdirSync(classes);
const compileArgs = ['-source', '8', '-target', '8', '-encoding', 'UTF-8', '-cp', manifest.baselineJar.path,
  '-sourcepath', here, '-d', classes, source];
const compilation = spawnSync(manifest.compiler.path, compileArgs,
  { encoding: 'utf8', windowsHide: true, timeout: 60000, maxBuffer: 1024 * 1024 });
if (compilation.status !== 0) throw new Error(JSON.stringify({ stage: 'compile', status: compilation.status,
  error: compilation.error?.message, stdout: compilation.stdout, stderr: compilation.stderr }));
const variants = [{ variant: 'baseline', classSource: manifest.baselineJar.path },
  ...manifest.outputs.map(output => ({ variant: output.variant,
    classSource: output.compileCommand.args[output.compileCommand.args.indexOf('-d') + 1],
    expectedClassSha256: output.compiledClass.sha256 }))];
const runs = [];
for (const variant of variants) {
  const classpath = [classes, variant.classSource, manifest.baselineJar.path].join(path.delimiter);
  const args = ['-Xms16m', '-Xmx128m', '-cp', classpath, 'WarEdgeFixture', variant.classSource];
  const result = spawnSync(manifest.runtime.path, args,
    { encoding: 'utf8', windowsHide: true, timeout: 30000, maxBuffer: 1024 * 1024 });
  if (result.status !== 0) throw new Error(JSON.stringify({ variant: variant.variant, status: result.status,
    error: result.error?.message, stdout: result.stdout, stderr: result.stderr }));
  const report = JSON.parse(result.stdout.trim());
  if (report.status !== 'PASS') throw new Error(`Fixture failed: ${variant.variant}`);
  if (variant.expectedClassSha256 && report.warClassSha256 !== variant.expectedClassSha256) {
    throw new Error(`Wrong class hash loaded for ${variant.variant}`);
  }
  runs.push({ variant: variant.variant, command: { executable: manifest.runtime.path, args },
    stdout: result.stdout, stderr: result.stderr, report });
}
verifyInputs();
const comparable = report => JSON.stringify(Object.fromEntries(Object.entries(report).filter(([key]) => key !== 'warClassSha256')));
if (!runs.every(run => comparable(run.report) === comparable(runs[0].report))) throw new Error('Semantic report mismatch');
const results = { completedAt: new Date().toISOString(), buildManifest: record(manifestPath),
  fixtureSource: record(source), runnerSource: record(import.meta.filename),
  fixtureClasses: fs.readdirSync(classes).filter(name => name.endsWith('.class')).map(name => record(path.join(classes, name))),
  compileCommand: { executable: manifest.compiler.path, args: compileArgs }, runs,
  note: 'Only method-level edge checks ran. No nextRound, nextOpcode, battles, or benchmarks. All four semantic reports agree.' };
fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ results: record(resultsPath), fixtureSource: record(source),
  reports: runs.map(run => ({ variant: run.variant, ...run.report })) }, null, 2));
