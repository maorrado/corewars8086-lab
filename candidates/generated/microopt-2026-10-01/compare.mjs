// Matched comparison of several screen results that share the same (cohort, seed) runs.
// Per seed: screen = mean over cohorts of the candidate's team score per battle.
// Versus each baseline: mean per-seed difference (percentage points), seeds won,
// paired t over seeds, and a run-level paired t over all (cohort, seed) pairs.
// Usage: node compare.mjs --baseline m050 [--baseline c090] name=path.json ...
import fs from "node:fs";

const baselines = [];
const results = new Map();
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--baseline") baselines.push(argv[++i]);
  else {
    const [name, file] = argv[i].split("=");
    results.set(name, JSON.parse(fs.readFileSync(file, "utf8")));
  }
}
const key = (run) => `${run.cohortId}\u0000${run.seed}`;
const runMaps = new Map([...results].map(([name, r]) => [name, new Map(r.runs.map((run) => [key(run), run]))]));
const keys = [...runMaps.values().next().value.keys()].sort();
for (const [name, map] of runMaps) {
  if (map.size !== keys.length || keys.some((k) => !map.has(k))) throw new Error(`${name}: run set differs from the others`);
}
const seeds = [...new Set(keys.map((k) => k.split("\u0000")[1]))].sort();
const perSeed = (name) => seeds.map((seed) => {
  const runs = keys.filter((k) => k.endsWith(`\u0000${seed}`)).map((k) => runMaps.get(name).get(k));
  return runs.reduce((s, r) => s + r.candidate.teamPerBattle, 0) / runs.length;
});
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const tStat = (ds) => {
  const m = mean(ds);
  const sd = Math.sqrt(ds.reduce((s, d) => s + (d - m) ** 2, 0) / (ds.length - 1));
  return sd === 0 ? (m === 0 ? 0 : Infinity) : m / (sd / Math.sqrt(ds.length));
};

const seedScores = new Map([...results.keys()].map((name) => [name, perSeed(name)]));
const rows = [...results.keys()].map((name) => ({ name, screen: mean(seedScores.get(name)) }))
  .sort((a, b) => b.screen - a.screen);
console.log(`${seeds.length} seeds x ${keys.length / seeds.length} cohorts (matched)`);
const header = ["warrior", "screen", ...baselines.flatMap((b) => [`vs ${b} (pp)`, "seeds won", "t(seeds)", "t(runs)"])];
console.log(header.join(" | "));
for (const row of rows) {
  const cells = [row.name, row.screen.toFixed(5)];
  for (const b of baselines) {
    if (b === row.name) { cells.push("--", "--", "--", "--"); continue; }
    const ds = seedScores.get(row.name).map((v, i) => v - seedScores.get(b)[i]);
    const runDs = keys.map((k) => runMaps.get(row.name).get(k).candidate.teamPerBattle - runMaps.get(b).get(k).candidate.teamPerBattle);
    cells.push((100 * mean(ds)).toFixed(2), `${ds.filter((d) => d > 0).length}/${ds.length}`, tStat(ds).toFixed(2), tStat(runDs).toFixed(2));
  }
  console.log(cells.join(" | "));
}
