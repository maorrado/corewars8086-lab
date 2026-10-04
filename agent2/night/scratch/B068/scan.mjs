// B068: prevalence scan for domain 8 (early INT86 heavy bombs, dense CC bombers) over the realistic pools.
// For each warrior: follow the first execution path (unconditional jmps followed, conditional jumps fall through,
// calls followed) and report the instruction index of the first INT 86h, plus static CC-bomb markers.
import fs from "node:fs"; import { execFileSync } from "node:child_process";
import * as F from "../../../tools/fields.mjs";
const pools = { "2025": F.field2025(), "2024live": F.field2024live(), "2024final": F.field2024final(), "2023final": F.field2023final() };
function dis(p) {
  const out = execFileSync("node", ["agent2/tools/dis86.mjs", p], { encoding: "utf8" });
  const m = new Map();
  for (const l of out.split("\n")) { const r = l.match(/^([0-9a-f]{4}): ((?:[0-9a-f]{2} )+)\s+(.*)$/i); if (r) m.set(parseInt(r[1], 16), { hex: r[2].trim(), txt: r[3].trim() }); }
  return m;
}
function walk(m) {
  let ip = 0, n = 0; const seen = new Set(); let i86 = -1, i87 = -1, firstLoop = -1;
  while (n < 80 && m.has(ip) && !seen.has(ip)) {
    seen.add(ip); const ins = m.get(ip); n++;
    if (/int 86h/i.test(ins.txt) && i86 < 0) i86 = n;
    if (/int 87h/i.test(ins.txt) && i87 < 0) i87 = n;
    const j = ins.txt.match(/^(jmp( short)?|call) ([0-9A-F]{4})h$/i);
    const len = ins.hex.split(" ").length;
    if (j && !/^call/i.test(j[1])) { const t = parseInt(j[3], 16); if (t <= ip && firstLoop < 0) firstLoop = n; ip = t; continue; }
    const jc = ins.txt.match(/^(j[a-z]+|loop[a-z]*)( short)? ([0-9A-F]{4})h$/i);
    if (jc && parseInt(jc[3], 16) <= ip && firstLoop < 0) firstLoop = n;
    ip += len;
  }
  return { i86, i87, firstLoop, steps: n };
}
const rows = [];
for (const [pool, teams] of Object.entries(pools)) for (const t of teams) {
  const per = [];
  for (const w of t.warriors) {
    const b = fs.readFileSync(w); const m = dis(w); const wk = walk(m);
    const hex = b.toString("hex");
    const cnt = (re) => (hex.match(re) || []).length;
    const all = [...m.values()].map((x) => x.txt).join("\n");
    per.push({ w: w.split("/").pop(), size: b.length, cd86: cnt(/(..)*?cd86/g) && (hex.match(/cd86/g) || []).length, cd87: (hex.match(/cd87/g) || []).length,
      i86: wk.i86, i87: wk.i87, firstLoop: wk.firstLoop,
      ccByte: /mov byte \[[^\]]+\],CCh/i.test(all), ccWord: /,CCCCh/i.test(all), stos: /stos/i.test(all), movs: /movs/i.test(all), callfar: /call far/i.test(all) });
  }
  rows.push({ pool, team: t.name, per });
}
fs.writeFileSync("agent2/night/scratch/B068/scan.json", JSON.stringify(rows, null, 1));
const early = (p) => p.i86 > 0 && p.i86 <= 25;
for (const pool of Object.keys(pools)) {
  const rs = rows.filter((r) => r.pool === pool);
  const u86 = rs.filter((r) => r.per.some((p) => p.cd86 > 0)), e86 = rs.filter((r) => r.per.some(early));
  const ccb = rs.filter((r) => r.per.some((p) => (p.ccByte || p.ccWord) && !p.callfar));
  console.log(`\n== ${pool}: ${rs.length} teams; CD86 present ${u86.length}; INT86 on first path within 25 instr ${e86.length}; CC-writer w/o far-call ${ccb.length}`);
  for (const r of rs) {
    const tag = [r.per.some(early) ? "EARLY86" : r.per.some((p) => p.cd86) ? "int86" : "", r.per.some((p) => (p.ccByte || p.ccWord) && !p.callfar) ? "CCbomb" : ""].filter(Boolean).join(",");
    if (tag) console.log(tag.padEnd(16), r.team.padEnd(40), r.per.map((p) => `${p.w}:${p.size}B i86@${p.i86} cd86x${p.cd86} loop@${p.firstLoop}${p.stos ? " stos" : ""}${p.movs ? " movs" : ""}${p.callfar ? " cfar" : ""}`).join(" | "));
  }
}
