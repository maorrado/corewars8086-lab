// B061: dynamic trail-family classification from trace warEnd.a45 (A4/A5 bytes written by each team, by address residue mod 4)
// usage: node fam.mjs <traceDir>...
import fs from "node:fs"; import path from "node:path";
const tot = {};
for (const dir of process.argv.slice(2)) for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".jsonl"))) {
  for (const line of fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n")) {
    const d = JSON.parse(line); if (d.warEnd === undefined || !d.a45) continue;
    for (const [k, v] of Object.entries(d.a45)) { const t = (tot[k] ??= { n: 0, r: [0, 0, 0, 0] }); t.n++; v.forEach((x, i) => (t.r[i] += x)); }
  }
}
for (const [k, t] of Object.entries(tot).sort()) console.log(k.padEnd(36), "wars", String(t.n).padStart(3), "per-war by residue 0..3:", t.r.map((x) => (x / t.n).toFixed(0).padStart(6)).join(""));
