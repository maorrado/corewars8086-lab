import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const here = import.meta.dirname;
export const root = path.resolve(here, '../../../..');
export const frozenPath = path.join(here, 'frozen-inputs.json');
export const preparedPath = path.join(here, 'prepared-plan.json');
export const classesDirectory = path.join(here, 'classes');
export const outputDirectory = path.join(here, 'replay');
export const sourceNames = ['WriterAttributionMain.java', 'frozen-inputs.json', 'protocol.mjs', 'prepare-replay.mjs', 'run-replay.mjs', 'README.md'];
export const assert = (ok, message) => { if (!ok) throw new Error(message); };
export const equal = (a, b, message) => assert(JSON.stringify(a) === JSON.stringify(b), message);
export const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export const record = file => ({ path: path.resolve(file), bytes: fs.statSync(file).size, sha256: hash(file) });
export const checkRecord = item => {
  const actual = record(item.path);
  assert(actual.bytes === item.bytes && actual.sha256 === item.sha256, `Frozen bytes changed: ${item.path}`);
};
export const resolveRecord = item => ({ ...item, path: path.resolve(root, item.path) });
export const value = (args, flag) => {
  assert(args.filter(arg => arg === flag).length === 1, `Missing/duplicate flag ${flag}`);
  return args[args.indexOf(flag) + 1];
};
export const javaSeed = text => {
  let result = 0;
  for (let i = 0; i < text.length; i++) result = (Math.imul(result, 31) + text.charCodeAt(i)) | 0;
  return result;
};

export function verifyFrozen() {
  const frozen = JSON.parse(fs.readFileSync(frozenPath));
  assert(frozen.schemaVersion === 1 && frozen.expectedWars === 125, 'Unexpected frozen fixture');
  equal(frozen.watched, ['COD_B1', 'COD_B2'], 'Unexpected watched m050 names');
  assert(frozen.seed === 'claude-synthesis-duel-1-cfec1882f8ac1f4fc47a2263', 'Unexpected archived seed');
  const records = ['metadata', 'config', 'engineJar', 'runtime', 'compiler'].map(key => resolveRecord(frozen[key]));
  const fixed = Object.fromEntries(['metadata', 'config', 'engineJar', 'runtime', 'compiler'].map((key, i) => [key, records[i]]));
  const archivedDirectory = path.resolve(root, frozen.archivedDirectory);
  const baselineScores = { path: path.join(archivedDirectory, frozen.baselineScores.name), bytes: frozen.baselineScores.bytes, sha256: frozen.baselineScores.sha256 };
  const inputs = frozen.inputs.map(({ name, ...item }) => ({ ...item, path: path.resolve(archivedDirectory, name) }));
  for (const item of [...records, baselineScores, ...inputs]) checkRecord(item);
  const result = JSON.parse(fs.readFileSync(fixed.metadata.path));
  const run = result.runs[0];
  assert(run.runId === frozen.runId && run.seed === frozen.seed && run.battles === frozen.expectedWars, 'Archived first run changed');
  assert(result.configSha256 === fixed.config.sha256 && path.resolve(result.configPath) === fixed.config.path, 'Archived config mismatch');
  assert(result.engineJar.sha256 === fixed.engineJar.sha256 && path.resolve(result.engineJar.path) === fixed.engineJar.path, 'Archived engine mismatch');
  assert(run.telemetry === null, 'Fixture unexpectedly contains telemetry');
  assert(run.rawScoreText === fs.readFileSync(baselineScores.path, 'utf8'), 'Archived score text differs from retained CSV');
  const args = ['-jar', fixed.engineJar.path, '--headless', '--comboSize', '2', '--battlesPerCombo', '125',
    '--seed', frozen.seed, '--threads', '1', '--warriorsDir', path.join(archivedDirectory, 'survivors'),
    '--zombiesDir', path.join(archivedDirectory, 'zombies'), '--outputFile', baselineScores.path, '--parallel=false'];
  equal(run.command, { executable: fixed.runtime.path, args }, 'Unexpected original command');
  const actualInputs = [...Object.values(run.inputs).flat(), ...run.zombies].map(item => ({ path: path.resolve(item.target), bytes: item.bytes, sha256: item.sha256 }));
  equal(actualInputs, inputs.map(({ path: file, bytes, sha256 }) => ({ path: file, bytes, sha256 })), 'Archived copied-input records changed');
  for (const directory of [path.join(archivedDirectory, 'survivors'), path.join(archivedDirectory, 'zombies')]) {
    const expected = inputs.filter(item => path.dirname(item.path) === directory).map(item => path.basename(item.path)).sort();
    const actual = fs.readdirSync(directory).sort();
    equal(actual, expected, 'Input directory membership changed');
    assert(actual.every(name => !name.includes('.') && fs.statSync(path.join(directory, name)).isFile()), 'Unsafe original input name');
  }
  for (const entry of frozen.captureEntries) {
    const bytes = fs.readFileSync(path.join(archivedDirectory, 'survivors', entry.name));
    const prefix = Buffer.from(entry.prefixHex, 'hex');
    assert(bytes.indexOf(prefix) === entry.offset && bytes.indexOf(prefix, entry.offset + 1) === -1, 'Captured-entry byte signature changed');
  }
  return { frozen, ...fixed, baselineScores, inputs, originalCommand: run.command, archivedDirectory };
}

export function makeCommand(fixture) {
  const args = fixture.originalCommand.args.slice(2);
  args[args.indexOf('--outputFile') + 1] = path.join(outputDirectory, 'scores.csv');
  return { executable: fixture.runtime.path, args: ['-cp', classesDirectory + path.delimiter + fixture.engineJar.path, 'WriterAttributionMain', ...args] };
}
