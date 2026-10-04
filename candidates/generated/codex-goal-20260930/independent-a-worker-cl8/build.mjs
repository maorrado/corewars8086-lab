import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../../../");
const sourcePath = path.join(here, "A.asm");
const baseSourcePath = path.join(repo, "final", "ChimeraA.asm");
const baseBinaryPath = path.join(repo, "build", "final", "ChimeraA");
const outputDirectory = path.join(repo, "build", "codex-goal-20260930", "independent-a-worker-cl8");
const outputPath = path.join(outputDirectory, "A");
const manifestPath = path.join(outputDirectory, "manifest.json");
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const stripAsm = (text) => text.split(/\r?\n/).map((line) => line.replace(/;.*/, "").trim()).filter(Boolean).join("\n");

const baseSource = stripAsm(fs.readFileSync(baseSourcePath, "utf8"));
const expectedSource = baseSource.replace("mov cl, 9", "mov cl, 8");
if (expectedSource === baseSource || stripAsm(fs.readFileSync(sourcePath, "utf8")) !== expectedSource) {
  throw new Error("A.asm must equal m050 A except for the later worker CL immediate");
}
const base = fs.readFileSync(baseBinaryPath);
const baseHash = "0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44";
if (base.length !== 189 || sha256(base) !== baseHash) throw new Error("m050 A baseline binary changed");
if (base.subarray(0xb5, 0xb7).toString("hex") !== "b109") {
  throw new Error("m050 A instruction offset changed; inspect NASM listing before patching");
}
const candidate = Buffer.from(base);
candidate[0xb6] = 8;
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
  patchedBytes: [{ offset: 0xb6, from: 9, to: 8 }],
  note: "byte-exact build from verified m050 NASM listing; browser assembler not available in this checkout",
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
console.log(JSON.stringify(manifest, null, 2));
