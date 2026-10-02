import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const sourceB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const candidateDir = path.join(root, "candidates", "generated", "chimera-alias-hls-counter");
fs.mkdirSync(candidateDir, { recursive: true });

const textA = sourceA
  .replace(
    "; Chimera A (m049): m048 with signature-hardened Phoenix initialization.",
    "; Chimera A (alias_hls_counter): split anchor plus captured-process HLS counter.",
  )
  .replace("    mov ax, 0A5F3h", "    mov ax, 0FFB8h")
  .replace("    mov dx, 01F06h", "    mov dx, 0BA18h")
  .replace("    mov ax, 01FFFh", "    mov ax, 018FFh");

fs.writeFileSync(path.join(candidateDir, "alias_hls_counter_a.asm"), textA, "utf8");
fs.writeFileSync(path.join(candidateDir, "alias_hls_counter_b.asm"), sourceB, "utf8");
console.log("generated split-anchor HLS-counter candidate");
