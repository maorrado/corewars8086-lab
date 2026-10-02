import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const sourceB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const candidateDir = path.join(root, "candidates", "generated", "chimera-main-hls-counter");
fs.mkdirSync(candidateDir, { recursive: true });

function dynamicA(comment) {
  return sourceA
    .replace(
      "; Chimera A (m049): m048 with signature-hardened Phoenix initialization.",
      comment,
    )
    .replace("    mov ax, 01FFFh", "    mov ax, 018FFh");
}

function retargetInitial(source) {
  return source
    .replace("    mov ax, 0F9EBh", "    mov ax, 0FFB8h")
    .replace("    mov dx, 0CCCCh", "    mov dx, 0BA18h")
    .replace("    mov bx, 026FFh", "    mov bx, 0CCCCh")
    .replace("    mov cx, 05D13h", "    mov cx, 0CCCCh");
}

const aCountersA = retargetInitial(dynamicA(
  "; Chimera A (main_counter_a): FF18 anchors; A counters HLS while B captures.",
));
const bCaptures = sourceB.replace(
  "; Chimera B (m049): m048 with signature-hardened Phoenix initialization.",
  "; Chimera B (main_counter_a): unchanged m049 capture path.",
);

const aCaptures = dynamicA(
  "; Chimera A (main_counter_b): FF18 anchors; A captures while B counters HLS.",
);
const bCounters = retargetInitial(sourceB).replace(
  "; Chimera B (m049): m048 with signature-hardened Phoenix initialization.",
  "; Chimera B (main_counter_b): early HLS counter in place of Zombie capture.",
);

for (const [id, a, b] of [
  ["main_counter_a", aCountersA, bCaptures],
  ["main_counter_b", aCaptures, bCounters],
]) {
  fs.writeFileSync(path.join(candidateDir, `${id}_a.asm`), a, "utf8");
  fs.writeFileSync(path.join(candidateDir, `${id}_b.asm`), b, "utf8");
}

console.log("generated 2 main-process HLS-counter pairs");
