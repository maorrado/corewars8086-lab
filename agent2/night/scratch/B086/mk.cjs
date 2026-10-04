// B086: build decoy candidate dA (A only) from rev0 A.
// rev0 A dead tail (zombie_entry/zombie_scan, never reached in rev0) replaced by a byte copy of A's
// late-executed region [04h,7Fh) (everything executed from instr 4 to the end of the worker template),
// followed by A1 17 4A (the bytes that follow the real template, so the 3 windows straddling the real
// template end also exist in the decoy) and FF 1F (keeps an FF 1F CC CC arena tail like B).
// Effect: every 4-byte window of A's late code exists twice in A, the decoy copy at a higher address,
// so a backward (std) INT87 search hits the dead copy first.
const fs = require("fs");
const D = "agent2/night/scratch/B086/";
const bin = fs.readFileSync(D + "build/r0A");
const src = fs.readFileSync("agent2/night/revisions/rev0/A.asm", "utf8");
const cut = src.indexOf("zombie_entry:");
if (cut < 0) throw new Error("no zombie_entry");
let head = src.slice(0, cut).replace("; agent2 variant: removed the [7A00h] redirect patch (ablation)",
  "; agent2 variant: removed the [7A00h] redirect patch (ablation)\n; B086 night variant dA: dead zombie_entry/zombie_scan tail replaced by a decoy copy of the\n; late-executed bytes 04h..7Eh (+ A1 17 4A + FF 1F) against backward INT87 signature searches.");
const dec = [...bin.slice(0x04, 0x7f), 0xa1, 0x17, 0x4a, 0xff, 0x1f];
let s = head.trimEnd() + "\n    db 0x89            ; 18th template byte (first byte of the removed zombie_entry; keeps the worker copy identical)\n\ndecoy:\n";
for (let i = 0; i < dec.length; i += 16) s += "    db " + dec.slice(i, i + 16).map((x) => "0x" + x.toString(16).padStart(2, "0")).join(", ") + "\n";
fs.writeFileSync(D + "dA.asm", s);
console.log("decoy bytes", dec.length);
