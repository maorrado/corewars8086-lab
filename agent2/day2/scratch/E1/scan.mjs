// E1: which warriors contain the byte pairs of the fixed cells 4A17h / CC13h (possible early writers)
import fs from "node:fs";
import * as F from "../../../tools/fields.mjs";
const teams = [...F.field2025(), ...F.field2024live(), ...F.field2024final(), ...F.counters(), ...F.peers()];
const pats = { "4A17": [0x17, 0x4a], "CC13": [0x13, 0xcc], "FFE8": [0xe8, 0xff] };
for (const t of teams) for (const w of t.warriors) {
  const b = fs.readFileSync(w); const hit = [];
  for (const [k, p] of Object.entries(pats)) for (let i = 0; i + 1 < b.length; i++) if (b[i] === p[0] && b[i + 1] === p[1]) hit.push(`${k}@${i.toString(16)}`);
  if (hit.length) console.log(t.name.padEnd(40), w.split("/").pop(), hit.join(" "));
}
