import fs from "node:fs";
for (const D of process.argv.slice(2)) {
  const tot = {}; const byFile = {};
  for (const f of fs.readdirSync(D).filter((f) => f.endsWith(".jsonl"))) {
    for (const l of fs.readFileSync(`${D}/${f}`, "utf8").split("\n").filter(Boolean)) {
      const r = JSON.parse(l); if (!/^CAND/.test(r.name)) continue;
      const kb = r.bytes.slice(0, 4).map((b) => b.by).find((b) => b && b !== "load" && b !== "init") || "none";
      const kil = kb.startsWith("CAND") ? "C" + kb.slice(-1) : kb.startsWith("zom") ? "zom" : kb.startsWith("T_") ? "T" : "opp";
      const k = `${r.name.slice(-1)}<-${kil}${r.round < 1000 ? "e" : ""}`;
      tot[k] = (tot[k] || 0) + 1;
      const g = f.replace(/-\d\.jsonl|\.jsonl/, ""); byFile[g] = byFile[g] || {}; byFile[g][k] = (byFile[g][k] || 0) + 1;
    }
  }
  console.log(D.split("/").pop(), JSON.stringify(Object.fromEntries(Object.entries(tot).sort())));
}
