import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const sourceB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const candidateDir = path.join(root, "candidates", "generated", "chimera-padded-alias");
fs.mkdirSync(candidateDir, { recursive: true });

const textA = sourceA
  .replace(
    "; Chimera A (m049): m048 with signature-hardened Phoenix initialization.",
    "; Chimera A (alias_padded): FF18 anchor with a non-copied source-tail guard.",
  )
  .replaceAll("    mov ax, 01FFFh", "    mov ax, 018FFh")
  .replaceAll("    call far [bx]", "    call far [bx + si]")
  .replace(/    call far \[bx \+ si\]\s*$/, "    call far [bx + si]\r\n    db 0CCh, 090h\r\n");

fs.writeFileSync(path.join(candidateDir, "alias_padded_a.asm"), textA, "utf8");
fs.writeFileSync(path.join(candidateDir, "alias_padded_b.asm"), sourceB, "utf8");

const oldPaddedA = sourceA
  .replace(
    "; Chimera A (m049): m048 with signature-hardened Phoenix initialization.",
    "; Chimera A (old_padded): m049 with a non-copied source-tail guard.",
  )
  .replace(/    call far \[bx\]\s*$/, "    call far [bx]\r\n    db 0CCh, 090h\r\n");
fs.writeFileSync(path.join(candidateDir, "old_padded_a.asm"), oldPaddedA, "utf8");
fs.writeFileSync(path.join(candidateDir, "old_padded_b.asm"), sourceB, "utf8");

console.log("generated 2 padded-anchor candidates");
