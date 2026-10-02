// Bounded semantic checks only. All generated artifacts stay beside this script.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const here = import.meta.dirname;
const root = path.resolve(here, '../../..');
const lane = path.dirname(here);
const engine = path.join(root, 'repos/corewars8086-6.0.0-deterministic');
const jar = path.join(engine, 'target/corewars8086-6.0.0-jar-with-dependencies.jar');
const java = path.join(root, 'tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe');
const digest = data => crypto.createHash('sha256').update(data).digest('hex');
const record = file => ({ path: path.relative(root, file).replaceAll('\\', '/'), sha256: digest(fs.readFileSync(file)) });
const normalize = text => text.replaceAll('\r\n', '\n');
const expectedJar = '31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d';
if (record(jar).sha256 !== expectedJar) throw Error('Original JAR changed');
const packagePath = 'il/co/codeguru/corewars8086';
const sourceFiles = ['cpu/Cpu.java', 'memory/RestrictedAccessRealModeMemory.java', 'memory/RealModeMemoryImpl.java'];
const controlSources = sourceFiles.map(file => {
  const original = path.join(engine, 'src/main/java', packagePath, file);
  const control = path.join(lane, 'source-control/src', packagePath, file);
  if (normalize(fs.readFileSync(original, 'utf8')) !== normalize(fs.readFileSync(control, 'utf8')))
    throw Error(`Source-control is not an exact normalized original: ${file}`);
  return { original: record(original), control: record(control) };
});
function filesUnder(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
    .flatMap(e => e.isDirectory() ? filesUnder(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
function jsSeedLines() {
  const values = ['all-001', 'all-002', '001', '-1', '2147483648', '9223372036854775807', '9223372036854775808', '\u05d0\ud83d\ude0a'];
  return values.map((value, i) => {
    let hash = 0;
    for (let j = 0; j < value.length; j++) hash = (Math.imul(31, hash) + value.charCodeAt(j)) | 0;
    let seed = BigInt(hash);
    if (/^-?\d+$/.test(value)) {
      const parsed = BigInt(value);
      if (parsed >= -(1n << 63n) && parsed < 1n << 63n) seed = parsed;
    }
    return `seed-${i}\thash=${hash},first=${seed},next=${BigInt.asIntN(64, seed + 1n)}`;
  });
}
const variants = process.argv.slice(2);
if (!variants.length) variants.push('source-control', 'int87');
for (const name of variants) if (!/^[a-zA-Z0-9_-]+$/.test(name) || name === 'original') throw Error('Bad overlay name');
const output = path.join(here, `run-${new Date().toISOString().replaceAll(/[:.]/g, '-')}`);
fs.mkdirSync(output);
const manifest = {
  createdAt: new Date().toISOString(), note: 'Semantic differential only; not a speed benchmark or battle proof.',
  java: record(java), jar: record(jar), harnessSource: record(path.join(here, 'EngineDifferential.java')),
  harnessClasses: filesUnder(path.join(here, 'classes')).map(record), runner: record(import.meta.filename), controlSources, runs: []
};
let reference;
for (const variant of ['original', ...variants]) {
  const overlay = path.join(lane, variant, 'classes');
  const cp = [path.join(here, 'classes'), ...(variant === 'original' ? [] : [overlay]), jar].join(path.delimiter);
  const args = ['-cp', cp, 'EngineDifferential'];
  const before = variant === 'original' ? [] : filesUnder(overlay).map(record);
  const child = spawnSync(java, args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
  const stdout = normalize(child.stdout ?? '');
  const stderr = normalize(child.stderr ?? '');
  fs.writeFileSync(path.join(output, `${variant}.tsv`), stdout);
  fs.writeFileSync(path.join(output, `${variant}.stderr.txt`), stderr);
  const entry = { variant, args, classes: before, exitCode: child.status, error: child.error?.message,
    stdoutSha256: digest(stdout), stderrSha256: digest(stderr), equalToOriginal: reference == null ? null : reference === stdout };
  manifest.runs.push(entry);
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  if (child.status !== 0 || stderr || !stdout.endsWith('COMPLETE\tall semantic assertions passed\n'))
    throw Error(`${variant} fixture failed; see ${output}`);
  for (const line of jsSeedLines()) if (!stdout.split('\n').includes(line)) throw Error(`Java/JS seed disagreement: ${line}`);
  if (reference == null) reference = stdout;
  else if (reference !== stdout) {
    const a = reference.split('\n'), b = stdout.split('\n');
    const index = a.findIndex((line, i) => line !== b[i]);
    throw Error(`${variant} differs at line ${index + 1}:\noriginal: ${a[index]}\nvariant: ${b[index]}`);
  }
  for (const pinned of before) if (record(path.join(root, pinned.path)).sha256 !== pinned.sha256) throw Error('Overlay mutated during run');
  console.log(`${variant}: ${stdout.trimEnd().split('\n').length} lines, SHA256 ${entry.stdoutSha256}, PASS`);
}
console.log(`Artifacts: ${output}`);
