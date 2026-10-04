// B076: build template-signature counters from B056 nbkill (New_Best-derived, CC replacement).
// Changes: (1) INT87 search 0E 17 89 07 -> B1 09 31 F6 (worker template 'mov cl,9; xor si,si', bytes 9-12 of the
// 18-byte V6/New_Best worker template that phoenix_init copies from the arena body into private memory);
// (2) own worker 'xor si,si' re-encoded 31 F6 -> 33 F6 (same semantics) so the counter does not carry the signature.
// Control: DX immediate 31 F6 -> 31 F7 (search B1 09 31 F7, matches nothing), otherwise identical.
const fs = require("fs");
const D = "agent2/night/scratch/B076/";
function parse(f) { const t = fs.readFileSync(f, "utf8"); const bytes = []; for (const l of t.split(/\r?\n/)) if (/^db /.test(l)) for (const x of l.slice(3).split(",")) bytes.push(parseInt(x.trim(), 16)); return bytes; }
function emit(f, bytes, comment) { let s = "bits 16\n; " + comment + "\n"; for (let i = 0; i < bytes.length; i += 16) s += "db " + bytes.slice(i, i + 16).map((x) => "0x" + x.toString(16).padStart(2, "0")).join(", ") + "\n"; fs.writeFileSync(f, s); }
function patch(b, ctl) {
  const h = Buffer.from(b);
  const i = h.indexOf(Buffer.from("b80e17ba8907bbcccc", "hex")); if (i < 0) throw new Error("no int87 imm");
  h[i + 1] = 0xb1; h[i + 2] = 0x09; h[i + 4] = 0x31; h[i + 5] = ctl ? 0xf7 : 0xf6;
  const w = h.lastIndexOf(Buffer.from("b10931f6ab4fff1f", "hex")); if (w < 0) throw new Error("no worker");
  h[w + 2] = 0x33;
  if (h.indexOf(Buffer.from("b10931f6", "hex")) >= 0) throw new Error("signature still present");
  return [...h];
}
const src = "agent2/night/scratch/B056/";
const prov = "B076 template-signature counter, derived from B056 nbkill (New_Best binaries, user Downloads). ";
for (const [w, f] of [["A", "nbkillA.asm"], ["B", "nbkillB.asm"]]) {
  const b = parse(src + f);
  emit(D + `counter${w}.asm`, patch(b, false), prov + "INT87 searches B1 09 31 F6 (worker template mov cl,9; xor si,si) -> CC CC CC CC; own worker xor si,si encoded 33 F6.");
  emit(D + `ctl${w}.asm`, patch(b, true), prov + "CONTROL: INT87 searches B1 09 31 F7 (no match); own worker xor si,si encoded 33 F6.");
}
