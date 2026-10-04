// B068: per-threat base team score from a threat job's base result file (cand = base jobs), with per-cohort SE.
import fs from "node:fs";
const key = process.argv[2]; const r = JSON.parse(fs.readFileSync(`agent2/night/results/nightT-${key}-base-rev0.json`, "utf8"));
const g = {};
for (const x of r.runs) { const t = x.cohort.split("#")[0]; (g[t] ??= []).push(x); }
const st = (a) => { const m = a.reduce((s, v) => s + v, 0) / a.length; const sd = Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, a.length - 1)); return { m, se: sd / Math.sqrt(a.length) }; };
const out = {};
for (const [t, xs] of Object.entries(g)) {
  const team = st(xs.map((x) => x.team / x.battles)), w1 = st(xs.map((x) => x.w1 / x.battles)), w2 = st(xs.map((x) => x.w2 / x.battles));
  const opp = st(xs.map((x) => Object.values(x.opponents).reduce((a, v) => a + v, 0) / x.battles));
  out[t] = { cohorts: xs.length, battles: xs.reduce((a, x) => a + x.battles, 0), base: +team.m.toFixed(4), se: +team.se.toFixed(4), A: +w1.m.toFixed(4), B: +w2.m.toFixed(4), threatTeams: +opp.m.toFixed(4), perCohort: xs.map((x) => +(x.team / x.battles).toFixed(3)) };
}
console.log(JSON.stringify(out, null, 0).replace(/},"/g, '},\n"'));
const ks = Object.keys(out); if (ks.length === 2) { const [a, b] = ks; const d = out[a].base - out[b].base, se = Math.hypot(out[a].se, out[b].se); console.log(`${a} - ${b}: ${d.toFixed(4)} +- ${se.toFixed(4)} (1 SE), z=${(d / se).toFixed(2)}`); }
