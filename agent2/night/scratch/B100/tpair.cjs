// Paired cand-cand comparison of two done threat jobs on the same spec (same cohorts/seeds).
// usage: node tpair.cjs <jobSuffixX> <jobSuffixY>   -> X - Y per threat (per-battle team score)
const fs = require("fs"); const D = "agent2/night/queue/done/", R = "agent2/night/results/";
const load = (s) => JSON.parse(fs.readFileSync(D + fs.readdirSync(D).find((x) => x.endsWith("-" + s + ".json")))).result;
const [x, y] = process.argv.slice(2).map(load);
if (x.specKey !== y.specKey) { console.log("spec mismatch", x.specKey, y.specKey); process.exit(1); }
const runs = (r) => JSON.parse(fs.readFileSync(R + `nightT-${r.specKey}-${r.candidate.shaA.slice(0, 10)}-${r.candidate.shaB.slice(0, 10)}.json`)).runs;
const m = (rs) => Object.fromEntries(rs.map((u) => [`${u.cohort}|${u.seed}`, u.team / u.battles]));
const X = m(runs(x)), Y = m(runs(y)); const g = {};
for (const k of Object.keys(X)) { if (!(k in Y)) continue; const t = k.split("#")[0]; (g[t] ??= []).push(X[k] - Y[k]); (g.ALL ??= []).push(X[k] - Y[k]); }
const st = (d) => { const n = d.length, mu = d.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(d.reduce((a, b) => a + (b - mu) ** 2, 0) / Math.max(1, n - 1)), se = sd / Math.sqrt(n); return `${mu >= 0 ? "+" : ""}${mu.toFixed(4)} [${(mu - 1.96 * se).toFixed(4)},${(mu + 1.96 * se).toFixed(4)}] n=${n} W/L=${d.filter((v) => v > 1e-9).length}/${d.filter((v) => v < -1e-9).length}`; };
for (const [t, d] of Object.entries(g)) console.log(t.padEnd(14), st(d));
