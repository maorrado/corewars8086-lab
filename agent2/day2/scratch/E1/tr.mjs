// E1: per-cohort CAND deaths by killer (byte writer at IP) and our CS
import fs from "node:fs";
const d = process.argv[2];
for (const f of fs.readdirSync(d).filter((x) => x.endsWith(".jsonl"))) {
  const rows = fs.readFileSync(`${d}/${f}`, "utf8").trim().split("\n").map((l) => JSON.parse(l));
  const ours = rows.filter((r) => (r.name ?? "").startsWith("CAND"));
  const k = {}; const cs = {};
  for (const r of ours) { const by = r.bytes?.[0]?.by ?? "?"; k[by] = (k[by] ?? 0) + 1; cs[r.cs.toString(16)] = (cs[r.cs.toString(16)] ?? 0) + 1; }
  console.log(f.padEnd(40), ours.length, JSON.stringify(k), JSON.stringify(cs));
}
