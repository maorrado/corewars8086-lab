// For each CAND death: which killer class, and how many non-CAND non-zombie survivors were alive at death.
import fs from "node:fs"; import path from "node:path";
const dir = process.argv[2]; const ours = new Set(["CAND1", "CAND2"]);
const t = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".jsonl"))) {
  for (const line of fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n")) {
    const d = JSON.parse(line);
    if (d.warEnd !== undefined || d.group !== "CAND") continue;
    const captured = new Set(d.alive.filter(a => a.z && ours.has(a.ipBy)).map(a => a.n));
    const kind = (by) => by === d.name ? "self" : ours.has(by) ? "partner" : by.startsWith("zom") ? (captured.has(by) ? "ourZombie" : "zombie") : (by === "load" || by === "init") ? by : "opp";
    const win = d.bytes.slice(0, 8).filter(b => !b.oob);
    const cand = win.filter(b => kind(b.by) !== "self" && b.r >= 0).sort((a, b) => b.r - a.r);
    const killer = cand.length ? kind(cand[0].by) : "none";
    const opps = d.alive.filter(a => !a.z && !ours.has(a.n)).length;
    const partnerAlive = d.alive.some(a => ours.has(a.n) && a.n !== d.name);
    const k = `${killer.padEnd(10)} opps=${opps > 0 ? "yes" : "no "} partner=${partnerAlive ? "yes" : "no"}`;
    t[k] = (t[k] ?? 0) + 1;
  }
}
for (const [k, v] of Object.entries(t).sort()) console.log(String(v).padStart(4), k);
