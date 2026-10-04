// B068: additive model on existing rev0 runs in pure-2025 cohorts: base points/battle = mu + sum_j e_j (ridge),
// then class summaries for EARLY86 / CCbomb / other teams (classes from scan.json).
import fs from "node:fs";
const D = "agent2/night/results";
const A0 = "6861894f3c1992cd6c6baa5b2a746178082f5b4b0a1d9969b9a326fe03d86c89", B0 = "8579e2c2212d72a413a6daacfe3b91ceb72be648bfc085bfeed9430eeaf6657a";
const seen = new Set(); const runs = [];
for (const f of fs.readdirSync(D).filter((f) => f.endsWith(".json") && !f.startsWith("nightTR") && !f.includes("-nz"))) {
  let r; try { r = JSON.parse(fs.readFileSync(`${D}/${f}`, "utf8")); } catch { continue; }
  if (!r.armHashes || !r.runs) continue;
  const arms = Object.entries(r.armHashes).filter(([, h]) => h.length === 2 && h[0].sha256 === A0 && h[1].sha256 === B0).map(([k]) => k);
  for (const x of r.runs) if (arms.includes(x.arm)) {
    const names = Object.keys(x.opponents); if (names.length !== 3 || !names.every((n) => /^[AY]_/.test(n))) continue;
    const key = `${x.cohort}|${x.seed}|${names.sort().join(",")}`; if (seen.has(key)) continue; seen.add(key);
    runs.push({ names, y: x.team / x.battles, w: x.battles, opp: x.opponents });
  }
}
const scan = JSON.parse(fs.readFileSync("agent2/night/scratch/B068/scan.json", "utf8")).filter((r) => r.pool === "2025");
const early = (p) => p.i86 > 0 && p.i86 <= 25;
const cls = Object.fromEntries(scan.map((r) => [r.team, r.per.some(early) ? "EARLY86" : r.per.some((p) => p.cd86 > 0) ? "int86late" : r.per.some((p) => (p.ccByte || p.ccWord) && !p.callfar) ? "CCbomb" : "other"]));
const teams = [...new Set(runs.flatMap((r) => r.names))].sort(); const idx = Object.fromEntries(teams.map((t, i) => [t, i]));
const k = teams.length + 1, lam = 2.0;
const M = Array.from({ length: k }, () => new Float64Array(k)), v = new Float64Array(k);
for (const r of runs) { const xs = [0, ...r.names.map((n) => idx[n] + 1)]; for (const a of xs) { v[a] += r.w * r.y; for (const b of xs) M[a][b] += r.w; } }
for (let i = 1; i < k; i++) M[i][i] += lam * 20;
// solve
const A = M.map((row, i) => [...row, v[i]]);
for (let c = 0; c < k; c++) { let p = c; for (let r = c + 1; r < k; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; [A[c], A[p]] = [A[p], A[c]];
  for (let r = 0; r < k; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let j = c; j <= k; j++) A[r][j] -= f * A[c][j]; } }
const sol = A.map((row, i) => row[k] / row[i]);
const mu = sol[0];
const meanE = teams.reduce((a, t) => a + sol[idx[t] + 1], 0) / teams.length;
console.log(`pure-2025 rev0 runs ${runs.length}, battles ${runs.reduce((a, r) => a + r.w, 0)}, teams ${teams.length}`);
const rows = teams.map((t) => { const rr = runs.filter((r) => r.names.includes(t)); const w = rr.reduce((a, r) => a + r.w, 0);
  return { t, cls: cls[t] ?? "?", eff: sol[idx[t] + 1] - meanE, n: rr.length, bat: w, opp: rr.reduce((a, r) => a + r.opp[t], 0) / w, base: rr.reduce((a, r) => a + r.y * r.w, 0) / w }; });
rows.sort((a, b) => a.eff - b.eff);
for (const r of rows) console.log(r.cls.padEnd(10), r.t.padEnd(36), `effect ${(r.eff >= 0 ? "+" : "") + r.eff.toFixed(3)}  runs ${String(r.n).padStart(3)} bat ${String(r.bat).padStart(5)} oppPts/b ${r.opp.toFixed(3)} basePts/b ${r.base.toFixed(3)}`);
for (const c of ["EARLY86", "int86late", "CCbomb", "other"]) { const g = rows.filter((r) => r.cls === c); console.log(c.padEnd(10), "teams", g.length, "mean effect", (g.reduce((a, r) => a + r.eff, 0) / g.length).toFixed(4), "mean oppPts/b", (g.reduce((a, r) => a + r.opp, 0) / g.length).toFixed(3)); }
fs.writeFileSync("agent2/night/scratch/B068/obs2.json", JSON.stringify({ mu, rows }, null, 1));
