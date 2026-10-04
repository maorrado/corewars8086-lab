// B086 forward-search variants of B056 counters: only the std before INT 87h is changed to cld.
const fs = require("fs");
const D = "agent2/night/scratch/B086/";
function parse(f) { const t = fs.readFileSync(f, "utf8"); const bytes = []; for (const l of t.split(/\r?\n/)) if (/^db /.test(l)) for (const x of l.slice(3).split(",")) bytes.push(parseInt(x.trim(), 16)); return bytes; }
function emit(f, bytes, comment) { let s = "bits 16\n; " + comment + "\n"; for (let i = 0; i < bytes.length; i += 16) s += "db " + bytes.slice(i, i + 16).map((x) => "0x" + x.toString(16).padStart(2, "0")).join(", ") + "\n"; fs.writeFileSync(f, s); }
for (const [src, out] of [["nbkill", "fwdkill"], ["nbsig2", "fwdsig2"]]) for (const w of ["A", "B"]) {
  const h = Buffer.from(parse(`agent2/night/scratch/B056/${src}${w}.asm`));
  const k = h.indexOf(Buffer.from("fdcd87", "hex")); if (k < 0 || h.indexOf(Buffer.from("fdcd87", "hex"), k + 1) >= 0 && w === "A") throw new Error("std " + src + w);
  h[k] = 0xfc;
  emit(D + `${out}${w}.asm`, [...h], `B086 forward variant of B056 ${src}${w} (New_Best-derived): only std before the first INT 87h -> cld (search forward from DI=0).`);
}
