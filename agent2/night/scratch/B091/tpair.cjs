// paired per-cohort diff between two cached threat result files (same spec key): node tpair.cjs <specKey> <shaA10x_shaB10x> <shaA10y_shaB10y>
const fs = require("fs"); const [key, x, y] = process.argv.slice(2);
const ld = (t) => { const r = JSON.parse(fs.readFileSync(`agent2/night/results/nightT-${key}-${t}.json`)); const o = {}; for (const u of r.runs) o[`${u.cohort}|${u.seed}`] = u.team / u.battles; return o; };
const X = ld(x), Y = ld(y); const by = {};
for (const k of Object.keys(X)) { if (!(k in Y)) continue; const g = k.split("#")[0]; (by[g] ??= []).push(X[k] - Y[k]); (by.ALL ??= []).push(X[k] - Y[k]); }
const st = (d) => { const n = d.length, m = d.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(d.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, n - 1)), se = sd / Math.sqrt(n); return `${m >= 0 ? "+" : ""}${m.toFixed(4)} [${(m - 1.96 * se).toFixed(4)},${(m + 1.96 * se).toFixed(4)}] n=${n} W/L=${d.filter((v) => v > 1e-9).length}/${d.filter((v) => v < -1e-9).length}`; };
for (const [g, d] of Object.entries(by)) console.log(g.padEnd(18), st(d));
