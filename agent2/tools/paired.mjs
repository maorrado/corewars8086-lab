// Paired cohort-level differences between arms of one or more bench results.
// usage: node paired.mjs <result.json>[,<result2.json>] <z> armA-armB [armA-armB ...]
import fs from "node:fs";
const [files, z, ...pairs] = process.argv.slice(2);
const U = new Map();
for (const f of files.split(",")) for (const x of JSON.parse(fs.readFileSync(f, "utf8")).runs) {
  const k = `${f}|${x.cohort}|${x.seed}`; if (!U.has(k)) U.set(k, {}); U.get(k)[x.arm] = x.team / x.battles; }
const us = [...U.values()];
const arms = Object.keys(us[0]);
console.log("means: " + arms.map((a) => `${a}=${(us.reduce((s, u) => s + u[a], 0) / us.length).toFixed(4)}`).join(" ") + `  (n=${us.length} cohorts)`);
for (const p of pairs) { const [a, b] = p.split("-"); const d = us.map((u) => u[a] - u[b]); const n = d.length, m = d.reduce((s, x) => s + x, 0) / n;
  const sd = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1)), h = Number(z) * sd / Math.sqrt(n);
  console.log(`${a} - ${b}: ${m >= 0 ? "+" : ""}${m.toFixed(4)} [${(m - h).toFixed(4)}, ${(m + h).toFixed(4)}]  W/L ${d.filter((x) => x > 0).length}/${d.filter((x) => x < 0).length}`); }
