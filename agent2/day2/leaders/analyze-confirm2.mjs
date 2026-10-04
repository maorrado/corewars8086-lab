// Analysis exactly as preregistered in PROTOCOL-leaders.md.
import fs from "node:fs";
const ld = (id) => JSON.parse(fs.readFileSync(`agent2/results/${id}-persistent.json`, "utf8"));
const grp = (c) => c.startsWith("f2025") ? "2025" : c.startsWith("strong") ? "strong" : c.startsWith("l24") ? "2024live" : c.startsWith("nz") ? "nozombie" : c.slice(0, 2) === "L1" ? "leader1" : c.slice(0, 2) === "L2" ? "leader2" : "leader3";
const U = new Map();
for (const r of [ld("day2C2"), ld("day2C2-nz")]) for (const x of r.runs) { const k = `${x.cohort}|${x.seed}`; if (!U.has(k)) U.set(k, { c: x.cohort, g: grp(x.cohort) }); U.get(k)[x.arm] = x.team / x.battles; }
const us = [...U.values()], arms = Object.keys(us[0]).filter((k) => k !== "c" && k !== "g");
const st = (d, z) => { const n = d.length, m = d.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(d.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1)), h = z * sd / Math.sqrt(n); return { n, m, lo: m - h, hi: m + h }; };
const f = (x) => `${x.m >= 0 ? "+" : ""}${x.m.toFixed(4)} [${x.lo.toFixed(4)},${x.hi.toFixed(4)}] n=${x.n}`;
const PLAIN = ["2025", "strong", "2024live"], LEAD = ["leader1", "leader2", "leader3"];
const sel = (gs) => us.filter((u) => gs.includes(u.g));
const mean = (xs, a) => xs.reduce((s, u) => s + u[a], 0) / xs.length;
console.log("means".padEnd(10), arms.map((a) => a.padStart(9)).join(""));
for (const g of [...PLAIN, ...LEAD, "nozombie"]) console.log(g.padEnd(10), arms.map((a) => mean(sel([g]), a).toFixed(4).padStart(9)).join(""));
for (const k of ["V6", "V4", "V6Guard", "V6nohunt", "zchain4", "zchain3", "zrl03", "ah02"]) { const xs = us.filter((u) => u.c.startsWith(`L1-${k}-`)); console.log(`  L1-${k}`.padEnd(10), arms.map((a) => mean(xs, a).toFixed(3).padStart(9)).join("")); }
const out = {};
for (const a of arms.filter((x) => !["DET2", "rev1", "V6"].includes(x))) {
  const d = (gs, z) => st(sel(gs).map((u) => u[a] - u.DET2), z);
  const prim = d([...PLAIN, ...LEAD], 2.5), plain = d(PLAIN, 1.96), g25 = d(["2025"], 1.96), nz = d(["nozombie"], 1.96), lead = d(LEAD, 1.96);
  const pass = prim.lo > 0 && plain.hi >= 0 && g25.hi >= 0 && nz.hi >= 0;
  out[a] = { prim, plain, g25, nz, lead, pass };
  console.log(`\n${a} - DET2: primary(all zombie cohorts, z2.5) ${f(prim)} => ${pass ? "ACCEPT" : "reject"}`);
  console.log(`  plain ${f(plain)}  2025 ${f(g25)}  leaders ${f(lead)}  nozombie ${f(nz)}`);
}
fs.writeFileSync("agent2/day2/leaders/confirm2-analysis.json", JSON.stringify(out, null, 1) + "\n");
