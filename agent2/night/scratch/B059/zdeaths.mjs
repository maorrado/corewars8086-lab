// B059: zombie deaths in CS 1000h whose fatal window was written by our team or a (captured) zombie with our trail pattern
import fs from "node:fs"; import path from "node:path";
const [dir] = process.argv.slice(2);
const hx = (v, n = 2) => v === undefined ? "??" : v.toString(16).padStart(n, "0");
let n = 0, tot = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".jsonl"))) {
  for (const line of fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n")) {
    const d = JSON.parse(line);
    if (d.warEnd !== undefined || d.type !== "ZOMBIE") continue; tot++;
    const s = d.bytes.slice(0, 8).map(b => hx(b.v)).join("");
    const by = [...new Set(d.bytes.slice(0, 8).map(b => b.by))];
    const ourish = by.some(b => /CAND/.test(b)) || (/fb0f|a4..fb/.test(s) && by.some(b => /^zom/.test(b)));
    if (d.cs === 0x1000 && ourish) { n++; console.log(`${f} w${d.war} r${d.round} ${d.name} ip=${hx(d.ip,4)} sp=${hx(d.sp,4)} ${d.bytes.slice(0,8).map(b=>hx(b.v)+'/'+b.by+'@'+b.r).join(' ')} | ${d.hist.slice(-2).join(' | ')}`); }
  }
}
console.log("zombie deaths", tot, "in cs1000 with our/zombie-trail bytes", n);
