// D2: end-state summary per cohort: our share, leader share, zombies alive, captured zombie writers
import fs from "node:fs"; import path from "node:path";
const [dir] = process.argv.slice(2);
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".jsonl"))) {
  const ends = fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n").map(l => JSON.parse(l)).filter(d => d.warEnd !== undefined);
  let us = 0, cap200 = 0, zAlive = 0, timeouts = 0; const pat = {};
  for (const e of ends) {
    const w = e.winners.split(", ").filter(x => !x.startsWith("zom"));
    const teams = {}; for (const x of w) { const t = x.replace(/[12]$/, ""); teams[t] = (teams[t] ?? 0) + 1; }
    const n = w.length; us += (teams.CAND ?? 0) / Math.max(n, 1);
    if (e.round >= 200000) timeouts++;
    zAlive += e.winners.split(", ").filter(x => x.startsWith("zom")).length;
    const k = Object.entries(teams).map(([t, c]) => `${t.replace(/^T_|^[AY]_/, "").slice(0, 10)}${c}`).sort().join("+"); pat[k] = (pat[k] ?? 0) + 1;
  }
  console.log(f.padEnd(24), "us", (us / ends.length).toFixed(3), "timeouts", timeouts, "zAliveEnd/war", (zAlive / ends.length).toFixed(2), JSON.stringify(Object.entries(pat).sort((a, b) => b[1] - a[1]).slice(0, 6)));
}
