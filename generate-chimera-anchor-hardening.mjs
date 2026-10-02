import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const sourceB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const candidateDir = path.join(root, "candidates", "generated", "chimera-anchor-hardening");
fs.mkdirSync(candidateDir, { recursive: true });

function hardenA({ id, mask, displaced = false }) {
  let text = sourceA.replace(
    "; Chimera A (m049): m048 with signature-hardened Phoenix initialization.",
    `; Chimera A (${id}): experimental masked Phoenix anchor.`,
  );

  if (displaced) {
    text = text
      .replaceAll("    mov cx, 9", "    mov cx, 11")
      .replace("    mov cx, 8", "    mov cx, 10")
      .replaceAll("    mov ax, 01FFFh", "    mov ax, 058FFh")
      .replace(
        /    stosw\r?\n    dec di\r?\n    call far \[bx\]/g,
        "    stosw\r\n    mov [es:di], si\r\n    dec di\r\n    call far [byte bx + si + 0]",
      );
  } else {
    text = text
      .replaceAll("    mov cx, 9", "    mov cx, 10")
      .replace("    mov cx, 8", "    mov cx, 9")
      .replaceAll("    mov ax, 01FFFh", "    mov ax, 018FFh")
      .replace(
        /    stosw\r?\n    dec di\r?\n    call far \[bx\]/g,
        `    stosw\r\n    mov [es:di], ${mask}\r\n    dec di\r\n    call far [bx + si]`,
      );
  }

  if (text === sourceA) throw new Error(`no replacements made for ${id}`);
  fs.writeFileSync(path.join(candidateDir, `${id}_a.asm`), text, "utf8");
  fs.writeFileSync(path.join(candidateDir, `${id}_b.asm`), sourceB, "utf8");
}

hardenA({ id: "alias_zero", mask: "si" });
hardenA({ id: "alias_repeat", mask: "ax" });
hardenA({ id: "disp0_zero", displaced: true });

console.log("generated 3 anchor-hardening candidates");
