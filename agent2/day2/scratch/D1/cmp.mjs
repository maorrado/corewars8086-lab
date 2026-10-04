// Compare two trace dirs per cohort: our deaths by killer class, and team score from scores.csv.
import fs from "node:fs"; import path from "node:path";
const dirs = process.argv.slice(2); const ours = new Set(["CAND1", "CAND2"]);
function load(dir) {
  const per = {};
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".jsonl"))) {
    const c = f.replace(".jsonl", ""); const o = per[c] = { A: 0, B: 0, partner: 0, ourZ: 0, opp: 0, zom: 0, other: 0, mem: 0, score: 0 };
    const sc = fs.readFileSync(path.join(dir, c + ".scores.csv"), "utf8").match(/^CAND,([\d.]+)/m); o.score = sc ? +sc[1] : NaN;
    for (const line of fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n")) {
      const d = JSON.parse(line); if (d.warEnd !== undefined || d.group !== "CAND") continue;
      o[d.name === "CAND1" ? "A" : "B"]++; if (d.reason === "memory exception") o.mem++;
      const captured = new Set(d.alive.filter(a => a.z && ours.has(a.ipBy)).map(a => a.n));
      const win = d.bytes.slice(0, 8).filter(b => !b.oob);
      const cand = win.filter(b => b.by !== d.name && b.r >= 0 && b.by !== "init" && b.by !== "load").sort((a, b) => b.r - a.r);
      const kb = cand[0]?.by; const k = !kb ? "other" : ours.has(kb) ? "partner" : kb.startsWith("zom") ? (captured.has(kb) ? "ourZ" : "zom") : "opp";
      o[k]++;
    }
  }
  return per;
}
const P = dirs.map(load);
for (const c of Object.keys(P[0])) console.log(c.padEnd(16), P.map(p => { const o = p[c]; return o ? `score ${String(o.score).padStart(5)} A${o.A} B${o.B} opp${o.opp} part${o.partner} ourZ${o.ourZ} zom${o.zom} oth${o.other} mem${o.mem}` : "-"; }).join("  |  "));
