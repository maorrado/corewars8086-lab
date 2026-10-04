import fs from "node:fs";
const D = "agent2/day2/q/scratch/_trace/dayTR-1e9efbcb54-dd73fad407";
const files = process.argv.slice(2);
const tot = {};
for (const f of files) {
  const rows = fs.readFileSync(`${D}/${f}`, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  for (const r of rows.filter((r) => /^CAND|^T_/.test(r.name))) {
    const vic = (r.name.startsWith("CAND") ? "C" : "T") + (r.name.endsWith("1") ? "A" : "B");
    const kb = r.bytes.slice(0, 4).map((b) => b.by).find((b) => b && b !== "load" && b !== "init") || "none";
    const kil = kb.startsWith("CAND") ? "C" + (kb.endsWith("1") ? "A" : "B") : kb.startsWith("T_") ? "T" + (kb.endsWith("1") ? "A" : "B") : kb.startsWith("zom") ? "zom" : "opp";
    const ph = r.round < 300 ? "early" : r.round < 5000 ? "mid" : "late";
    const k = `${ph} ${vic}<-${kil}`;
    tot[k] = (tot[k] || 0) + 1;
  }
}
console.log(Object.entries(tot).sort().map(([k, v]) => `${k}: ${v}`).join("\n"));
