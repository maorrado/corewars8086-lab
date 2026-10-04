// B095: paired per-cohort difference between two candidate result files on the same threat spec.
// usage: node tpair.cjs <specKey> <candShaA10-candShaB10 #1> <#2>
const R = "agent2/night/results/";
const [key, x, y] = process.argv.slice(2);
const sc = (f) => { const r = require("../../../../" + R + `nightT-${key}-${f}.json`); const o = {}; for (const u of r.runs) o[`${u.cohort}|${u.seed}`] = { v: u.team / u.battles, c: u.cohort }; return o; };
const a = sc(x), b = sc(y); const g = {};
for (const k of Object.keys(a)) (g[a[k].c.split("#")[0]] ??= []).push(a[k].v - b[k].v);
const st = (xs) => { const n = xs.length, mu = xs.reduce((p, q) => p + q, 0) / n; const sd = Math.sqrt(xs.reduce((p, q) => p + (q - mu) ** 2, 0) / Math.max(1, n - 1)); return `${mu >= 0 ? "+" : ""}${mu.toFixed(4)} [${(mu - 1.96 * sd / Math.sqrt(n)).toFixed(4)},${(mu + 1.96 * sd / Math.sqrt(n)).toFixed(4)}] n=${n} W/L=${xs.filter((v) => v > 1e-9).length}/${xs.filter((v) => v < -1e-9).length}`; };
for (const [k, xs] of Object.entries(g)) console.log(k.padEnd(24), st(xs));
console.log("ALL".padEnd(24), st(Object.values(g).flat()));
