import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const sourceB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const candidateDir = path.join(root, "candidates", "generated", "chimera-lean-split");
fs.mkdirSync(candidateDir, { recursive: true });

function write(id, text) {
  text = text.replace(
    "; Chimera A (m049): m048 with signature-hardened Phoenix initialization.",
    `; Chimera A (${id}): lean main/captured anchor split.`,
  );
  fs.writeFileSync(path.join(candidateDir, `${id}_a.asm`), text, "utf8");
  fs.writeFileSync(path.join(candidateDir, `${id}_b.asm`), sourceB, "utf8");
}

// Preserve both pointer cells; branch once during initialization.
write("lean_captured_branch", sourceA.replace(
  "    mov ax, 01FFFh",
  "    mov ax, 01FFFh\r\n    test bl, bl\r\n    jz short anchor_ready\r\n    mov ah, 018h\r\nanchor_ready:",
));

// Main BX=0200h (BL=00h); captured BX=0307h (BL=07h).
// One XOR maps only the captured anchor from 1Fh to 18h.
write("lean_captured_xor", sourceA
  .replace("    mov bx, 00280h", "    mov bx, 00307h")
  .replace("    mov ax, 01FFFh", "    mov ax, 01FFFh\r\n    xor ah, bl"));

// Main BX=0207h (BL=07h); captured BX=0300h (BL=00h).
// This is the inverse split: main anchors are FF18, captured anchors are FF1F.
write("lean_main_xor", sourceA
  .replace("%define PTR_CELL 00200h", "%define PTR_CELL 00207h")
  .replace("    mov bx, 00280h", "    mov bx, 00300h")
  .replace("    mov ax, 01FFFh", "    mov ax, 01FFFh\r\n    xor ah, bl"));

console.log("generated 3 lean split-anchor candidates");
