// B070: base (rev0) score per battle in random 2025 cohorts, grouped by how many members of each opponent family are present.
import fs from "node:fs";
const P = JSON.parse(fs.readFileSync("agent2/night/scratch/B070/pool.json", "utf8"));
const FAM = {
  movsw: ["A_IND_cgx123123", "A_WAN_Baltika9", "A_OHS_TrojanByte", "Y_TOM_Code_Killer", "A_WHS_K0F1M_AL_T1L1M"],
  zdecoy: ["A_HRZ_Grindo_Holics", "A_GSA_callfart", "A_AVI_AnotherBitInTheWall"],
  bddecoy: ["A_GGN_OpcodeHunter", "Y_TOM_Thefrogs"],
  toptake: ["A_HRZ_Grindo_Holics", "A_IND_cgx123123", "A_GGN_OpcodeHunter", "A_GSA_callfart", "A_GSA_GhostBytes_0x", "A_HRZ_ADDvanced", "A_WAN_Baltika9"],
};
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const se = (a) => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1) / a.length); };
const all = P.map((c) => c.team / c.battles);
console.log("cohorts", P.length, "battles", P.reduce((a, c) => a + c.battles, 0), "base mean", mean(all).toFixed(4), "se", se(all).toFixed(4));
for (const [f, mem] of Object.entries(FAM)) {
  const g = {};
  for (const c of P) { const k = c.names.filter((n) => mem.includes(n)).length; (g[k] ??= []).push(c.team / c.battles); }
  console.log(f, Object.entries(g).map(([k, a]) => `${k}: n=${a.length} mean=${mean(a).toFixed(3)} se=${a.length > 1 ? se(a).toFixed(3) : "-"}`).join(" | "));
}
// combined: movsw + zdecoy in same cohort
const g = {};
for (const c of P) { const m = c.names.filter((n) => FAM.movsw.includes(n)).length > 0, z = c.names.filter((n) => FAM.zdecoy.includes(n)).length > 0; (g[`movsw${+m}_zdecoy${+z}`] ??= []).push(c.team / c.battles); }
console.log("combined", Object.entries(g).map(([k, a]) => `${k}: n=${a.length} mean=${mean(a).toFixed(3)}`).join(" | "));
// per-team mean base score when that team is present (realistic per-opponent cost)
const per = {};
for (const c of P) for (const n of c.names) (per[n] ??= []).push(c.team / c.battles);
const rows = Object.entries(per).map(([n, a]) => [n, a.length, mean(a)]).sort((x, y) => x[2] - y[2]);
console.log("worst 15 opponents (base mean when present):"); for (const r of rows.slice(0, 15)) console.log(r[0].padEnd(32), r[1], r[2].toFixed(3));
// pairs of the worst teams: cohorts containing 2 of the worst-10
const worst = rows.slice(0, 10).map((r) => r[0]);
const g2 = {}; for (const c of P) { const k = c.names.filter((n) => worst.includes(n)).length; (g2[k] ??= []).push(c.team / c.battles); }
console.log("count of worst-10 teams in cohort", Object.entries(g2).map(([k, a]) => `${k}: n=${a.length} mean=${mean(a).toFixed(3)} se=${a.length > 1 ? se(a).toFixed(3) : "-"}`).join(" | "));
// additivity check for worst-10: predicted from single effects
const eff = Object.fromEntries(rows.map((r) => [r[0], r[2] - mean(all)]));
const two = P.filter((c) => c.names.filter((n) => worst.includes(n)).length >= 2);
for (const c of two) console.log("  pair cohort", c.names.join(","), "obs", (c.team / c.battles).toFixed(3), "additive pred", (mean(all) + c.names.reduce((a, n) => a + eff[n], 0)).toFixed(3));
// sub-additivity summary + decoy pair cohorts + hypergeometric prevalence
const dd = two.map((c) => c.team / c.battles - (mean(all) + c.names.reduce((a, n) => a + eff[n], 0)));
console.log("pairs of worst-10: obs - additive pred mean", mean(dd).toFixed(3), "se", se(dd).toFixed(3), "n", dd.length, "positive", dd.filter((x) => x > 0).length);
for (const c of P) if (c.names.filter((n) => FAM.zdecoy.includes(n)).length >= 2 || c.names.filter((n) => FAM.movsw.includes(n)).length >= 2) console.log("  multi-family", c.names.join(","), (c.team / c.battles).toFixed(3), c.battles, JSON.stringify(c.opp), c.src);
const C = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return r; };
for (const [f, mem] of Object.entries(FAM)) { const m = mem.length, N = 75; const p2 = (C(m, 2) * C(N - m, 1) + C(m, 3)) / C(N, 3); console.log(`P(>=2 of ${f} (${m}/75) in a 3-opponent cohort) = ${(100 * p2).toFixed(2)}%`); }
