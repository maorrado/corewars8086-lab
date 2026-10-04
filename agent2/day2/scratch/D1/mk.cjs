// Build D1 candidate sources from rev1 (line-number based edits verified by grep before).
const fs = require("fs");
const A = fs.readFileSync("rev1_A.asm", "utf8").replace(/\r\n/g, "\n").split("\n");
const B = fs.readFileSync("rev1_B.asm", "utf8").replace(/\r\n/g, "\n").split("\n");
const hdr = (v) => [
  `; D1 (agent2 day2 role D1, base rev1 KPHL) variant ${v}: coupled phoenix with a V6-compatible template.`,
  "; Good_Test V6 is friend-provided code (warrior 1/2 reconstructed in study-notes/good-test-v6/source/);",
  "; V6nohunt and all night edits are agent2 roles (see agent2/night/FINDINGS.md); this edit is agent2 day2 D1.",
  "; Mechanism (trace dayTR-1e9efbcb54-dd73fad407, emulator agent2/day2/scratch/D1/absim.mjs reproduces the traced",
  ";   self-kill rounds 32598/52953/65875/69725/109868/114282): the worker's sub sp,dx carries the SP excess of an EARLY",
  ";   trigger into the next generation (d_new = d_trig + trail), so B and the captured zombies run decoupled ('free')",
  ";   fronts that trail A's front by 4-80 bytes when A self-triggers and overwrite A's worker during its rebuild.",
  "; Change: after V6's unchanged worker prefix (sub sp,dx .. dec di, byte-identical so co-anchored V6-family and",
  ";   own rebuilds still write the same bytes at P+4..P+15), one lea re-derives SP from the new anchor every",
  ";   generation: SP = BX + DI (+d8) with DI = new IP + 1 and the private cell BX placed so that SP = anchor + trail.",
  ";   A, B and captured zombies share one byte-identical template (only the private cell offset differs).",
];
function edit(L, isA, v) {
  const out = [];
  const cellA = v === "cL" ? "003AFh" : "003ACh", cellB = v === "cL" ? "007AFh" : "007ACh";
  const lea = v === "cL" ? "    lea sp, [bx + di]       ; D1: SP = cell(BX) + new IP + 1 = anchor + trail (coupled)" :
    "    lea sp, [bx + di + 3]   ; D1: SP = cell(BX) + new IP + 1 + 3 = anchor + trail (coupled)";
  let inWorker = false;
  for (let i = 0; i < L.length; i++) {
    let l = L[i];
    if (l === "worker:") inWorker = true;
    if (/^    mov cx, 10$/.test(l)) l = "    mov cx, 11              ; D1: template copy 22 bytes (worker grew)";
    if (isA && /^    mov bx, 002C0h$/.test(l)) l = `    mov bx, ${cellA}             ; D1: cell offset sets A's trail (400h) via lea`;
    if (!isA && /^    mov bx, 0280h$/.test(l)) l = `    mov bx, ${cellB}             ; D1: cell offset sets B's trail (800h) via lea`;
    if (!isA && v === "cS" && /^    mov cx, 8$/.test(l)) l = "    mov cx, 9               ; D1: first rebuild must copy the 17-byte worker";
    if (inWorker && /^    call far \[bx\]$/.test(l)) { out.push(lea); inWorker = false; }
    out.push(l);
  }
  return [...hdr(v), ...out].join("\n");
}
for (const v of ["cL", "cS"]) { fs.writeFileSync(`${v}_A.asm`, edit(A, true, v)); fs.writeFileSync(`${v}_B.asm`, edit(B, false, v)); }
