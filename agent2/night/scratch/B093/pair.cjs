// Paired per-cohort comparison of two done jobs on the same field (screen) or same threat spec.
// usage: node pair.cjs <jobSuffixX> <jobSuffixY> [<jobSuffixZ>]  -> X-Y by group; with Z: additivity X - (Y + Z - base)
const fs = require("fs"); const D = "agent2/night/queue/done/";
const load = (s) => { const f = fs.readdirSync(D).find((x) => x.endsWith("-" + s + ".json")); return JSON.parse(fs.readFileSync(D + f)).result; };
const [x, y, z] = process.argv.slice(2).map(load);
const pc = (r) => Object.fromEntries((r.perCohort || []).map((c) => [c.cohort, c]));
const stat = (d) => { const n = d.length, m = d.reduce((a, b) => a + b, 0) / n; const sd = Math.sqrt(d.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, n - 1)); const se = sd / Math.sqrt(n); return `${m >= 0 ? "+" : ""}${m.toFixed(4)} [${(m - 1.96 * se).toFixed(4)},${(m + 1.96 * se).toFixed(4)}] n=${n} W/L=${d.filter((v) => v > 1e-9).length}/${d.filter((v) => v < -1e-9).length}`; };
const X = pc(x), Y = pc(y), Z = z ? pc(z) : null;
if (!Object.keys(X).length) { console.log("no perCohort in result; keys:", Object.keys(x)); process.exit(1); }
const groups = {};
for (const k of Object.keys(X)) { if (!Y[k]) continue; const g = X[k].group; const d = Z ? X[k].diff - (Y[k].diff + Z[k].diff) : X[k].cand - Y[k].cand; (groups[g] ??= []).push(d); (groups.ALL ??= []).push(d); }
for (const [g, d] of Object.entries(groups)) console.log(g.padEnd(8), stat(d));
