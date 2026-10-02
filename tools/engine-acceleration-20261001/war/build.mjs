import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

// Builds isolated classpath overlays only. It does not run battles or replace a JAR.
const here = import.meta.dirname;
const root = path.resolve(here, '../../..');
const baselineSource = path.join(root, 'repos/corewars8086-6.0.0-deterministic/src/main/java/il/co/codeguru/corewars8086/war/War.java');
const baselineJar = path.join(root, 'repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar');
const javac = path.join(root, 'tools/temurin8-jdk/jdk8u504-b01/bin/javac.exe');
const java = path.join(root, 'tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe');
const expectedSourceSha256 = 'dda01ecafa7091368bf677d064ddc01d4ec69149988a8b80c7ec7012b6256d2b';
const expectedJarSha256 = '31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d';
const variants = ['group-count', 'speed-lookup', 'combined'];
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const record = file => ({ path: file, sha256: sha256(file), bytes: fs.statSync(file).size });
const assertBaseline = () => {
  if (sha256(baselineSource) !== expectedSourceSha256) throw new Error('Baseline source changed');
  if (sha256(baselineJar) !== expectedJarSha256) throw new Error('Baseline engine JAR changed');
};
assertBaseline();
for (const variant of variants) {
  if (fs.existsSync(path.join(here, variant, 'classes'))) throw new Error(`Refusing to replace compiled overlay: ${variant}`);
}
if (fs.existsSync(path.join(here, 'build-manifest.json'))) throw new Error('Refusing to replace build manifest');

const outputs = [];
for (const variant of variants) {
  const sourceRoot = path.join(here, variant, 'src');
  const source = path.join(sourceRoot, 'il/co/codeguru/corewars8086/war/War.java');
  const classes = path.join(here, variant, 'classes');
  fs.mkdirSync(classes);
  const args = ['-source', '8', '-target', '8', '-encoding', 'UTF-8', '-cp', baselineJar,
    '-sourcepath', sourceRoot, '-d', classes, source];
  const compilation = spawnSync(javac, args, { encoding: 'utf8', windowsHide: true, maxBuffer: 1024 * 1024 });
  if (compilation.status !== 0) throw new Error(JSON.stringify({ variant, status: compilation.status,
    error: compilation.error?.message, stdout: compilation.stdout, stderr: compilation.stderr }));
  const compiledClass = path.join(classes, 'il/co/codeguru/corewars8086/war/War.class');
  outputs.push({ variant, source: record(source), compiledClass: record(compiledClass),
    compileCommand: { executable: javac, args },
    launchPrefix: { executable: java, args: ['-cp', classes + path.delimiter + baselineJar,
      'il.co.codeguru.corewars8086.CoreWarsEngine'] },
    compileStdout: compilation.stdout, compileStderr: compilation.stderr });
}
assertBaseline();
const manifest = { builtAt: new Date().toISOString(), baselineSource: record(baselineSource),
  baselineJar: record(baselineJar), compiler: record(javac), runtime: record(java),
  builder: record(import.meta.filename), outputs,
  note: 'Compilation only. No semantic tests or battles have been run. Each overlay replaces War.class only; baseline source and JAR are unchanged.' };
const manifestPath = path.join(here, 'build-manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ manifest: record(manifestPath), outputs }, null, 2));
