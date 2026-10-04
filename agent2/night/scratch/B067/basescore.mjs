// B067: per-threat base (rev0) score and per-team scores from a threat job's base results file.
import fs from "node:fs";
const id = process.argv[2]; const j = JSON.parse(fs.readFileSync(`agent2/night/queue/done/${id}.json`, "utf8"));
const key = j.result.specKey; const res = JSON.parse(fs.readFileSync(`agent2/night/results/nightT-${key}-base-rev0.json`, "utf8"));
const by = {};
for (const r of res.runs.filter(r => r.arm === "base")) { const t = r.cohort.split("#")[0]; (by[t] ??= []).push(r); }
for (const [t, rs] of Object.entries(by)) {
  const v = rs.map(r => r.team / r.battles); const m = v.reduce((a, x) => a + x, 0) / v.length;
  const sd = Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / Math.max(1, v.length - 1));
  console.log(`${t.padEnd(12)} base ${m.toFixed(4)} (se ${(sd / Math.sqrt(v.length)).toFixed(4)}) per cohort [${v.map(x => x.toFixed(3)).join(" ")}]`);
  for (const r of rs) console.log("     ", r.cohort, JSON.stringify(Object.fromEntries(Object.entries(r.opponents).map(([k, x]) => [k, +(x / r.battles).toFixed(3)]))));
}
