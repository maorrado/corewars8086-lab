// E7: list INT 87h / INT 86h calls with the last immediate loads of AX/DX/BX/CX before them (static, linear).
import fs from "node:fs";
import * as F from "../../../tools/fields.mjs";
import { disasm } from "../../../tools/dis86.mjs";
const groups = (process.argv[2] ?? "F24,K,P,T").split(",");
const S = JSON.parse(fs.readFileSync("agent2/day2/q/fields/S.json", "utf8"));
const teams = new Map(); const add = (t, g) => { if (!teams.has(t.name)) teams.set(t.name, { ...t, g }); };
F.field2025().forEach((t) => add(t, "2025")); F.field2024final().forEach((t) => add(t, "F24")); F.field2024live().forEach((t) => add(t, "L24"));
F.counters().forEach((t) => add(t, "K")); F.peers().forEach((t) => add(t, "P"));
for (const c of S.cohorts) for (const o of c.opponents) if (o.name.startsWith("T_")) add(o, "T");
for (const [name, t] of teams) { if (!groups.includes(t.g)) continue; t.warriors.forEach((w, wi) => {
  const b = fs.readFileSync(w); const ins = disasm(b, 0, 0); const reg = {}; const out = [];
  for (const x of ins) {
    let m = x.text.match(/^mov (ax|bx|cx|dx|al|ah|bl|bh|cl|ch|dl|dh),([0-9A-F]+)h$/); if (m) reg[m[1]] = m[2];
    m = x.text.match(/^xor (ax|bx|cx|dx|di),\1$/); if (m) reg[m[1]] = "0";
    if (/^(std|cld)$/.test(x.text)) reg.df = x.text;
    if (/^int 8[67]h$/.test(x.text)) out.push(`@${x.at.toString(16)} ${x.text} ax=${reg.ax ?? "?"}${reg.al ? "/al" + reg.al : ""}${reg.ah ? "/ah" + reg.ah : ""} dx=${reg.dx ?? "?"} bx=${reg.bx ?? "?"}${reg.bl ? "/bl" + reg.bl : ""} cx=${reg.cx ?? "?"} ${reg.df ?? ""}`);
  }
  if (out.length) console.log(name + (wi + 1), "\n   " + out.join("\n   "));
}); }
