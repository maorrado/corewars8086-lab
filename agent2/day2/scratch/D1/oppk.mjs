// Who kills the opponents (and our A/B): classify the fatal writer and whether its trail word was written
// inside the writer's own normal trail range (coupled) or elsewhere (free-running SP).
// Trail word = A4 pp FB 0F (V6 family, FAR_SEG 0FFBh): writer anchor = pp52h; coupled range [anchor, anchor+len).
import fs from "node:fs"; import path from "node:path";
const dir = process.argv[2]; const ours = new Set(["CAND1", "CAND2"]);
const t = {};
const add = (k) => t[k] = (t[k] ?? 0) + 1;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".jsonl"))) {
  for (const line of fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n")) {
    const d = JSON.parse(line);
    if (d.warEnd !== undefined) continue;
    const captured = new Set(d.alive.filter(a => a.z && ours.has(a.ipBy)).map(a => a.n));
    const win = d.bytes.slice(0, 8).filter(b => !b.oob);
    const cand = win.filter(b => b.by !== d.name && b.r >= 0 && b.by !== "init" && b.by !== "load").sort((a, b) => b.r - a.r);
    if (!cand.length) continue;
    const kb = cand[0].by;
    const kcls = ours.has(kb) ? kb : kb.startsWith("zom") ? (captured.has(kb) ? "ourZ" : "zom") : "opp";
    if (kcls === "opp" || kcls === "zom") { add(`victim=${d.group === "CAND" ? d.name : d.group.startsWith("T_") ? "LEADER" : "other"} killer=${kcls}`); continue; }
    // find trail word by killer
    let pp = null, at = null;
    const base = d.cs * 16 + d.ip - 4 - 0x10000;
    for (let i = 0; i < d.bytes.length - 1; i++) if (d.bytes[i].by === kb && d.bytes[i].v === 0xa4 && d.bytes[i + 1].by === kb) { pp = d.bytes[i + 1].v; at = (base + i) & 0xffff; break; }
    let mode = "noword";
    if (pp != null) {
      const anc = (pp << 8) | 0x52; const rel = (at - anc) & 0xffff;
      const len = kb === "CAND1" ? 0x400 : 0x800;
      mode = rel < len ? "coupled" : "free";
    }
    add(`victim=${d.group === "CAND" ? d.name : d.group.startsWith("T_") ? "LEADER" : "other"} killer=${kcls} ${mode}`);
  }
}
for (const [k, v] of Object.entries(t).sort()) console.log(String(v).padStart(4), k);
