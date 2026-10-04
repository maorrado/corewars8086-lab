// Per-group / per-leader mean team score per arm on field L, plus each arm's opponent leader scores.
// usage: node groups.mjs <result.json> [armA armB]  (with two arms: paired diff by group)
import fs from "node:fs";
const L = JSON.parse(fs.readFileSync("agent2/day2/leaders/L.json", "utf8"));
const res = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const meta = Object.fromEntries(L.cohorts.map((c) => [c.id, c]));
const key = (c) => { const m = meta[c]; return m.group === "leader1" ? `L1-${m.leader}` : m.group; };
const by = {};
for (const run of res.runs) { const k = key(run.cohort); ((by[k] ??= {})[run.arm] ??= []).push(run.team / run.battles); }
const arms = [...new Set(res.runs.map((r) => r.arm))];
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const [A, B] = process.argv.slice(3);
console.log("group".padEnd(14), arms.map((a) => a.padStart(9)).join(""), A ? `   ${A}-${B}` : "");
for (const k of Object.keys(by).sort()) console.log(k.padEnd(14), arms.map((a) => mean(by[k][a]).toFixed(3).padStart(9)).join(""), A ? `   ${(mean(by[k][A]) - mean(by[k][B])).toFixed(3)}` : "");
const all = (a) => mean(res.runs.filter((r) => r.arm === a).map((r) => r.team / r.battles));
console.log("ALL".padEnd(14), arms.map((a) => all(a).toFixed(3).padStart(9)).join(""));
