// D1 self-harm analysis: for every CAND death whose fatal writer is the partner or a captured zombie,
// print victim, phase, victim anchor, fatal bytes, writer anchor page (from trail word A4 xx), timings.
// usage: node sh.mjs <traceDir> [filter=partner|ourZombie|all]
import fs from "node:fs"; import path from "node:path";
const [dir, filt = "self"] = process.argv.slice(2);
const team = "CAND"; const ours = new Set(["CAND1", "CAND2"]);
const add = (o, k, v = 1) => { o[k] = (o[k] ?? 0) + v; };
const tally = {}; const rows = [];
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".jsonl"))) {
  for (const line of fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n")) {
    const d = JSON.parse(line);
    if (d.warEnd !== undefined || d.group !== team) continue;
    const captured = new Set(d.alive.filter(a => a.z && ours.has(a.ipBy)).map(a => a.n));
    const kind = (by) => by === d.name ? "self" : ours.has(by) ? "partner" : by.startsWith("zom") ? (captured.has(by) ? "ourZombie" : "zombie") : (by === "load" || by === "init") ? by : "opp";
    const hist = d.hist.map(h => { const m = h.match(/^r(\d+) (\w+):(\w+) sp=(\w+) di=(\w+) si=(\w+) cx=(\w+) dx=(\w+) (\S+)$/); return m ? { r: +m[1], cs: parseInt(m[2], 16), ip: parseInt(m[3], 16), sp: parseInt(m[4], 16), cx: parseInt(m[7], 16), dx: parseInt(m[8], 16), code: m[9] } : null; }).filter(Boolean);
    const prev = hist.slice(0, -1);
    const dwell = prev.slice(-3).filter(h => h.code.startsWith("ff1f")).length;
    let phase;
    if (d.cs === 0x1000) phase = "startup";
    else if (d.cs !== 0x0ffb) phase = "wild-cs" + d.cs.toString(16);
    else if (dwell >= 2) phase = "dwell";
    else if (prev.slice(-30).some(h => h.code.startsWith("ff1f"))) phase = "rebuild/worker";
    else phase = "other";
    const win = d.bytes.slice(0, 8).filter(b => !b.oob);
    const cand = win.filter(b => kind(b.by) !== "self" && b.r >= 0).sort((a, b) => b.r - a.r);
    const killer = cand.length ? kind(cand[0].by) : "none";
    const kb = cand.length ? cand[0].by : "-";
    // last anchor executed
    const lastAnchor = [...hist].reverse().find(h => h.code.startsWith("ff1f"));
    const vAnchor = lastAnchor ? ((lastAnchor.ip - 0x50) & 0xffff) : null;
    // trail word written by killer: find an A4/A5 byte by killer and the next byte
    let kpage = null;
    for (let i = 0; i < d.bytes.length - 1; i++) if (d.bytes[i].by === kb && (d.bytes[i].v === 0xa4 || d.bytes[i].v === 0xa5) && d.bytes[i + 1].by === kb) { kpage = d.bytes[i + 1].v; break; }
    const off = d.cs === 0x0ffb ? ((d.ip - 0x50) & 0xffff) : ((d.cs * 16 + d.ip - 0x10000) & 0xffff);
    const rel = vAnchor != null ? ((off - vAnchor) & 0xffff) : null;
    const isSelf = killer === "partner" || killer === "ourZombie";
    add(tally, `${d.name} ${phase} ${killer}`);
    if (filt === "all" || (filt === "self" && isSelf) || filt === killer)
      rows.push({ f: f.replace(".jsonl", ""), war: d.war, r: d.round, v: d.name, phase, killer, kb, kr: cand[0]?.r, off: off.toString(16), vA: vAnchor?.toString(16), rel: rel?.toString(16), kpage: kpage?.toString(16), dx: lastAnchor?.dx.toString(16), cx: lastAnchor?.cx, bytes: d.bytes.map(b => b.v.toString(16).padStart(2, "0") + ":" + (b.by === d.name ? "S" : b.by === "CAND1" ? "A" : b.by === "CAND2" ? "B" : b.by.slice(0, 6))).join(" "), last: hist.slice(-3).map(h => h.ip.toString(16) + ":" + h.code).join(" ") });
  }
}
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(String(v).padStart(4), k);
for (const r of rows) console.log(JSON.stringify(r));
