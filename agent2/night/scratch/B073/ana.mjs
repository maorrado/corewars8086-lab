// B073 helper: per-threat base/cand team scores (w1/w2) and threat-team scores from a threat job's result files.
import fs from "node:fs";
const key = process.argv[2]; const R = "agent2/night/results";
const files = fs.readdirSync(R).filter((f) => f.startsWith(`nightT-${key}-`));
for (const f of files) {
  const r = JSON.parse(fs.readFileSync(`${R}/${f}`, "utf8")); const g = {};
  for (const x of r.runs) { const t = x.cohort.split("#")[0]; (g[t] ??= []).push(x); }
  console.log(f);
  for (const [t, xs] of Object.entries(g)) {
    const m = (k) => xs.reduce((a, x) => a + x[k] / x.battles, 0) / xs.length;
    const v = xs.map((x) => x.team / x.battles); const mu = v.reduce((a, b) => a + b, 0) / v.length;
    const se = Math.sqrt(v.reduce((a, b) => a + (b - mu) ** 2, 0) / (v.length - 1) / v.length);
    const opp = xs.reduce((a, x) => a + Object.entries(x.opponents).filter(([n]) => n.startsWith("X_")).reduce((s, [, y]) => s + y, 0) / x.battles, 0) / xs.length;
    console.log(`  ${t}: n=${xs.length} team ${mu.toFixed(4)} (SE ${se.toFixed(4)}) w1 ${m("w1").toFixed(4)} w2 ${m("w2").toFixed(4)} counterTeamsTotal ${opp.toFixed(4)}`);
  }
}
