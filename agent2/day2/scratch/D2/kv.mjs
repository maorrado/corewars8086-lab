// D2: killer->victim matrix (killer = most recent non-self writer in IP-4..IP+3), leader-family cohorts
import fs from "node:fs"; import path from "node:path";
const [dir, re = "^L"] = process.argv.slice(2);
const m = {}; const late = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".jsonl") && new RegExp(re).test(f))) {
  for (const line of fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n")) {
    const d = JSON.parse(line); if (d.warEnd !== undefined) continue;
    const norm = (n) => n.startsWith("CAND") ? n : n.startsWith("zom") ? "zom" : /^T_(V6|V4)/.test(n) ? "V6fam" + n.slice(-1) : "other";
    const v = norm(d.name); if (v === "other") continue;
    const win = d.bytes.slice(0, 8).filter(b => !b.oob && b.by !== d.name && b.r >= 0).sort((a, b) => b.r - a.r);
    const k = win.length ? norm(win[0].by) : "self";
    const key = `${k.padEnd(8)} -> ${v}`; m[key] = (m[key] ?? 0) + 1;
    if (d.round > 5000) late[key] = (late[key] ?? 0) + 1;
  }
}
for (const [k, v] of Object.entries(m).sort()) console.log(k, v, "late(>5000):", late[k] ?? 0);
