// Authoring/freeze only. Never assembles, reads outcomes, or launches processes.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assert, equal, sha, hashFile, read, text, record, check, seedRange, overlaps } from '../bootstrap-holdout/protocol.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../../..');
const screen = path.join(here, 'screen'), manifestPath = path.join(screen, 'manifest.json');
const mode = process.argv[2], suite = 'codex-goal-20261001-shift-quantizer-screen';
assert(process.argv.length === 3 && ['--preflight', '--freeze', '--verify'].includes(mode), 'usage: node generate-screen.mjs --preflight|--freeze|--verify');
const write = (file, value) => fs.writeFileSync(file, value, { flag: 'wx' });
if (mode === '--verify') {
  equal(hashFile(manifestPath), fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim(), 'screen manifest checksum');
  const manifest = read(manifestPath); manifest.files.forEach(check);
  equal(manifest.protocol.arms, ['m050', 'shift_b'], 'arm membership');
  console.log(JSON.stringify({ status: 'INPUTS_VERIFIED', files: manifest.files.length, manifestSha256: hashFile(manifestPath) }));
  process.exit(0);
}
assert(!fs.existsSync(screen), 'Refusing existing screen directory, including an interrupted prior draw');
const holdoutFolder = path.resolve(here, '../bootstrap-holdout/frozen');
const holdoutFile = path.join(holdoutFolder, 'manifest.json');
equal(hashFile(holdoutFile), '199c261970f36c1850100875fb20cac14935cd81a749fa55e081463bdecc253a', 'frozen bootstrap holdout');
const holdout = read(holdoutFile); holdout.files.forEach(check);
const baselineSource = path.join(root, 'final/ChimeraB.asm'), baselineBuild = path.join(root, 'build/final/manifest.json');
equal(hashFile(baselineSource), '6c909366137b736bf693090093d83a8c1436f7817ccc2cea51b3ea53bfc46144', 'exact m050 B source');
equal(hashFile(baselineBuild), 'e33d2761faf96e6ddc06924372a6764e178bb1f65ce6c5e5d613b43bf18ce3e9', 'original m050 assembly manifest');
const source = path.join(here, 'B-shift-quantizer.asm'), binary = path.join(here, 'build/B-shift-quantizer');
const assemblyPath = path.join(here, 'build/manifest.json'), assembly = read(assemblyPath);
assert(Array.isArray(assembly) && assembly.length === 1, 'Need exactly one assembled research B');
const built = assembly[0];
equal(path.resolve(built.input), source, 'assembled source path'); equal(path.resolve(built.output), binary, 'assembled output path');
equal(built.sourceSha256, hashFile(source), 'assembled source hash'); equal(built.binarySha256, hashFile(binary), 'assembled binary hash');
const normalize = value => value.split(/\r?\n/).map(line => line.split(';')[0].trim()).filter(Boolean).join('\n');
const expectedSource = normalize(fs.readFileSync(baselineSource, 'utf8'))
  .replace('mov al, ah\nxor ah, ah\nmov ch, 03Ch', 'mov cx, 03C08h\nshr ax, cl').replace('times 2 db 0CCh', 'times 3 db 0CCh');
equal(normalize(fs.readFileSync(source, 'utf8')), expectedSource, 'only quantizer/padding source changes');
const baselineA = path.join(holdoutFolder, 'build/m050/A'), baselineB = path.join(holdoutFolder, 'build/m050/B');
const old = fs.readFileSync(baselineB), actual = fs.readFileSync(binary);
equal(old.length, 117, 'm050 B length'); equal(old.subarray(0x16, 0x1c).toString('hex'), '88e030e4b53c', 'original quantizer bytes');
equal(old.subarray(0x2a, 0x2e).toString('hex'), 'eb02cccc', 'original skipped padding');
const expected = Buffer.concat([old.subarray(0, 0x16), Buffer.from('b9083cd3e8', 'hex'), old.subarray(0x1c, 0x2a), Buffer.from('eb03cccccc', 'hex'), old.subarray(0x2e)]);
assert(actual.equals(expected) && built.size === 117, 'Variant must be exactly the 117-byte quantizer splice; suffix at 0x2e and worker at 0x64 unchanged');
const leaFolder = path.resolve(here, '../lea-confirmation'), panelFile = path.join(leaFolder, 'panel-2-m050.json');
equal(hashFile(panelFile), '87fd2a6f76bcdf5a2be4f136429a555fc7dc806cc172046f249b64604ed636cf', 'frozen senior panel 2');
const panel = read(panelFile);
const cohorts = panel.cohorts.map(c => ({ id: c.id, opponents: c.opponents.map(t => ({ name: t.name, warriors: t.warriors.map(f => path.resolve(leaFolder, f)) })) }));
const zombies = panel.zombies.map(z => ({ name: z.name, path: path.resolve(leaFolder, z.path) }));
assert(cohorts.length === 25 && cohorts.every(c => c.opponents.length === 3 && new Set(c.opponents.map(t => t.name)).size === 3), '25 distinct senior triples required');
const counts = {};
for (const team of cohorts.flatMap(c => c.opponents)) { assert(team.name.startsWith('A_'), 'non-senior team'); counts[team.name] = (counts[team.name] ?? 0) + 1; }
assert(Object.keys(counts).length === 62 && Object.values(counts).filter(n => n === 2).length === 13 && Object.values(counts).every(n => n === 1 || n === 2), 'wrong panel exposure');
const excludedRanges = [...new Map([...holdout.randomness.excludedRanges, ...holdout.randomness.seedRanges].map(r => [JSON.stringify(r), r])).values()];
for (const range of excludedRanges) equal(range, seedRange(range.seed, range.lastWarSeed - range.firstWarSeed + 1), 'prior Java seed range');
const external = new Map(holdout.files.map(item => [item.path, item]));
for (const file of [holdoutFile, baselineSource, baselineBuild, source, binary, assemblyPath, panelFile,
  path.join(here, 'generate-screen.mjs'), path.join(here, 'README.md'), path.join(root, 'assemble.mjs')]) external.set(file, record(file));
