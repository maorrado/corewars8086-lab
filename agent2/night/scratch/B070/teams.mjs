// B070: per-team mean score per battle in a threat job's base and cand plans (read-only).
import fs from "node:fs";
const id = process.argv[2];
const j = JSON.parse(fs.readFileSync(`agent2/night/queue/done/${id}.json`, "utf8"));
const res = j.result ?? j; const key = res.specKey;
for (const f of fs.readdirSync("agent2/night/results").filter((f) => f.startsWith(`nightT-${key}-`))) {
  const r = JSON.parse(fs.readFileSync(`agent2/night/results/${f}`, "utf8"));
  const t = {}; let us = [], n = 0;
  for (const run of r.runs) { us.push(run.team / run.battles); n++; for (const [k, v] of Object.entries(run.opponents)) (t[k.replace(/_m[ABC]$/, "")] ??= []).push(v / run.battles); }
  const m = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const sd = (a) => { const mm = m(a); return Math.sqrt(a.reduce((x, y) => x + (y - mm) ** 2, 0) / (a.length - 1) / a.length); };
  console.log(f.replace(`nightT-${key}-`, ""), "cohorts", n, "us", m(us).toFixed(3), "se", sd(us).toFixed(3), Object.entries(t).filter(([, a]) => a.length >= 6).map(([k, a]) => `${k} ${m(a).toFixed(3)} (n${a.length})`).join(", "));
}
