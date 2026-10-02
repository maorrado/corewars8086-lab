import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = import.meta.dirname;
const template = JSON.parse(fs.readFileSync(path.join(root, "config-codex-goal-pair-ab-tune-20260930.json"), "utf8"));
const sourceRoot = path.join(root, "candidates/generated/chimera-zero-di-elision");
const sourceOut = path.join(root, "candidates/generated/codex-goal-20260930/phase-xor");
const binaryOut = path.join(root, "build/codex-goal-20260930/phase-xor");
fs.mkdirSync(sourceOut, { recursive: true });
fs.mkdirSync(binaryOut, { recursive: true });
const base = {
  A: { binary: "build/m050-repro/ab_pad_a", source: "ab_pad_a.asm", sha256: "0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44" },
  B: { binary: "build/m050-repro/ab_pad_b", source: "ab_pad_b.asm", sha256: "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782" },
};
const sites = {
  aMain: { member: "A", offset: 0x2B, immediate: 0x10, source: "add ah, 010h" },
  aCaptured: { member: "A", offset: 0x5B, immediate: 0x54, source: "add ah, 054h" },
  bMain: { member: "B", offset: 0x22, immediate: 0x34, source: "add ah, 034h" },
};
const variants = {
  a_main: ["aMain"],
  a_captured: ["aCaptured"],
  a_both: ["aMain", "aCaptured"],
  b_main: ["bMain"],
  ab_main: ["aMain", "bMain"],
  all: ["aMain", "aCaptured", "bMain"],
};
const sha = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
for (const [id, selected] of Object.entries(variants)) {
  const warriors = [];
  for (const member of ["A", "B"]) {
    const info = base[member];
    const changes = selected.map((key) => sites[key]).filter((site) => site.member === member);
    if (!changes.length) { warriors.push(info.binary); continue; }
    const bytes = Buffer.from(fs.readFileSync(path.join(root, info.binary)));
    if (sha(bytes) !== info.sha256) throw new Error(`${member}: base hash mismatch`);
    let source = fs.readFileSync(path.join(sourceRoot, info.source), "utf8");
    for (const change of changes) {
      if (bytes[change.offset] !== 0x80 || bytes[change.offset + 1] !== 0xC4 || bytes[change.offset + 2] !== change.immediate) {
        throw new Error(`${id}: ADD AH opcode mismatch at ${change.offset}`);
      }
      bytes[change.offset + 1] = 0xF4; // 80 F4 ib = XOR AH,imm8, same three bytes as 80 C4 ib.
      if (!source.includes(change.source)) throw new Error(`${id}: source pattern missing`);
      source = source.replace(change.source, change.source.replace("add ah", "xor ah"));
    }
    const output = path.join(binaryOut, `${id}_${member.toLowerCase()}`);
    fs.writeFileSync(output, bytes);
    fs.writeFileSync(path.join(sourceOut, `${id}_${member.toLowerCase()}.asm`), source);
    warriors.push(path.relative(root, output).replaceAll("\\", "/"));
  }
  const config = structuredClone(template);
  config.experimentId = `codex-goal-phase-xor-${id}-tune-20260930`;
  config.outputPath = `experiments/codex-goal-20260930/phase-xor/${id}-tune.json`;
  config.runDirectory = `build/official-runs/codex-goal-20260930/phase-xor-${id}-tune`;
  config.candidate.warriors = warriors;
  const configPath = path.join(root, `config-codex-goal-phase-xor-${id}-tune-20260930.json`);
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`${id}: A=${warriors[0]} B=${warriors[1]}`);
}
