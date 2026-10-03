// Holdout 5 analysis exactly as preregistered in agent2/protocols/holdout5-frontier.md.
import fs from "node:fs";
const R = (p) => JSON.parse(fs.readFileSync(`agent2/results/holdout5-${p}-persistent.json`, "utf8"));
const CAND = "V6nohunt", LEADERS = ["Good_Test_V6", "Good_Test_V4", "zchain4", "combo_zrl03"];
const tq = (df, p) => { // quantile via normal approx with small-df correction (Cornish-Fisher)
  const z = p === 0.975 ? 1.959964 : 2.497705; // 0.975 or 0.99375
  return z + (z ** 3 + z) / (4 * df) + (5 * z ** 5 + 16 * z ** 3 + 3 * z) / (96 * df * df);
};
function units(results, filter = () => true) {
  const u = new Map();
  for (const r of results) for (const run of r.runs) {
    if (!filter(run)) continue;
    const k = `${r.planId}|${run.cohort}|${run.seed}`;
    if (!u.has(k)) u.set(k, { run });
    u.get(k)[run.arm] = run.team / run.battles;
  }
  return [...u.values()];
}
function diff(us, a, b, p) {
  const d = us.map((x) => x[a] - x[b]); const n = d.length; const m = d.reduce((s, x) => s + x, 0) / n;
  const sd = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1)); const h = tq(n - 1, p) * sd / Math.sqrt(n);
  return { n, diff: m, lo: m - h, hi: m + h };
}
const f = (x) => `${x.diff >= 0 ? "+" : ""}${x.diff.toFixed(4)} [${x.lo.toFixed(4)},${x.hi.toFixed(4)}] n=${x.n}`;
const F = { F1: R("F1"), F2: R("F2"), F3: R("F3"), F4: R("F4"), D: R("D") };
const out = { candidate: CAND, primary: {}, perField: {}, leaderPresent: {}, means: {} };
const pooled = units([F.F1, F.F2, F.F3]);
for (const field of ["F1", "F2", "F3", "F4"]) {
  const us = units([F[field]]);
  out.means[field] = Object.fromEntries(Object.keys(F[field].summary).map((a) => [a, us.reduce((s, x) => s + x[a], 0) / us.length]));
}
for (const g of ["K_V4", "K_V6", "K_zchain4", "K_zrl03"]) {
  const us = units([F.D], (run) => run.cohort.startsWith(g + "-"));
  out.means[g] = Object.fromEntries(Object.keys(F.D.summary).map((a) => [a, us.reduce((s, x) => s + x[a], 0) / us.length]));
  out.means[g + ":leaderScore"] = Object.fromEntries(Object.keys(F.D.summary).map((a) => {
    let s = 0, n = 0; for (const run of F.D.runs) if (run.arm === a && run.cohort.startsWith(g + "-")) { s += run.opponents[g]; n += run.battles; } return [a, s / n];
  }));
}
for (const L of LEADERS) {
  const prim = diff(pooled, CAND, L, 0.99375);
  const fields = Object.fromEntries(["F1", "F2", "F3", "F4"].map((k) => [k, diff(units([F[k]]), CAND, L, 0.975)]));
  const lp = Object.fromEntries(["K_V4", "K_V6", "K_zchain4", "K_zrl03"].map((g) => [g, diff(units([F.D], (run) => run.cohort.startsWith(g + "-")), CAND, L, 0.975)]));
  const anyBelow = [...Object.values(fields), ...Object.values(lp)].some((x) => x.hi < 0);
  const verdict = prim.lo > 0 && !anyBelow ? "BEATS (preregistered rule met)" : prim.hi < 0 ? "LOSES (pooled interval below 0)" : "INCONCLUSIVE / rule not met";
  out.primary[L] = { pooled: prim, verdict }; out.perField[L] = fields; out.leaderPresent[L] = lp;
  console.log(`\n${CAND} - ${L}: pooled F1+F2+F3 (98.75%) ${f(prim)} => ${verdict}`);
  for (const [k, v] of Object.entries(fields)) console.log(`   ${k} ${f(v)}`);
  for (const [k, v] of Object.entries(lp)) console.log(`   leader-present ${k} ${f(v)}`);
}
console.log("\nMean team score per battle by field/group:");
for (const [k, v] of Object.entries(out.means)) console.log(k.padEnd(22), Object.entries(v).sort((a, b) => b[1] - a[1]).map(([a, s]) => `${a}=${s.toFixed(3)}`).join(" "));
fs.writeFileSync("agent2/results/holdout5-analysis.json", JSON.stringify(out, null, 1) + "\n");
