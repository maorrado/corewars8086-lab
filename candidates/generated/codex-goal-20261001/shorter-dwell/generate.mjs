import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

// Source authoring only: no assembler, RNG, configuration generation, or engine.
// --check is read-only; --write creates only this directory's sources/manifest.
const mode = process.argv[2] ?? "--check";
if (!["--check", "--write"].includes(mode) || process.argv.length > 3) {
  throw new Error("Usage: node generate.mjs [--check|--write]");
}
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../../..");
const relative = (p) => path.relative(root, p).split(path.sep).join("/");
const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const baselineSpecs = {
  A: {
    source: "final/ChimeraA.asm",
    sourceSha256: "b05ae79647c65b67d8486205597dc28c3c6467a80efbd9017bc257e2014999d8",
    binary: "build/final/ChimeraA", bytes: 189,
    binarySha256: "0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44",
    bp: 0x3c00, dx: 0x3800, immediateHighOffset: 0xa1,
    originalLine: "    mov dx, 03800h",
  },
  B: {
    source: "final/ChimeraB.asm",
    sourceSha256: "6c909366137b736bf693090093d83a8c1436f7817ccc2cea51b3ea53bfc46144",
    binary: "build/final/ChimeraB", bytes: 117,
    binarySha256: "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782",
    bp: 0x4400, dx: 0x4000, immediateHighOffset: 0x59,
    originalLine: "    mov dx, 04000h",
  },
};
const baseline = {};
for (const [letter, spec] of Object.entries(baselineSpecs)) {
  const source = fs.readFileSync(path.join(root, spec.source));
  const binary = fs.readFileSync(path.join(root, spec.binary));
  assert(hash(source) === spec.sourceSha256, `${letter}: baseline source hash changed`);
  assert(hash(binary) === spec.binarySha256 && binary.length === spec.bytes,
    `${letter}: baseline binary hash/length changed`);
  assert(source.equals(Buffer.from(source.toString("utf8"))), `${letter}: source is not lossless UTF-8`);
  const offset = spec.immediateHighOffset;
  assert(binary[offset - 2] === 0xba && binary[offset - 1] === 0 &&
    binary[offset] === spec.dx >>> 8, `${letter}: MOV DX immediate mismatch`);
  baseline[letter] = { spec, source, binary };
}

const componentSpecs = [
  { id: "A-trail512", letter: "A", dx: 0x3a00,
    expectedBinarySha256: "f5d20bb160052bbc2247b91c3737fe51f4bdd81d557396837faf319cc90e4e40" },
  { id: "B-trail512", letter: "B", dx: 0x4200,
    expectedBinarySha256: "ed236d60c51ca5ff19f482967b47f77bd8583180f34fd6595f4cbcce69555b31" },
  { id: "A-trail256", letter: "A", dx: 0x3b00,
    expectedBinarySha256: "b39583ee5bbc9204d8871cecffa6b0b45d3b35989c0c86853d6a43ef13ce390b" },
  { id: "B-trail256", letter: "B", dx: 0x4300,
    expectedBinarySha256: "c4d961cfb18fd21fb71c7df36298e19a37faf379d38654ac36f76e1307fce214" },
];
const pending = [];
const components = {};
for (const item of componentSpecs) {
  const { spec, source, binary } = baseline[item.letter];
  const text = source.toString("utf8");
  assert(text.split(spec.originalLine).length === 2, `${item.id}: expected one DX line`);
  const replacement = `    mov dx, 0${item.dx.toString(16).toUpperCase()}h`;
  const updated = Buffer.from(text.replace(spec.originalLine, replacement), "utf8");
  assert(updated.length === source.length, `${item.id}: changed source length`);
  const sourceDiff = [...source.keys()].filter((i) => source[i] !== updated[i]);
  assert(sourceDiff.length === 1, `${item.id}: expected exactly one source-byte substitution`);
  // Predict the binary only in memory. Later assembly must match all bytes/hash.
  const predicted = Buffer.from(binary);
  predicted[spec.immediateHighOffset] = item.dx >>> 8;
  assert(hash(predicted) === item.expectedBinarySha256, `${item.id}: predicted binary mismatch`);
  const binaryDiff = [...binary.keys()].filter((i) => binary[i] !== predicted[i]);
  assert(binaryDiff.length === 1 && binaryDiff[0] === spec.immediateHighOffset,
    `${item.id}: unexpected binary patch`);
  const output = path.join(here, "sources", `${item.id}.asm`);
  pending.push({ output, bytes: updated });
  components[item.id] = {
    letter: item.letter, baselineSource: spec.source, source: relative(output),
    sourceSha256: hash(updated), sourceBytes: updated.length, sourceChangedByte: sourceDiff[0],
    bp: spec.bp, dx: item.dx, steadyTrailBytes: spec.bp - item.dx,
    farCallsPerUndisturbedSteadyTrail: (spec.bp - item.dx) / 4,
    expectedBinaryBytes: binary.length, expectedBinarySha256: hash(predicted),
    binaryChangedByte: spec.immediateHighOffset,
    originalByte: binary[spec.immediateHighOffset], newByte: predicted[spec.immediateHighOffset],
    assemblyStatus: "not assembled; expected hash is an in-memory one-byte baseline patch",
  };
}
const manifest = {
  schemaVersion: 1, experiment: "m050-shorter-recurring-anchor-dwell-20261001",
  status: "source design only; no seeds, assembly, or battles",
  generator: relative(fileURLToPath(import.meta.url)),
  generatorSha256: hash(fs.readFileSync(fileURLToPath(import.meta.url))),
  baseline: baselineSpecs,
  components,
  control: { id: "m050", A: "baseline.A", B: "baseline.B" },
  arms: [
    { id: "both-trail512", A: "A-trail512", B: "B-trail512" },
    { id: "b-trail512", A: "baseline.A", B: "B-trail512" },
    { id: "both-trail256", A: "A-trail256", B: "B-trail256" },
    { id: "b-trail256", A: "baseline.A", B: "B-trail256" },
  ],
  interpretation: {
    unchanged: "BP, anchor offsets, phases, initial SP gaps, copy counts, worker, capture, other source bytes",
    aAlsoAffectsCapturedPath: true,
    hypothesis: "Fewer recursive far calls leave each recurring anchor exposed for less time.",
    tradeoff: "Fewer painted bytes per visited band and more frequent band visits; not unchanged coverage or immunity.",
    limitation: "The 512-byte mechanism has negative historical screens on older designs; this is a current-m050 interaction test.",
  },
};
const manifestPath = path.join(here, "manifest.json");
if (mode === "--write") {
  assert(!fs.existsSync(path.join(here, "sources")), "Refusing to overwrite sources directory");
  assert(!fs.existsSync(manifestPath), "Refusing to overwrite manifest");
  fs.mkdirSync(path.join(here, "sources"));
  for (const { output, bytes } of pending) fs.writeFileSync(output, bytes, { flag: "wx" });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
}
console.log(JSON.stringify({ mode, wroteFiles: mode === "--write" ? pending.length + 1 : 0,
  manifestPath: relative(manifestPath), ...manifest }, null, 2));
