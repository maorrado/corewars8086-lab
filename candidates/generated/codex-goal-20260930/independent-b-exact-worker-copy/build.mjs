import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Binary build from NASM's already-verified m050 listing: only two imm8 bytes
// change. This avoids depending on the optional browser Playwright install.
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../../../");
const sourcePath = path.join(here, "B.asm");
const baseSourcePath = path.join(repo, "final", "ChimeraB.asm");
const baseBinaryPath = path.join(repo, "build", "final", "ChimeraB");
const outputDirectory = path.join(repo, "build", "codex-goal-20260930", "independent-b-exact-worker-copy");
const outputPath = path.join(outputDirectory, "B");
const manifestPath = path.join(outputDirectory, "manifest.json");
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const stripAsm = (text) => text.split(/\r?\n/).map((line) => line.replace(/;.*/, "").trim()).filter(Boolean).join("\n");

const baseSource = stripAsm(fs.readFileSync(baseSourcePath, "utf8"));
const expectedSource = baseSource
  .replace("add sp, 00280h\nmov cx, 9", "add sp, 00280h\nmov cx, 8")
  .replace("mov cl, 9", "mov cl, 8");
if (expectedSource === baseSource || stripAsm(fs.readFileSync(sourcePath, "utf8")) !== expectedSource) {
  throw new Error("B.asm must equal m050 B except for the two worker-copy immediates");
}
const base = fs.readFileSync(baseBinaryPath);
const baseHash = "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782";
if (base.length !== 117 || sha256(base) !== baseHash) throw new Error("m050 B baseline binary changed");
if (base.subarray(0x54, 0x57).toString("hex") !== "b90900" || base.subarray(0x6d, 0x6f).toString("hex") !== "b109") {
  throw new Error("m050 B instruction offsets changed; inspect NASM listing before patching");
}
const candidate = Buffer.from(base);
candidate[0x55] = 8; // MOV CX, 0008h, first worker-replication count
candidate[0x6e] = 8; // MOV CL, 08h, subsequent worker-replication count
if (fs.existsSync(outputPath) || fs.existsSync(manifestPath)) throw new Error("refusing to overwrite existing build artifacts");
fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(outputPath, candidate, { flag: "wx" });
const manifest = {
  source: sourcePath,
  sourceSha256: sha256(fs.readFileSync(sourcePath)),
  output: outputPath,
  bytes: candidate.length,
  sha256: sha256(candidate),
  baseBinary: baseBinaryPath,
  baseSha256: baseHash,
  patchedBytes: [{ offset: 0x55, from: 9, to: 8 }, { offset: 0x6e, from: 9, to: 8 }],
  note: "byte-exact build from verified m050 NASM listing; browser assembler not available in this checkout",
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
console.log(JSON.stringify(manifest, null, 2));
