// Day-2 analysis exactly as preregistered in PROTOCOL.md.
import fs from "node:fs";
const load = (id) => JSON.parse(fs.readFileSync(`agent2/results/${id}-persistent.json`, "utf8"));
const grp = (c) => c.startsWith("f2025") ? "2025" : c.startsWith("strong") ? "strong" : c.startsWith("l24") ? "2024live" : "nozombie";
const units = new Map();
for (const r of [load("day2-field"), load("day2-field-nz")]) for (const run of r.runs) {
  const k = `${run.cohort}|${run.seed}`; if (!units.has(k)) units.set(k, { g: grp(run.cohort) });
  units.get(k)[run.arm] = run.team / run.battles;
}
const U = [...units.values()], arms = ["KPH", "rev1", "rev0", "V6", "zchain4"];
const stat = (d, z) => { const n = d.length, m = d.reduce((s, x) => s + x, 0) / n, sd = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1)), h = z * sd / Math.sqrt(n);
  return { n, m, lo: m - h, hi: m + h, w: d.filter((x) => x > 0).length, l: d.filter((x) => x < 0).length }; };
const f = (x) => `${x.m >= 0 ? "+" : ""}${x.m.toFixed(4)} [${x.lo.toFixed(4)},${x.hi.toFixed(4)}] ${x.w}/${x.l} n=${x.n}`;
const G = ["2025", "strong", "2024live", "nozombie"];
console.log("means:"); for (const g of [...G, "pooled"]) { const us = U.filter((u) => g === "pooled" ? u.g !== "nozombie" : u.g === g);
  console.log(" ", g.padEnd(9), arms.map((a) => `${a}=${(us.reduce((s, u) => s + u[a], 0) / us.length).toFixed(4)}`).join(" ")); }
const out = {};
for (const [a, b] of [["KPH", "rev1"], ["KPH", "rev0"], ["rev1", "rev0"], ["KPH", "V6"], ["KPH", "zchain4"], ["rev1", "zchain4"], ["rev1", "V6"]]) {
  const pooled = stat(U.filter((u) => u.g !== "nozombie").map((u) => u[a] - u[b]), 2.5);
  const groups = Object.fromEntries(G.map((g) => [g, stat(U.filter((u) => u.g === g).map((u) => u[a] - u[b]), 1.96)]));
  const pass = pooled.lo > 0 && Object.values(groups).every((x) => x.hi >= 0);
  out[`${a}-${b}`] = { pooled, groups, pass };
  console.log(`\n${a} - ${b}: pooled(z2.5) ${f(pooled)} => ${pass ? "RULE MET" : "rule not met"}`);
  for (const g of G) console.log(`   ${g.padEnd(9)} ${f(groups[g])}`);
}
fs.writeFileSync("agent2/day2/analysis.json", JSON.stringify(out, null, 1) + "\n");
