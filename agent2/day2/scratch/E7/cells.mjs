// E7: list absolute-address memory accesses in the first N executed instructions (straight line, follows jmp short/near)
// of every warrior in our fields. usage: node cells.mjs [N=16] [filterHex,...]
import fs from "node:fs";
import * as F from "../../../tools/fields.mjs";
import { disasm } from "../../../tools/dis86.mjs";
const N = +(process.argv[2] ?? 16); const filt = (process.argv[3] ?? "").split(",").filter(Boolean).map((x) => x.toUpperCase());
const S = JSON.parse(fs.readFileSync("agent2/day2/q/fields/S.json", "utf8"));
const teams = new Map();
const add = (t, grp) => { if (!teams.has(t.name)) teams.set(t.name, { ...t, grp }); };
F.field2025().forEach((t) => add(t, "2025")); F.field2024final().forEach((t) => add(t, "F24")); F.field2024live().forEach((t) => add(t, "L24"));
F.counters().forEach((t) => add(t, "K")); F.peers().forEach((t) => add(t, "P"));
for (const c of S.cohorts) for (const o of c.opponents) if (o.name.startsWith("T_")) add(o, "T");
for (const [name, t] of teams) t.warriors.forEach((w, wi) => {
  const b = fs.readFileSync(w); let ip = 0; const acc = [];
  for (let k = 1; k <= N && ip < b.length; k++) {
    const [ins] = disasm(b, ip, 0); if (!ins) break;
    const m = ins.text.match(/\[([0-9A-F]{4})h\]/);
    if (m && !/^(lea|jmp|call)/.test(ins.text)) acc.push(`${k}:${ins.text}`);
    const j = ins.text.match(/^jmp (?:short )?([0-9A-F]{4})h$/);
    ip = j ? parseInt(j[1], 16) : ip + ins.len;
    if (/^(jmp|call|ret|int3|int 87|int 86)/.test(ins.text) && !j) { if (!/int 8[67]/.test(ins.text)) break; }
  }
  const s = acc.filter((a) => !filt.length || filt.some((f) => a.includes(f)));
  if (s.length) console.log(t.grp.padEnd(4), (name + (wi + 1)).padEnd(36), s.join(" | "));
});
