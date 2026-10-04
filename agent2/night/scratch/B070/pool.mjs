// B070: pool rev0 (base) runs on randomly drawn 2025 cohorts across all night results (read-only; no battles run).
import fs from "node:fs";
const D = "agent2/night/results";
const A0 = "6861894f3c1992cd6c6baa5b2a746178082f5b4b0a1d9969b9a326fe03d86c89", B0 = "8579e2c2212d72a413a6daacfe3b91ceb72be648bfc085bfeed9430eeaf6657a";
const seen = new Map(); const prefixes = {};
for (const f of fs.readdirSync(D)) {
  if (f.endsWith("-nz.json")) continue; // no-zombie field excluded
  const r = JSON.parse(fs.readFileSync(`${D}/${f}`, "utf8"));
  const arms = Object.entries(r.armHashes).filter(([, w]) => w[0].sha256 === A0 && w[1].sha256 === B0).map(([k]) => k);
  for (const run of r.runs) {
    if (!arms.includes(run.arm)) continue;
    const p = run.cohort.replace(/[-#].*$/, ""); prefixes[p] = (prefixes[p] ?? 0) + 1;
    const names = Object.keys(run.opponents);
    if (!names.every((n) => /^[AY]_/.test(n)) || names.length !== 3) continue;
    if (!/^(f2025|s2025|c2025|2025)/.test(run.cohort)) continue;
    const k = `${run.cohort}|${run.seed}`;
    if (!seen.has(k)) seen.set(k, { names, battles: run.battles, team: run.team, opp: run.opponents, src: f });
  }
}
fs.writeFileSync("agent2/night/scratch/B070/pool.json", JSON.stringify([...seen.values()]));
console.log("prefixes", prefixes); console.log("unique 2025 cohorts", seen.size);
