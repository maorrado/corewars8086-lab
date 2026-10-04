// B095: per-cohort additivity of screens: combo - (mix4 + p0f13), and combo vs each part.
const fs = require("fs"); const D = "agent2/night/queue/done/";
const load = (id) => JSON.parse(fs.readFileSync(D + fs.readdirSync(D).find((x) => x.includes(id)))).result.perCohort;
const [C, M, P] = ["f30mc", "irh7d", "tcluu"].map(load);
const by = (a) => Object.fromEntries(a.map((x) => [x.cohort, x]));
const m = by(M), p = by(P);
const st = (xs) => { const n = xs.length, mu = xs.reduce((a, b) => a + b, 0) / n; const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mu) ** 2, 0) / (n - 1)); return `${mu >= 0 ? "+" : ""}${mu.toFixed(4)} [${(mu - 1.96 * sd / Math.sqrt(n)).toFixed(4)},${(mu + 1.96 * sd / Math.sqrt(n)).toFixed(4)}] n=${n}`; };
const groups = ["ALL", "2025", "strong", "threat", "multi"];
for (const g of groups) {
  const cs = C.filter((x) => g === "ALL" || x.group === g);
  console.log(g, "combo-mix4", st(cs.map((x) => x.cand - m[x.cohort].cand)), " combo-p0f13", st(cs.map((x) => x.cand - p[x.cohort].cand)), " residual", st(cs.map((x) => x.diff - m[x.cohort].diff - p[x.cohort].diff)));
  console.log("   means: combo", st(cs.map((x) => x.diff)), " mix4", st(cs.map((x) => m[x.cohort].diff)), " p0f13", st(cs.map((x) => p[x.cohort].diff)));
}
for (const x of C.filter((x) => x.group !== "2025")) console.log(x.cohort.padEnd(28), "combo", x.diff.toFixed(3), "mix4", m[x.cohort].diff.toFixed(3), "p0f13", p[x.cohort].diff.toFixed(3));
