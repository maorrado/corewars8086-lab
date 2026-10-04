import fs from "node:fs";
const D = process.argv[2] || "agent2/day2/q/scratch/_trace/dayTR-1e9efbcb54-dd73fad407";
for (const f of fs.readdirSync(D).filter((f) => f.endsWith(".jsonl"))) {
  const rows = fs.readFileSync(`${D}/${f}`, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const cand = rows.filter((r) => (r.name||"").startsWith("CAND"));
  const k = {};
  for (const r of cand) {
    const by = r.bytes.slice(0, 2).map((b) => b.by).find((b) => b && b !== "load" && b !== "init") || "self/none";
    const ph = r.round < 100 ? "early" : r.round < 2000 ? "mid" : "late";
    const key = `${by.replace(/[12]$/, "")}/${ph}`;
    k[key] = (k[key] || 0) + 1;
  }
  const sc = fs.readFileSync(`${D}/${f.replace(".jsonl", ".scores.csv")}`, "utf8").split("\n").slice(0, 3).join(" | ");
  console.log(f, "deaths", cand.length, JSON.stringify(Object.entries(k).sort((a, b) => b[1] - a[1]).slice(0, 8)));
}
