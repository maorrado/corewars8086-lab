// B076: dilution variant. Same as counter (mk.cjs) but searches 29 D4 29 2F (sub sp,dx; sub [bx],bp), a template window
// shared by ~14 archived field binaries; own worker sub sp,dx re-encoded 29 D4 -> 2B E2 (same semantics); own xor si,si stays 33 F6.
const fs = require("fs"); const D = "agent2/night/scratch/B076/";
function parse(f) { const bytes = []; for (const l of fs.readFileSync(f, "utf8").split(/\r?\n/)) if (/^db /.test(l)) for (const x of l.slice(3).split(",")) bytes.push(parseInt(x.trim(), 16)); return bytes; }
function emit(f, bytes, c) { let s = "bits 16\n; " + c + "\n"; for (let i = 0; i < bytes.length; i += 16) s += "db " + bytes.slice(i, i + 16).map((x) => "0x" + x.toString(16).padStart(2, "0")).join(", ") + "\n"; fs.writeFileSync(f, s); }
for (const w of ["A", "B"]) {
  const h = Buffer.from(parse(D + `counter${w}.asm`));
  const i = h.indexOf(Buffer.from("b8b109ba31f6", "hex")); if (i < 0) throw 1;
  h[i + 1] = 0x29; h[i + 2] = 0xd4; h[i + 4] = 0x29; h[i + 5] = 0x2f;
  const k = h.lastIndexOf(Buffer.from("a5f3a529d4292f", "hex")); if (k < 0) throw 2; h[k + 3] = 0x2b; h[k + 4] = 0xe2;
  if (h.indexOf(Buffer.from("29d4292f", "hex")) >= 0) throw 3;
  emit(D + `com${w}.asm`, [...h], "B076 dilution variant of the template-signature counter (derived from B056 nbkill / New_Best): INT87 searches 29 D4 29 2F (common worker window) -> CC CC CC CC; own worker sub sp,dx encoded 2B E2, xor si,si 33 F6.");
}
