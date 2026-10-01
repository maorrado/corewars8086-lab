// Matched comparison of several screen results that share the same (cohort, seed) runs.
// Per seed: screen = mean over cohorts of the candidate's team score per battle.
// Versus each baseline: mean per-seed difference (percentage points), seeds won,
// paired t over seeds, and a run-level paired t over all (cohort, seed) pairs.
// Usage: node compare.mjs --baseline m050 [--baseline c090] name=path.json ...
import fs from "node:fs";

const baselines = [];
let byPartition = false;
let partitionOnly = false; // --partition-only: unit = partition, its seeds averaged (conservative:
                           // the seeds of one partition share its triples, so they are not independent)
const results = new Map();
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--baseline") baselines.push(argv[++i]);
  else if (argv[i] === "--by-partition") byPartition = true;
  else if (argv[i] === "--partition-only") { byPartition = true; partitionOnly = true; }
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
// The unit is the seed, or with --by-partition the (partition, seed) pair, where the
// partition is the cohort id without its trailing "-NN" (make-partition-configs.mjs ids).
const unitOf = (k) => {
  const [cohort, seed] = k.split("\u0000");
  if (partitionOnly) return cohort.replace(/-\d+$/, "");
  return byPartition ? `${cohort.replace(/-\d+$/, "")}|${seed}` : seed;
};
const seeds = [...new Set(keys.map(unitOf))].sort();
const perSeed = (name) => seeds.map((seed) => {
  const runs = keys.filter((k) => unitOf(k) === seed).map((k) => runMaps.get(name).get(k));
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
console.log(`${seeds.length} ${partitionOnly ? "partition units (seeds averaged)" : byPartition ? "(partition, seed) units" : "seeds"} x ${keys.length / seeds.length} runs each (matched)`);
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
