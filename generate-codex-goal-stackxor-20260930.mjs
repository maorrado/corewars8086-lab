import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = import.meta.dirname;
const baseline = JSON.parse(fs.readFileSync(path.join(root, "config-codex-goal-pair-ab-tune-20260930.json"), "utf8"));
const sourceRoot = path.join(root, "candidates/generated/chimera-zero-di-elision");
const sourceOut = path.join(root, "candidates/generated/codex-goal-20260930/stack-xor");
const binaryOut = path.join(root, "build/codex-goal-20260930/stack-xor");
fs.mkdirSync(sourceOut, { recursive: true });
fs.mkdirSync(binaryOut, { recursive: true });
const member = {
  A: { file: "build/m050-repro/ab_pad_a", source: "ab_pad_a.asm", opcodeOffset: 0xAF, hash: "0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44" },
  B: { file: "build/m050-repro/ab_pad_b", source: "ab_pad_b.asm", opcodeOffset: 0x67, hash: "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782" },
};
const sha = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
for (const [name, info] of Object.entries(member)) {
  const bytes = fs.readFileSync(path.join(root, info.file));
  if (sha(bytes) !== info.hash || bytes[info.opcodeOffset] !== 0x29 || bytes[info.opcodeOffset + 1] !== 0xD4) {
    throw new Error(`${name}: base hash or SUB SP,DX opcode mismatch`);
  }
  const patched = Buffer.from(bytes);
  patched[info.opcodeOffset] = 0x31; // XOR SP,DX; same encoding width and register operands.
  const output = path.join(binaryOut, `${name.toLowerCase()}_xor`);
  fs.writeFileSync(output, patched);
  let source = fs.readFileSync(path.join(sourceRoot, info.source), "utf8");
  if ((source.match(/    sub sp, dx/g) ?? []).length !== 1) throw new Error(`${name}: source opcode not unique`);
  source = source.replace("    sub sp, dx", "    xor sp, dx");
  fs.writeFileSync(path.join(sourceOut, `${name.toLowerCase()}_xor.asm`), source);
  console.log(`${name} XOR-SP binary SHA-256 ${sha(patched)}`);
}
for (const [id, changeA, changeB] of [
  ["a", true, false],
  ["b", false, true],
  ["ab", true, true],
]) {
  const config = structuredClone(baseline);
  config.experimentId = `codex-goal-stackxor-${id}-tune-20260930`;
  config.outputPath = `experiments/codex-goal-20260930/stack-xor/${id}-tune.json`;
  config.runDirectory = `build/official-runs/codex-goal-20260930/stackxor-${id}-tune`;
  config.candidate.warriors = [
    changeA ? "build/codex-goal-20260930/stack-xor/a_xor" : member.A.file,
    changeB ? "build/codex-goal-20260930/stack-xor/b_xor" : member.B.file,
  ];
  const output = path.join(root, `config-codex-goal-stackxor-${id}-tune-20260930.json`);
  fs.writeFileSync(output, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`${id}: ${output}`);
}
