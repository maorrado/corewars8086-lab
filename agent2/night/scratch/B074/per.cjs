// B074: per-threat base score summary from a nightT result file (read-only).
const f = process.argv[2]; const r = require(require("path").resolve(f));
const g = {};
for (const x of r.runs) { const t = x.cohort.split("#")[0]; (g[t] ??= []).push(x); }
for (const [t, xs] of Object.entries(g)) {
  const v = xs.map((x) => x.team / x.battles), w1 = xs.map((x) => x.w1 / x.battles), w2 = xs.map((x) => x.w2 / x.battles);
  const m = (a) => a.reduce((s, y) => s + y, 0) / a.length; const sd = (a) => Math.sqrt(a.reduce((s, y) => s + (y - m(a)) ** 2, 0) / (a.length - 1));
  console.log(t, "n", xs.length, "team", m(v).toFixed(4), "se", (sd(v) / Math.sqrt(v.length)).toFixed(4), "A", m(w1).toFixed(4), "B", m(w2).toFixed(4));
  console.log("  per", xs.map((x) => (x.team / x.battles).toFixed(3) + ":" + Object.keys(x.opponents).filter((k) => !k.startsWith("B074")).join("/")).join("  "));
}
