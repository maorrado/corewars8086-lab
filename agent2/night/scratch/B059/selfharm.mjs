// B059: classify CAND deaths with self-harm detail (based on agent2/tools/sum-trace2.mjs logic)
import fs from "node:fs"; import path from "node:path";
const [dir, team = "CAND", verbose = ""] = process.argv.slice(2);
const tally = {};
const hx = (v, n = 2) => v === undefined ? "??" : v.toString(16).padStart(n, "0");
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".jsonl"))) {
  for (const line of fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n")) {
    const d = JSON.parse(line);
    if (d.warEnd !== undefined || d.group !== team) continue;
    const ours = new Set([`${team}1`, `${team}2`]);
    const kind = (by) => by === d.name ? "self" : ours.has(by) ? "partner" : (by ?? "").startsWith("zom") ? "zombie" : (by === "load" || by === "init") ? by : "opp";
    const win = d.bytes.slice(0, 8).filter(b => !b.oob);
    const cand = win.filter(b => kind(b.by) !== "self" && b.r >= 0).sort((a, b) => b.r - a.r);
    let killer = cand.length ? kind(cand[0].by) : (win.every(b => kind(b.by) === "self") ? "self-only" : "untouched");
    // our-zombie heuristic: zombie-written bytes in window that match our trail (A4 xx FB 0F) / anchor FF 1F
    let sub = "";
    if (killer === "zombie") {
      const zb = win.filter(b => kind(b.by) === "zombie").map(b => b.v);
      const s = zb.map(v => hx(v)).join("");
      sub = /fb0f|0ffb|ff1f|a4/.test(s) ? "/ourTrailPattern" : "/other";
    }
    const lin = ((d.cs * 16 + d.ip) & 0xffff);
    const ph = d.cs === 0x1000 ? "startup" : d.cs === 0x0ffb ? "steady" : "wild";
    const key = `${ph} ${d.reason} ${killer}${sub}`;
    tally[key] = (tally[key] ?? 0) + 1;
    if (verbose && (killer !== "opp")) {
      console.log(`${f} w${d.war} r${d.round} ${d.name} ${key} cs:ip=${hx(d.cs,4)}:${hx(d.ip,4)} lin=${hx(lin,4)} sp=${hx(d.sp,4)} load=${hx(d.load,4)}`);
      console.log("   bytes " + d.bytes.map(b => `${hx(b.v)}/${b.by}@${b.r}`).join(" "));
      console.log("   hist " + d.hist.slice(-4).join(" | "));
    }
  }
}
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(String(v).padStart(4), k);
