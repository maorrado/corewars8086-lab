// Paired comparison of arms in one or more agent2 bench results.
// usage: node compare.mjs <result.json>[,<result2.json>...] <controlArm> [--by-opponent] [--json out.json]
// Unit of pairing = (result file, cohort, seed). CI = Student-t over units (cohort clusters).
import fs from "node:fs";

const args = process.argv.slice(2);
const files = args[0].split(",");
const control = args[1];
const byOpp = args.includes("--by-opponent");
const jsonOut = args.includes("--json") ? args[args.indexOf("--json") + 1] : null;
const tq = (df) => { // two-sided 97.5% quantile of t
  const t = { 1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228, 12: 2.179, 15: 2.131, 20: 2.086, 24: 2.064, 30: 2.042, 40: 2.021, 49: 2.010, 60: 2.000, 99: 1.984, 120: 1.980 };
  const ks = Object.keys(t).map(Number).sort((a, b) => a - b);
  for (const k of ks) if (df <= k) return t[k];
  return 1.96;
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
