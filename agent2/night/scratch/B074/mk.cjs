// B074: generate counter/control sources from zchain4 (agent2/night/refs/zchain4).
const fs = require("fs");
const nl = (s) => s.replace(/\r\n/g, "\n");
const srcA = nl(fs.readFileSync("../../refs/zchain4/A.asm", "utf8"));
const srcB = nl(fs.readFileSync("../../refs/zchain4/B.asm", "utf8"));
const hdr = "; B074 counter-code (domain 4 R3): zchain4 (agent2 lineage of combo_zrl03 / b01d) + two INT 86h decoy blocks.\n" +
  "; A: 64 copies of E2 F2 81 C3 (zom20a live-loop end = rev0 A's single forward INT 87h pattern) at arena 0000h-00FFh.\n" +
  "; B: 64 copies of EB F9 CC CC (zom20b/d tail = rev0 B's backward INT 87h pattern) at arena FF00h-FFFFh (also below\n" +
  ";    FFE0h, so a fixed DI=FFE0h start does not skip it). Own searches use 0F EB F9 CC / 41 93 E2 F2 and are immune.\n";
function rep(s, a, b) { if (s.split(a).length !== 2) throw new Error("no unique match: " + a); return s.replace(a, b); }
function mkA(ax) {
  let s = rep(srcA, "start:\n    mov si, ax\n    add ax, zombie_entry - start\n",
    `start:\n    mov si, ax\n    push cs\n    pop es\n    xor di, di\n    mov ax, ${ax}\n    mov dx, 0C381h\n    int 086h\n    lea ax, [si + zombie_entry - start]\n`);
  return rep(s, "    mov ax, 0EB0Fh\n    std\n    int 087h\n", "    mov ax, 0EB0Fh\n    xor di, di\n    std\n    int 087h\n");
}
function mkB(ax) {
  let s = rep(srcB, "start:\n    mov si, ax\n",
    `start:\n    mov si, ax\n    push cs\n    pop es\n    mov di, 0FF00h\n    mov ax, ${ax}\n    mov dx, 0CCCCh\n    int 086h\n`);
  return rep(s, "    mov cx, 01326h\n    std\n", "    mov cx, 01326h\n    xor di, di\n    std\n");
}
const c = "; CONTROL: identical code and timing, decoy patterns broken (E3 F2 81 C3 / EA F9 CC CC).\n";
fs.writeFileSync("counterA.asm", hdr + mkA("0F2E2h"));
fs.writeFileSync("counterB.asm", hdr + mkB("0F9EBh"));
fs.writeFileSync("ctlA.asm", hdr + c + mkA("0F2E3h"));
fs.writeFileSync("ctlB.asm", hdr + c + mkB("0F9EAh"));
