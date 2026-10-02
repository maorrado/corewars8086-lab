// Summarize A2Trace jsonl: who wrote the bytes at the candidate's fatal CS:IP. usage: node sum-trace.mjs <dir> [team=CAND]
import fs from "node:fs"; import path from "node:path";
const [dir, team = "CAND"] = process.argv.slice(2);
const cls = {}, byRound = {}, ex = [];
let deaths = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".jsonl"))) {
  const lines = fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n").map(l => JSON.parse(l));
  for (const d of lines) {
    if (d.warEnd !== undefined || d.group !== team) continue;
    deaths++;
    const ours = new Set([`${team}1`, `${team}2`]);
    const captured = new Set(d.alive.filter(a => a.z && ours.has(a.ipBy)).map(a => a.n));
    const kind = (by) => by === d.name ? "self" : ours.has(by) ? "partner" : by.startsWith("zom") ? (captured.has(by) ? "ourZombie" : "zombie") : (by === "load" || by === "init") ? by : "opponent";
    const b0 = d.bytes[0]; const k0 = b0.oob ? "oob" : kind(b0.by);
    // first non-self writer within the first 4 bytes
    let k = k0; if (k0 === "self") { for (const b of d.bytes.slice(1, 4)) { if (!b.oob && kind(b.by) !== "self") { k = "self+" + kind(b.by); break; } } }
    const loc = d.cs === 0x1000 ? "cs1000" : d.cs === 0x0ffc ? "cs0ffc" : "cs" + d.cs.toString(16);
    const key = `${d.reason.padEnd(16)} ${loc.padEnd(7)} killer=${k}`;
    cls[key] = (cls[key] ?? 0) + 1;
    const rb = d.round < 1000 ? "<1k" : d.round < 5000 ? "<5k" : ">=5k";
    byRound[`${rb} ${k}`] = (byRound[`${rb} ${k}`] ?? 0) + 1;
    if (ex.length < 400) ex.push({ f, war: d.war, r: d.round, n: d.name, reason: d.reason, cs: d.cs.toString(16), ip: d.ip.toString(16), sp: d.sp.toString(16), bytes: d.bytes.map(b => b.oob ? "oob" : `${b.v.toString(16).padStart(2, "0")}:${b.by}@${b.r}`).join(" ") });
  }
}
console.log("deaths", deaths);
for (const [k, v] of Object.entries(cls).sort((a, b) => b[1] - a[1])) console.log(String(v).padStart(4), k);
console.log(Object.entries(byRound).sort().map(([k, v]) => `${k}=${v}`).join("  "));
fs.writeFileSync(path.join(dir, "examples.json"), JSON.stringify(ex, null, 1));
