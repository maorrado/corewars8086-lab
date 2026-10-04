import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { here, preparedPath, classesDirectory, outputDirectory, sourceNames, assert, equal, record, checkRecord, verifyFrozen, makeCommand } from './protocol.mjs';

// ROOT MUST REVIEW THIS FILE, protocol.mjs, the Java source, launcher and frozen
// inputs first. This script compiles only; it never runs a battle.
if (process.argv.length !== 2) throw new Error('usage: node prepare-replay.mjs');
const fixture = verifyFrozen();
const sources = sourceNames.map(name => record(path.join(here, name)));
for (const target of [preparedPath, classesDirectory, outputDirectory]) assert(!fs.existsSync(target), `Refusing existing preparation output: ${target}`);
fs.mkdirSync(classesDirectory);
const command = { executable: fixture.compiler.path,
  args: ['-encoding', 'UTF-8', '-source', '8', '-target', '8', '-cp', fixture.engineJar.path, '-d', classesDirectory, path.join(here, 'WriterAttributionMain.java')] };
const result = spawnSync(command.executable, command.args, { encoding: 'utf8', windowsHide: true, timeout: 120000 });
assert(!result.error && result.status === 0 && result.signal === null, `Compilation failed: ${result.error?.message ?? ''}\n${result.stdout}\n${result.stderr}`);
sources.forEach(checkRecord);
verifyFrozen();
const names = fs.readdirSync(classesDirectory).sort();
equal(names, ['WriterAttributionMain$Watch.class', 'WriterAttributionMain.class'], 'Unexpected compiled classes');
const classes = names.map(name => record(path.join(classesDirectory, name)));
fs.mkdirSync(outputDirectory);
const plan = { schemaVersion: 1, status: 'COMPILED_NOT_EXECUTED', sources, classes, classesDirectory, outputDirectory,
  frozen: fixture, compileCommand: command, compileStdout: result.stdout, compileStderr: result.stderr, command: makeCommand(fixture) };
fs.writeFileSync(preparedPath, JSON.stringify(plan, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: plan.status, prepared: record(preparedPath), sources, classes }, null, 2));
