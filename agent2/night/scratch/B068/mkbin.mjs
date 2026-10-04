// B068: build ablation controls of real 2025 bombers (byte patches only; originals untouched).
import fs from "node:fs";
const S = "official-2025/survivors-online", O = "agent2/night/scratch/B068/bin";
const patch = (src, dst, from, to) => { const b = fs.readFileSync(`${S}/${src}`); const h = b.toString("hex"); let n = 0;
  const out = h.replace(new RegExp(from, "g"), (m, off) => { if (off % 2) return m; n++; return to; });
  if (!n) throw new Error("no match " + src); fs.writeFileSync(`${O}/${dst}`, Buffer.from(out, "hex")); console.log(dst, "patched", n, "site(s)", out); };
// Underflow: both INT 86h -> NOP NOP (everything else identical)
patch("HRZ_Underflow1", "UF_no86_1", "cd86", "9090"); patch("HRZ_Underflow2", "UF_no86_2", "cd86", "9090");
// R1DDLE: rep stosw -> jmp $ (idle, same footprint)
patch("ATL_R1DDLE1", "RD_idle_1", "f3ab", "ebfe"); patch("ATL_R1DDLE2", "RD_idle_2", "f3ab", "ebfe");
// tson_el_akod (same code as FriendlyFire, CodeEliteGang2, ShmuelTurtles2): stosw -> nop (same loop timing, no writes)
patch("TOM_tson_el_akod1", "TS_nop_1", "b8ccccab", "b8cccc90"); patch("TOM_tson_el_akod2", "TS_nop_2", "b8ccccab", "b8cccc90");