const sourceFiles = [...external.values()]; sourceFiles.forEach(check);
const validationFile = path.join(here, 'validation/result.json'), validation = read(validationFile);
equal(validation.status, 'PASS', 'original-engine semantic fixture');
equal(validation.quantizerInputs, 65536, 'exhaustive input count');
equal(validation.inertLegalOffsets, 79, 'inert bootstrap sample');
equal(validation.exitCode, 0, 'semantic fixture success');
validation.files.forEach(check);
sourceFiles.push(record(validationFile), ...validation.files);
if (mode === '--preflight') {
  console.log(JSON.stringify({ status: 'PREFLIGHT_ONLY', entropyDrawn: false, variantBytes: actual.length, variantSha256: built.binarySha256,
    arms: ['m050', 'shift_b'], battlesPerArm: 500, excludedRanges: excludedRanges.length })); process.exit(0);
}
fs.mkdirSync(screen); // Claim before drawing; never redraw/overwrite an attempt.
const seed = `shift-quantizer-screen-20261001-${crypto.randomBytes(12).toString('hex')}`, proposed = seedRange(seed, 20);
const randomness = { drawnAt: new Date().toISOString(), provenance: 'One crypto.randomBytes(12) draw after complete assembly/provenance preflight; no outcome access and no automatic redraw',
  seed, range: proposed, excludedRanges, collisions: excludedRanges.filter(oldRange => overlaps(proposed, oldRange)) };
write(path.join(screen, 'randomness.json'), text(randomness));
assert(randomness.collisions.length === 0, 'Seed collision recorded; stop without redraw');
const frozen = path.join(screen, 'frozen'); fs.mkdirSync(frozen);
const copies = [['m050-A', baselineA], ['m050-B', baselineB], ['shift-B', binary]].map(([name, original]) => {
  const target = path.join(frozen, name); fs.copyFileSync(original, target, fs.constants.COPYFILE_EXCL);
  equal(hashFile(target), hashFile(original), 'immutable copy'); return record(target);
});
const configs = ['m050', 'shift_b'].map(arm => ({ arm, path: path.join(screen, `${arm}.json`), config: {
  experimentId: `${suite}-${arm}`, java: holdout.java.path, jar: holdout.engine.path,
  outputPath: path.join(screen, 'results', `${arm}.json`), runDirectory: path.join(screen, 'runs', arm),
  candidate: { name: 'COD_pair', warriors: [path.join(frozen, 'm050-A'), path.join(frozen, arm === 'm050' ? 'm050-B' : 'shift-B')] },
  battles: 20, threads: 1, parallel: false, telemetry: false, seeds: [seed], cohorts, zombies,
} }));
for (const item of configs) write(item.path, text(item.config));
sourceFiles.forEach(check);
const manifest = { schemaVersion: 1, suite, frozenAt: new Date().toISOString(),
  hypothesis: 'B-only quantizer fusion: three instructions/six bytes become two/five; three skipped CC bytes retain downstream offsets and 117-byte length; A remains exact m050.',
  protocol: { arms: ['m050', 'shift_b'], candidateName: 'COD_pair', panel: 2, cohortCount: 25, seeds: [seed], seedRanges: [proposed],
    battlesPerBlock: 20, battlesPerArm: 500, totalBattles: 1000, uniqueSeniorTeams: 62, exposureCounts: counts, threads: 1, parallel: false, telemetry: false },
  decisionPlan: { metric: 'team points per battle; not win percentage', primary: 'mean of 25 matched cohort deltas: shift_b minus exact m050',
    selection: 'Advance only if complete paired broad-screen mean delta > 0. Descriptive t(df=24) 95% interval only; no adaptive extension or old-result pooling.',
    boundary: 'A positive screen requires a new matched holdout against BOTH m049 and m050. No champion, final replacement, unseen-team or universal claim.' },
  randomness, assembly: { manifest: record(assemblyPath), source: record(source), binary: record(binary), entry: built },
  engine: holdout.engine, java: holdout.java, runner: holdout.runner, researchRuntime: holdout.researchRuntime,
  configs: configs.map(item => ({ arm: item.arm, ...record(item.path), battles: 500 })),
  files: [...sourceFiles, ...copies, record(path.join(screen, 'randomness.json')), ...configs.map(item => record(item.path))] };
const serialized = text(manifest); write(manifestPath, serialized); write(`${manifestPath}.sha256`, `${sha(serialized)}\n`);
console.log(JSON.stringify({ status: 'FROZEN_NO_BATTLES_LAUNCHED', manifest: manifestPath, manifestSha256: sha(serialized),
  variantSha256: built.binarySha256, seedRange: proposed, configs: configs.map(c => c.path), battlesPerArm: 500 }));
