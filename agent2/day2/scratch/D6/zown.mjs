import fs from "node:fs";
const D = process.argv[2] || "agent2/day2/q/scratch/_trace/dayTR-1e9efbcb54-dd73fad407";
for (const f of fs.readdirSync(D).filter((f) => f.endsWith(".jsonl"))) {
  const rows = fs.readFileSync(`${D}/${f}`, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const byWar = {};
  for (const r of rows) if (r.alive && r.round >= 150) { const w = byWar[r.war]; if (!w || r.round < w.round) byWar[r.war] = r; }
  const cnt = {};
  for (const r of Object.values(byWar)) for (const a of r.alive.filter((a) => a.z)) {
    const k = `${a.n}:${(a.ipBy || "?").replace(/[12]$/, "")}`; cnt[k] = (cnt[k] || 0) + 1;
  }
  console.log(f, Object.keys(byWar).length, JSON.stringify(Object.entries(cnt).filter(([k]) => !k.endsWith(":load")).sort()));
}
