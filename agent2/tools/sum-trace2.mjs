// Death attribution v2: phase from instruction history; killer = most recent writer (≠ self) of bytes IP-4..IP+3.
// usage: node sum-trace2.mjs <dir> [team=CAND]
import fs from "node:fs"; import path from "node:path";
const [dir, team = "CAND"] = process.argv.slice(2);
const tally = {}, killers = {}; let deaths = 0;
const add = (o, k, v = 1) => { o[k] = (o[k] ?? 0) + v; };
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".jsonl"))) {
  for (const line of fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n")) {
    const d = JSON.parse(line);
    if (d.warEnd !== undefined || d.group !== team) continue;
    deaths++;
    const ours = new Set([`${team}1`, `${team}2`]);
    const captured = new Set(d.alive.filter(a => a.z && ours.has(a.ipBy)).map(a => a.n));
    const kind = (by) => by === d.name ? "self" : ours.has(by) ? "partner" : by.startsWith("zom") ? (captured.has(by) ? "ourZombie" : "zombie") : (by === "load" || by === "init") ? by : "opp";
    const hist = d.hist.map(h => { const m = h.match(/^r(\d+) (\w+):(\w+) .* (\S+)$/); return { r: +m[1], cs: m[2], ip: parseInt(m[3], 16), code: m[4] }; });
    const prev = hist.slice(0, -1);
    const dwell = prev.slice(-3).filter(h => h.code.startsWith("ff1f")).length;
    let phase;
    if (d.cs === 0x1000) phase = "startup(cs1000)";
    else if (d.cs !== 0x0ffc) phase = "wild-cs";
    else if (dwell >= 2) phase = "dwell";
    else if (prev.slice(-12).some(h => h.code.startsWith("ff1f"))) phase = "rebuild";
    else phase = "worker";
    const win = d.bytes.slice(0, 8).filter(b => !b.oob);
    const cand = win.filter(b => kind(b.by) !== "self" && b.r >= 0).sort((a, b) => b.r - a.r);
    let killer = cand.length ? kind(cand[0].by) : (win.every(b => kind(b.by) === "self") ? "self-only" : "untouched");
    add(tally, `${phase.padEnd(16)} ${d.reason.padEnd(16)} ${killer}`);
    if (killer === "opp") add(killers, cand[0].by.replace(/[12]$/, ""));
  }
}
console.log("deaths", deaths);
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(String(v).padStart(4), k);
console.log("top opponent killers:", Object.entries(killers).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k}=${v}`).join(" "));
