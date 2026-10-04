// B096: build KdA = A031 K_A (A side of KP) with B086's dA idea ported: the dead zombie_entry/zombie_scan
// tail is replaced by a byte copy of K_A's late-executed region [04h,81h) (all code from instr 4 through the
// worker, its CC CC guard and the 20th template byte 89h). Every 4-byte window of A's late code then occurs
// twice in A, the dead copy higher, so a backward (std) INT87 signature search hits the dead copy first.
// Zero executed-instruction / timing change; the 10-word template copy (6Dh..80h) is byte-identical.
const fs = require("fs");
const D = "agent2/night/scratch/B096/";
const bin = fs.readFileSync(D + "build/K_A");
const src = fs.readFileSync("agent2/night/scratch/A031/K_A.asm", "utf8");
const cut = src.indexOf("zombie_entry:");
if (cut < 0) throw new Error("no zombie_entry");
if (bin[0x80] !== 0x89 || bin[0x7e] !== 0xcc || bin[0x7f] !== 0xcc) throw new Error("layout");
const head = src.slice(0, cut).trimEnd() +
  "\n\n; B096 (wave 10, domain 6 R5-cost): KdA = K_A + B086 dA idea. Dead zombie tail replaced by a decoy copy of\n" +
  "; K_A bytes 04h..80h (late-executed code + template incl. 20th byte) against backward INT87 signature searches.\n" +
  "; Good_Test V6 friend-provided; V6nohunt/E1/SD/K by agent2 roles; dA idea by B086.\n" +
  "    db 0x89            ; 20th template byte (first byte of the removed zombie_entry; keeps the template copy identical)\n\ndecoy:\n";
const dec = [...bin.slice(0x04, 0x81)];
let s = head;
for (let i = 0; i < dec.length; i += 16) s += "    db " + dec.slice(i, i + 16).map((x) => "0x" + x.toString(16).padStart(2, "0")).join(", ") + "\n";
fs.writeFileSync(D + "KdA.asm", s);
console.log("decoy bytes", dec.length);
