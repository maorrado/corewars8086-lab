// B061: static scan for 2-byte call-far replicators and their trigger family (MOVSB A4 / MOVSW A5).
// usage: node scan.mjs <dir>...   prints one line per warrior with heuristics
import fs from "node:fs"; import path from "node:path";
const hex = (b) => b.toString(16).padStart(2, "0");
const out = [];
for (const d of process.argv.slice(2)) {
  for (const f of fs.readdirSync(d).sort()) {
    const p = path.join(d, f); if (!fs.statSync(p).isFile() || /\.(asm|zip|txt|md|json)$/i.test(f)) continue;
    const b = fs.readFileSync(p); const tags = [];
    // call far encodings FF /3
    for (let i = 0; i + 1 < b.length; i++) if (b[i] === 0xff && (b[i + 1] & 0x38) === 0x18) tags.push(`callfar@${hex(i)}:${hex(b[i + 1])}`);
    // anchor written as data: mov ax,1FFFh / mov word [..],1FFFh  (FF 1F as immediate)
    for (let i = 0; i + 2 < b.length; i++) if (b[i + 1] === 0xff && (b[i + 2] & 0x38) === 0x18 && (b[i] === 0xb8 || b[i] === 0xb9 || b[i] === 0xba || b[i] === 0xbb || b[i] === 0xbd || b[i] === 0xbe || b[i] === 0xbf)) tags.push(`immanchor@${hex(i)}:${hex(b[i])}`);
    // immediates with low byte A0..A7 (IP-low candidates)
    for (let i = 0; i + 1 < b.length; i++) {
      if (b[i] === 0xb0 && b[i + 1] >= 0xa0 && b[i + 1] <= 0xa7) tags.push(`moval:${hex(b[i + 1])}`);
      if (b[i] >= 0xb8 && b[i] <= 0xbf && i + 2 < b.length && b[i + 1] >= 0xa0 && b[i + 1] <= 0xa7) tags.push(`mov${["ax","cx","dx","bx","sp","bp","si","di"][b[i]-0xb8]}:${hex(b[i + 2])}${hex(b[i + 1])}`);
    }
    const movsw = [...b].filter((x) => x === 0xa5).length, movsb = [...b].filter((x) => x === 0xa4).length;
    out.push(`${p.split(path.sep).join("/").padEnd(72)} ${String(b.length).padStart(3)} a5=${movsw} a4=${movsb} ${tags.join(" ")}`);
  }
}
console.log(out.join("\n"));
