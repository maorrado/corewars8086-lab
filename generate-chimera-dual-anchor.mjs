import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const sourceA = fs.readFileSync(path.join(root, "final", "ChimeraA.asm"), "utf8");
const sourceB = fs.readFileSync(path.join(root, "final", "ChimeraB.asm"), "utf8");
const candidateDir = path.join(root, "candidates", "generated", "chimera-dual-anchor");
fs.mkdirSync(candidateDir, { recursive: true });

const oldWorker = `worker_old:\r
    movsw\r
    rep movsw\r
    sub sp, dx\r
    sub [bx], bp\r
    mov di, [bx]\r
    mov cl, 9\r
    xor si, si\r
    stosw\r
    dec di\r
    call far [bx]`;

const newWorker = `worker_new:\r
    movsw\r
    rep movsw\r
    sub sp, dx\r
    sub [bx], bp\r
    mov di, [bx]\r
    mov cl, 9\r
    xor si, si\r
    stosw\r
    dec di\r
    call far [bx + si]`;

function generate(id, mainWorker, capturedWorker, jumpCondition) {
  let text = sourceA.replace(
    "; Chimera A (m049): m048 with signature-hardened Phoenix initialization.",
    `; Chimera A (${id}): dual-signature Phoenix diversification.`,
  );

  text = text.replace("    add si, worker - start", `    add si, ${mainWorker} - start`);
  text = text.replace("    add si, worker - start", `    add si, ${capturedWorker} - start`);
  text = text.replace(
    "    mov ax, 01FFFh",
    `    mov ax, 01FFFh\r
    test bl, bl\r
    ${jumpCondition} short anchor_ready\r
    mov ah, 018h\r
anchor_ready:`,
  );
  text = text.replace(
    /    call far \[bx\]\r?\n\r?\nworker:\r?\n[\s\S]*$/,
    `    call far [bx + si]\r
\r
${newWorker}\r
    db 0CCh\r
\r
${oldWorker}\r
`,
  );

  if (text.includes("worker - start") || text.includes("\r\nworker:\r\n")) {
    throw new Error(`incomplete dual-anchor rewrite for ${id}`);
  }
  fs.writeFileSync(path.join(candidateDir, `${id}_a.asm`), text, "utf8");
  fs.writeFileSync(path.join(candidateDir, `${id}_b.asm`), sourceB, "utf8");
}

// BX low byte is 00h for the main process and 80h for the captured process.
generate("dual_main_new", "worker_new", "worker_old", "jnz");
generate("dual_captured_new", "worker_old", "worker_new", "jz");

console.log("generated 2 dual-anchor candidates");
