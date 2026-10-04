// B070: rev0 base score in existing single-threat cohorts (by key and copy count), from queue results (read-only).
import fs from "node:fs";
const D = "agent2/night/results";
const A0 = "6861894f3c1992cd6c6baa5b2a746178082f5b4b0a1d9969b9a326fe03d86c89", B0 = "8579e2c2212d72a413a6daacfe3b91ceb72be648bfc085bfeed9430eeaf6657a";
const keys = process.argv.slice(2);
const seen = new Map();
for (const f of fs.readdirSync(D)) {
  const r = JSON.parse(fs.readFileSync(`${D}/${f}`, "utf8"));
  const arms = Object.entries(r.armHashes).filter(([, w]) => w[0].sha256 === A0 && w[1].sha256 === B0).map(([k]) => k);
  for (const run of r.runs) {
    if (!arms.includes(run.arm)) continue;
    const key = run.cohort.split("#")[0].replace(/^t-/, "").replace(/-\d+$/, "");
    if (!keys.includes(key)) continue;
    const names = Object.keys(run.opponents); const copies = names.filter((n) => /_c[ABC]$/.test(n)).length || 1;
    const mix = names.some((n) => /_m[ABC]$/.test(n));
    const k = `${run.cohort}|${run.seed}|${f.includes("nz") ? "nz" : ""}`; if (f.includes("-nz")) continue;
    if (!seen.has(k)) seen.set(k, { key, copies: mix ? "mix" : copies, v: run.team / run.battles, b: run.battles });
  }
}
const g = {}; for (const x of seen.values()) (g[`${x.key} x${x.copies}`] ??= []).push(x.v);
for (const [k, a] of Object.entries(g).sort()) { const m = a.reduce((x, y) => x + y, 0) / a.length; const s = Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / Math.max(1, a.length - 1) / a.length); console.log(k.padEnd(28), "n", a.length, "base", m.toFixed(3), "se", s.toFixed(3)); }
