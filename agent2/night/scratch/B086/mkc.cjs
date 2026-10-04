// B086 counters, derived from B056 nbkill (New_Best binaries; only INT87 immediates / direction changed).
// dsig: A-side searches an A-only late window, B-side a B-only late window, both std from DI=0, -> CC CC CC CC.
// aware: same windows, but A-side searches forward (cld) so it skips dA's decoy (decoy lies above the real code).
const fs = require("fs");
const D = "agent2/night/scratch/B086/";
function parse(f) { const t = fs.readFileSync(f, "utf8"); const bytes = []; for (const l of t.split(/\r?\n/)) if (/^db /.test(l)) for (const x of l.slice(3).split(",")) bytes.push(parseInt(x.trim(), 16)); return bytes; }
function emit(f, bytes, comment) { let s = "bits 16\n; " + comment + "\n"; for (let i = 0; i < bytes.length; i += 16) s += "db " + bytes.slice(i, i + 16).map((x) => "0x" + x.toString(16).padStart(2, "0")).join(", ") + "\n"; fs.writeFileSync(f, s); }
const A = fs.readFileSync(D + "build/r0A"), B = fs.readFileSync(D + "build/r0B"), dA = fs.readFileSync(D + "build/dA");
const cA = parse("agent2/night/scratch/B056/nbkillA.asm"), cB = parse("agent2/night/scratch/B056/nbkillB.asm");
const cnt = (buf, w) => { let c = 0, p = -1; while ((p = buf.indexOf(w, p + 1)) >= 0) c++; return c; };
function pick(own, other, lo, hi) {
  const out = [];
  for (let i = lo; i + 4 <= hi; i++) { const w = own.slice(i, i + 4);
    if (cnt(own, w) === 1 && cnt(other, w) === 0 && cnt(Buffer.from(cA), w) === 0 && cnt(Buffer.from(cB), w) === 0 && !w.includes(0xcc)) out.push([i, w.toString("hex")]); }
  return out;
}
const pa = pick(A, B, 0x18, 0x6d), pb = pick(B, A, 0x1f, 0xca);
console.log("A-only:", pa.map(([i, h]) => i.toString(16) + ":" + h).join(" "));
console.log("B-only:", pb.map(([i, h]) => i.toString(16) + ":" + h).join(" "));
const sel = (arg, list) => list.find(([i]) => i === arg);
const wa = sel(parseInt(process.argv[2], 16), pa), wb = sel(parseInt(process.argv[3], 16), pb);
if (!wa || !wb) process.exit(0);
function patch(b, w, fwd) {
  const h = Buffer.from(b); const i = h.indexOf(Buffer.from("b80e17ba8907bbcccc", "hex")); if (i < 0) throw new Error("imm");
  const s = Buffer.from(w, "hex"); h[i + 1] = s[0]; h[i + 2] = s[1]; h[i + 4] = s[2]; h[i + 5] = s[3];
  const k = h.indexOf(Buffer.from("b9ccccfdcd87", "hex"), i); if (k !== i + 9) throw new Error("std");
  if (fwd) h[k + 3] = 0xfc;
  if (h.indexOf(s) >= 0) throw new Error("counter carries its own signature");
  return [...h];
}
console.log("A in dA:", cnt(dA, Buffer.from(wa[1], "hex")), "B in B:", cnt(B, Buffer.from(wb[1], "hex")));
const p = "B086 counter derived from B056 nbkill (New_Best binaries, user Downloads); only INT87 immediates/direction changed. ";
emit(D + "counterA.asm", patch(cA, wa[1], false), p + `dsig A-side: std search ${wa[1]} (rev0 A off ${wa[0].toString(16)}h) -> CC CC CC CC.`);
emit(D + "counterB.asm", patch(cB, wb[1], false), p + `dsig B-side: std search ${wb[1]} (rev0 B off ${wb[0].toString(16)}h) -> CC CC CC CC.`);
emit(D + "awareA.asm", patch(cA, wa[1], true), p + `aware A-side: cld (forward from DI=0) search ${wa[1]} -> CC CC CC CC (skips a decoy placed above the real code).`);
