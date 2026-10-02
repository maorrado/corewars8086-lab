import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const sourceB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const candidateDir = path.join(root, "candidates", "generated", "chimera-bp-anchor");
fs.mkdirSync(candidateDir, { recursive: true });

function base(id) {
  return sourceA
    .replace(
      "; Chimera A (m049): m048 with signature-hardened Phoenix initialization.",
      `; Chimera A (${id}): BP+SI Phoenix anchor experiment.`,
    )
    .replaceAll("    mov ax, 01FFFh", "    mov ax, 01AFFh")
    .replaceAll("    call far [bx]", "    call far [bp + si]");
}

function write(id, transform) {
  const text = transform(base(id));
  fs.writeFileSync(path.join(candidateDir, `${id}_a.asm`), text, "utf8");
  fs.writeFileSync(path.join(candidateDir, `${id}_b.asm`), sourceB, "utf8");
}

write("bp_exact", (text) => text
  .replaceAll("    mov cx, 9", "    mov cx, 10")
  .replace("    mov cx, 8", "    mov cx, 9")
  .replace("    mov bp, 03C00h", "    mov bp, bx")
  .replace("    sub [bx], bp", "    sub word [bx], 03C00h"));

write("bp_common_3800", (text) => text
  .replace("    mov bp, 03C00h", "    mov bp, bx")
  .replace("    sub [bx], bp", "    sub [bx], dx"));

write("bp_common_3c00", (text) => text
  .replace("    mov dx, 03800h", "    mov dx, 03C00h")
  .replace("    mov bp, 03C00h", "    mov bp, bx")
  .replace("    sub [bx], bp", "    sub [bx], dx"));

console.log("generated 3 BP-anchor candidates");
