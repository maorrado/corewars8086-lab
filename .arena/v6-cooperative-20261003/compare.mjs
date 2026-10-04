// Paired comparison of arms in one or more agent2 bench results.
// usage: node compare.mjs <result.json>[,<result2.json>...] <controlArm> [--by-opponent] [--json out.json]
// Unit of pairing = (result file, cohort, seed). CI = Student-t over units (cohort clusters).
import fs from "node:fs";

const args = process.argv.slice(2);
const files = args[0].split(",");
const control = args[1];
const byOpp = args.includes("--by-opponent");
const jsonOut = args.includes("--json") ? args[args.indexOf("--json") + 1] : null;
const tq = (df) => { // Student-t 97.5% quantile; no coarse downward rounding.
  const exact = {1:12.7062047364,2:4.3026527299,3:3.1824463053,4:2.7764451052,5:2.5705818356,6:2.4469118511,7:2.3646242516,8:2.3060041352,9:2.2621571629,10:2.2281388520,11:2.2009851601,12:2.1788128297,13:2.1603686565,14:2.1447866879,24:2.0638985616,49:2.0095752345,74:1.9925434952,99:1.9842169515,149:1.9759053309};
  if(exact[df])return exact[df];
  if(df<1)throw new Error('At least two paired units required');
  const z=1.959963984540054;
  return z+(z**3+z)/(4*df)+(5*z**5+16*z**3+3*z)/(96*df**2)+(3*z**7+19*z**5+17*z**3-15*z)/(384*df**3)+(79*z**9+776*z**7+1482*z**5-1920*z**3-945*z)/(92160*df**4);
};
const units = new Map(); // key -> {arm -> per-battle team score}
const meta = new Map();
const arms = new Set();
for (const f of files) {
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  for (const run of r.runs) {
    const key = `${f}|${run.cohort}|${run.seed}`;
    if (!units.has(key)) units.set(key, {});
    units.get(key)[run.arm] = run.team / run.battles;
    meta.set(key, { battles: run.battles, opponents: Object.keys(run.opponents) });
    arms.add(run.arm);
  }
}
const out = { files, control, units: units.size, arms: {} };
const ctl = [...units.values()].map((u) => u[control]);
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
console.log(`units=${units.size}  control=${control} mean=${mean(ctl).toFixed(6)}`);
for (const arm of [...arms].sort()) {
  const vals = [...units.values()].map((u) => u[arm]);
  if (arm === control) { out.arms[arm] = { mean: mean(vals) }; continue; }
  const d = [...units.values()].map((u) => u[arm] - u[control]);
  const n = d.length, m = mean(d);
  const sd = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1));
  const se = sd / Math.sqrt(n), h = tq(n - 1) * se;
  const w = d.filter((x) => x > 1e-9).length, l = d.filter((x) => x < -1e-9).length;
  out.arms[arm] = { mean: mean(vals), diff: m, se, ci95: [m - h, m + h], wins: w, ties: n - w - l, losses: l };
  console.log(`${arm.padEnd(16)} mean=${mean(vals).toFixed(6)} diff=${m >= 0 ? "+" : ""}${m.toFixed(6)} se=${se.toFixed(6)} ci95=[${(m - h).toFixed(6)},${(m + h).toFixed(6)}] W/T/L=${w}/${n - w - l}/${l}`);
  if (byOpp) {
    const per = new Map();
    for (const [k, u] of units) for (const o of meta.get(k).opponents) {
      if (!per.has(o)) per.set(o, []);
      per.get(o).push(u[arm] - u[control]);
    }
    const rows = [...per].map(([o, a]) => [o, mean(a), a.length]).sort((x, y) => x[1] - y[1]);
    console.log("   worst:", rows.slice(0, 6).map(([o, m2, c]) => `${o}(${c})=${m2.toFixed(3)}`).join(" "));
    console.log("   best: ", rows.slice(-6).reverse().map(([o, m2, c]) => `${o}(${c})=${m2.toFixed(3)}`).join(" "));
    out.arms[arm].perOpponent = Object.fromEntries(rows.map(([o, m2, c]) => [o, { diff: m2, units: c }]));
  }
}
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(out, null, 1) + "\n");
