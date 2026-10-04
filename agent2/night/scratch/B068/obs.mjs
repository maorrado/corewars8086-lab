// B068: observational impact from existing queue results (no new battles).
// Collect every run of the rev0 pair (A 6861894f, B 8579e2c2), dedupe by cohort+seed+opponent set, and
// for each opponent team report: cohorts, battles, its own points/battle, and the base team points/battle.
import fs from "node:fs";
const D = "agent2/night/results";
const A0 = "6861894f3c1992cd6c6baa5b2a746178082f5b4b0a1d9969b9a326fe03d86c89", B0 = "8579e2c2212d72a413a6daacfe3b91ceb72be648bfc085bfeed9430eeaf6657a";
const seen = new Set(); const runs = [];
for (const f of fs.readdirSync(D).filter((f) => f.endsWith(".json") && !f.startsWith("nightTR"))) {
  let r; try { r = JSON.parse(fs.readFileSync(`${D}/${f}`, "utf8")); } catch { continue; }
  if (!r.armHashes || !r.runs) continue;
  const baseArms = Object.entries(r.armHashes).filter(([, h]) => h.length === 2 && h[0].sha256 === A0 && h[1].sha256 === B0).map(([k]) => k);
  const nz = f.includes("-nz");
  for (const x of r.runs) if (baseArms.includes(x.arm)) {
    const key = `${x.cohort}|${x.seed}|${Object.keys(x.opponents).sort().join(",")}|${nz}`;
    if (seen.has(key)) continue; seen.add(key); runs.push({ ...x, file: f, nz });
  }
}
console.log("unique base runs", runs.length, "battles", runs.reduce((a, x) => a + x.battles, 0));
const norm = (n) => n.replace(/_c[ABC]$|_m[ABC]$/, "");
const stats = {};
for (const x of runs) {
  if (x.nz) continue;
  const names = Object.keys(x.opponents);
  for (const n of names) { const s = (stats[norm(n)] ??= { coh: 0, bat: 0, opp: 0, team: 0, multi: 0 }); s.coh++; s.bat += x.battles; s.opp += x.opponents[n]; s.team += x.team; if (names.filter((m) => norm(m) === norm(n)).length > 1) s.multi++; }
}
const overall = runs.filter((x) => !x.nz).reduce((a, x) => [a[0] + x.team, a[1] + x.battles], [0, 0]);
console.log("overall base points/battle", (overall[0] / overall[1]).toFixed(4));
const want = process.argv.slice(2);
const rows = Object.entries(stats).map(([n, s]) => ({ n, coh: s.coh, bat: s.bat, opp: s.opp / s.bat, team: s.team / s.bat, multi: s.multi }));
rows.sort((a, b) => b.opp - a.opp);
fs.writeFileSync("agent2/night/scratch/B068/obs.json", JSON.stringify(rows, null, 1));
for (const r of rows) if (!want.length || want.some((w) => r.n.includes(w)))
  console.log(r.n.padEnd(42), `coh ${String(r.coh).padStart(4)} bat ${String(r.bat).padStart(6)} oppPts/b ${r.opp.toFixed(3)} basePts/b ${r.team.toFixed(3)}${r.multi ? " multi" + r.multi : ""}`);
