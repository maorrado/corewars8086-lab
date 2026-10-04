import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Source design and finite geometry only. No assembly, entropy or engine use.
const mode = process.argv[2] ?? '--check';
if (!['--check', '--write'].includes(mode) || process.argv.length > 3) throw Error('Usage: node generate.mjs [--check|--write]');
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../../..');
const relative = p => path.relative(root, p).split(path.sep).join('/');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const assert = (ok, message) => { if (!ok) throw Error(message); };
const hex = value => `0${value.toString(16).toUpperCase().padStart(4, '0')}h`;
const workerHex = 'a5f3a529d4292f8b3fb10931f6ab4fff1f';
const baselineSpecs = {
  A: { source: 'final/ChimeraA.asm', sourceSha256: 'b05ae79647c65b67d8486205597dc28c3c6467a80efbd9017bc257e2014999d8',
    binary: 'build/final/ChimeraA', bytes: 189, binarySha256: '0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44',
    dx: 0x3800, bp: 0x3c00, dxHighOffset: 0xa1, bpHighOffset: 0xa4, workerOffset: 0xac },
  B: { source: 'final/ChimeraB.asm', sourceSha256: '6c909366137b736bf693090093d83a8c1436f7817ccc2cea51b3ea53bfc46144',
    binary: 'build/final/ChimeraB', bytes: 117, binarySha256: '06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782',
    dx: 0x4000, bp: 0x4400, dxHighOffset: 0x59, bpHighOffset: 0x5c, workerOffset: 0x64 },
};
function gcd(a, b) { while (b) [a, b] = [b, a % b]; return a; }
function geometry(bp, margin) {
  assert(Number.isInteger(bp) && bp > 0 && bp < 65536 && bp % 256 === 0, 'invalid page stride');
  assert([256, 512, 1024].includes(margin), 'unexpected trail margin');
  const visits = new Set(), painted = new Uint16Array(65536);
  const first = 0x10a2; // Any initial A2-low-byte anchor differs by a translation.
  let pointer = first;
  while (!visits.has(pointer)) {
    visits.add(pointer);
    const arenaAnchor = (pointer - 0x40) & 0xffff;
    for (let j = 0; j < margin; j++) painted[(arenaAnchor + j) & 0xffff]++;
    pointer = (pointer - bp) & 0xffff;
  }
  assert(pointer === first, 'anchor orbit did not close at its starting point');
  const divisor = gcd(bp, 65536), period = 65536 / divisor;
  assert(visits.size === period, 'orbit period differs from gcd derivation');
  let covered = 0, min = Infinity, max = 0;
  for (const n of painted) { if (n) covered++; min = Math.min(min, n); max = Math.max(max, n); }
  return { bp, trailBytes: margin, gcdWithArena: divisor, anchorsPerOrbit: period,
    paintedBytesPerOrbit: covered, unpaintedBytesPerOrbit: 65536 - covered,
    minPaintMultiplicity: min, maxPaintMultiplicity: max,
    farCallsPerSteadyTrail: margin / 4, farCallsPerOrbit: period * margin / 4,
    workerTransitionsPerOrbit: period,
    assumption: 'Intact indefinitely executing steady loop, modulo-65536 stack trail; excludes initial gap, worker-copy writes, timing and hostile interference.' };
}
const baseline = {};
for (const [letter, spec] of Object.entries(baselineSpecs)) {
  const source = fs.readFileSync(path.join(root, spec.source)), binary = fs.readFileSync(path.join(root, spec.binary));
  assert(hash(source) === spec.sourceSha256, `${letter}: baseline source changed`);
  assert(hash(binary) === spec.binarySha256 && binary.length === spec.bytes, `${letter}: baseline binary changed`);
  assert(source.equals(Buffer.from(source.toString('utf8'))), `${letter}: source is not lossless UTF-8`);
  for (const [opcode, offset, value] of [[0xba, spec.dxHighOffset, spec.dx], [0xbd, spec.bpHighOffset, spec.bp]]) {
    assert(binary[offset - 2] === opcode && binary[offset - 1] === 0 && binary[offset] === value >>> 8, `${letter}: immediate mismatch`);
  }
  assert(binary.subarray(spec.workerOffset).toString('hex') === workerHex, `${letter}: worker changed`);
  baseline[letter] = { spec, source, binary };
}
const componentSpecs = [
  { id: 'A-lower', letter: 'A', bp: 0x3b00, dx: 0x3a00, expectedBinarySha256: 'c2c64f994af48d1e82e76071db5d904ae23678a8aafd465dc7a82039a6dc2c2b' },
  { id: 'B-lower', letter: 'B', bp: 0x4300, dx: 0x4200, expectedBinarySha256: 'b40603e61caf3a28d8228a1219319a4badfd5a68666d177617f13268e28e17c1' },
  { id: 'A-upper', letter: 'A', bp: 0x3d00, dx: 0x3c00, expectedBinarySha256: '87155e106697229096aef3d27ba632741791bcd8b1fde3d0cd6d6acc4c900ebf' },
  { id: 'B-upper', letter: 'B', bp: 0x4500, dx: 0x4400, expectedBinarySha256: 'ee615b6f885e038c27fe787bc7be21904f502b1b0d948e462f053f950315a1eb' },
];
const components = {}, pending = [];
for (const item of componentSpecs) {
  const { spec, source, binary } = baseline[item.letter];
  let updatedText = source.toString('utf8');
  for (const register of ['dx', 'bp']) {
    const oldLine = `    mov ${register}, ${hex(spec[register])}`;
    assert(updatedText.split(oldLine).length === 2, `${item.id}: expected one ${register} initializer`);
    updatedText = updatedText.replace(oldLine, `    mov ${register}, ${hex(item[register])}`);
  }
  const updated = Buffer.from(updatedText, 'utf8');
  const sourceDiff = [...source.keys()].filter(i => source[i] !== updated[i]);
  assert(updated.length === source.length && sourceDiff.length === 2, `${item.id}: expected only two source-byte substitutions`);
  const predicted = Buffer.from(binary);
  predicted[spec.dxHighOffset] = item.dx >>> 8; predicted[spec.bpHighOffset] = item.bp >>> 8;
  const binaryDiff = [...binary.keys()].filter(i => binary[i] !== predicted[i]);
  assert(JSON.stringify(binaryDiff) === JSON.stringify([spec.dxHighOffset, spec.bpHighOffset]), `${item.id}: unexpected binary changes`);
  assert(hash(predicted) === item.expectedBinarySha256, `${item.id}: predicted binary hash mismatch`);
  assert(predicted.subarray(spec.workerOffset).toString('hex') === workerHex, `${item.id}: private worker changed`);
  assert(item.bp - item.dx === 0x100, `${item.id}: wrong trail length`);
  const coverage = geometry(item.bp, 0x100);
  assert(coverage.anchorsPerOrbit === 256 && coverage.paintedBytesPerOrbit === 65536 &&
    coverage.minPaintMultiplicity === 1 && coverage.maxPaintMultiplicity === 1, `${item.id}: incomplete or overlapping ideal coverage`);
  const output = path.join(here, 'sources', `${item.id}.asm`);
  pending.push({ output, bytes: updated });
  components[item.id] = { letter: item.letter, baselineSource: spec.source, source: relative(output),
    sourceSha256: hash(updated), sourceBytes: updated.length, sourceChangedBytes: sourceDiff,
    bp: item.bp, dx: item.dx, steadyTrailBytes: 256,
    expectedBinaryBytes: predicted.length, expectedBinarySha256: hash(predicted),
    binaryChanges: binaryDiff.map(offset => ({ offset, original: binary[offset], replacement: predicted[offset] })),
    worker: { bytes: 17, offset: spec.workerOffset, hex: workerHex, unchanged: true }, coverage,
    assemblyStatus: 'not assembled; expected hash is an in-memory two-byte baseline patch' };
}
const geometryComparisons = ['A', 'B'].flatMap(side => [1024, 512, 256].map(margin => ({ side, ...geometry(baselineSpecs[side].bp, margin) })));
for (const row of geometryComparisons) {
  assert(row.anchorsPerOrbit === 64 && row.paintedBytesPerOrbit === row.trailBytes * 64, 'baseline/shorter-dwell geometry mismatch');
}
const manifest = { schemaVersion: 1, experiment: 'm050-coverage-preserving-short-dwell-20261001',
  status: 'source design and finite arithmetic only; no assembly, seeds, or battles',
  generator: relative(fileURLToPath(import.meta.url)), generatorSha256: hash(fs.readFileSync(fileURLToPath(import.meta.url))),
  baseline: baselineSpecs, components, control: { id: 'm050', A: 'baseline.A', B: 'baseline.B' },
  arms: [{ id: 'lower-strides', A: 'A-lower', B: 'B-lower' }, { id: 'upper-strides', A: 'A-upper', B: 'B-upper' }],
  geometryComparisons,
  interpretation: {
    hypothesis: 'Shorter recurring anchor dwell while restoring full ideal stack-trail support through odd-page strides.',
    unchanged: 'Anchor low byte A2, initial phases/gaps, private/initial/steady copy counts, 17-byte worker, capture code, all source except BP/DX initializers.',
    changed: 'Two immediate bytes per warrior, recurring anchor order and orbit length, DX, dwell, coverage timing and partner/captured interactions.',
    aAlsoAffectsCapturedPath: true,
    tradeoff: 'A complete ideal paint orbit retains 16384 far CALLs but needs 256 worker transitions instead of 64; full coverage takes extra copy/movement overhead.',
    limit: 'Geometric support only, not equal wall-clock coverage, guaranteed survival, corrupted-code safety or proof of improved scores.',
  },
};
const manifestPath = path.join(here, 'manifest.json');
if (mode === '--write') {
  assert(!fs.existsSync(path.join(here, 'sources')) && !fs.existsSync(manifestPath), 'Refusing existing source/manifest output');
  fs.mkdirSync(path.join(here, 'sources'));
  for (const { output, bytes } of pending) fs.writeFileSync(output, bytes, { flag: 'wx' });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
}
console.log(JSON.stringify({ mode, wroteFiles: mode === '--write' ? pending.length + 1 : 0, manifestPath: relative(manifestPath), ...manifest }, null, 2));
