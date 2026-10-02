import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const sourceB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const candidateDir = path.join(root, "candidates", "generated", "chimera-split-counters");
fs.mkdirSync(candidateDir, { recursive: true });

let textA = sourceA
  .replace(
    "; Chimera A (m049): m048 with signature-hardened Phoenix initialization.",
    "; Chimera A (split_counters): FF18 anchors plus separate A/B captured-process counters.",
  )
  .replace(
    "    mov [05D13h], di",
    "    mov [05D13h], di\r\n    mov di, ax\r\n    add di, zombie_entry_hls - start\r\n    mov [05D15h], di",
  )
  .replace(
    /zombie_entry:\r?\n    xor di, di\r?\n    mov ax, 0A5F3h\r?\n    mov dx, 01F06h\r?\n    mov bl, 0CCh/,
    `zombie_entry:\r
    mov ax, 0A5F3h\r
    mov dx, 01F06h\r
    jmp short zombie_attack\r
\r
zombie_entry_hls:\r
    mov ax, 0FFB8h\r
    mov dx, 0BA18h\r
\r
zombie_attack:\r
    xor di, di\r
    mov bl, 0CCh`,
  )
  .replace("    mov ax, 01FFFh", "    mov ax, 018FFh");

const textB = sourceB
  .replace(
    "; Chimera B (m049): m048 with signature-hardened Phoenix initialization.",
    "; Chimera B (split_counters): m049 B captures through the HLS-counter entry.",
  )
  .replace("    mov cx, 05D13h", "    mov cx, 05D15h");

fs.writeFileSync(path.join(candidateDir, "split_counters_a.asm"), textA, "utf8");
fs.writeFileSync(path.join(candidateDir, "split_counters_b.asm"), textB, "utf8");
console.log("generated split captured-counter candidate pair");
