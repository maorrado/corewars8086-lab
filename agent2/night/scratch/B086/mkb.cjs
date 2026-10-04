// B086: dB = rev0 B with a 54-byte decoy copy of B's late bytes [8Fh,0C5h) (phoenix_init from push cs;
// pop ss through the worker's mov cl,9) inserted between the startup's jmp short phoenix_init and zombie_entry.
// The jmp already skips that gap, so no executed instruction is added; only label-derived immediates move
// (lea bx zombie_entry, jmp short disp, add/sub si offsets). The decoy lies BELOW the real code, so it
// absorbs FORWARD (cld) searches for those windows; A's decoy (dA) lies above and absorbs backward ones.
const fs = require("fs");
const D = "agent2/night/scratch/B086/";
const bin = fs.readFileSync(D + "build/r0B");
const src = fs.readFileSync("agent2/night/revisions/rev0/B.asm", "utf8");
const dec = [...bin.slice(0x8f, 0xc5)];
let ins = "\nb_decoy:   ; B086: dead decoy copy of B bytes 8Fh..0C4h (never executed)\n";
for (let i = 0; i < dec.length; i += 16) ins += "    db " + dec.slice(i, i + 16).map((x) => "0x" + x.toString(16).padStart(2, "0")).join(", ") + "\n";
const key = "    jmp short phoenix_init\n\nzombie_entry:";
const k = src.replace(/\r\n/g, "\n").indexOf(key); if (k < 0) throw new Error("anchor");
let s = src.replace(/\r\n/g, "\n");
s = s.slice(0, k) + "    jmp short phoenix_init\n" + ins + "\nzombie_entry:" + s.slice(k + key.length);
s = s.replace("; offsets replaced by label arithmetic with the original operand widths.\n",
  "; offsets replaced by label arithmetic with the original operand widths.\n; B086 night variant dB: 54-byte decoy copy of the late phoenix_init/worker bytes behind the startup jmp.\n");
fs.writeFileSync(D + "dB.asm", s);
console.log("decoy", dec.length, Buffer.from(dec).toString("hex"));
