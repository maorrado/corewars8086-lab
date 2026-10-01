// Matched configs over FRESH partitions of the 75-team 2025 field into triples.
// The standard screen always uses one partition (salt "all-v1"), so a candidate tuned on it can
// overfit those 25 specific triples. Here every salt gives another full partition (each team
// exactly once per partition, in different company); cohorts of several salts are combined.
// Same team list, salted order and cohort format as generate-2025-evaluation-configs.mjs.
// Usage: node make-partition-configs.mjs <tag> <salt,salt,...> <firstSeed> <seedCount> name...
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const LAB = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "../../..");
// --seed-per-cohort: every cohort gets its own seed strings (<tag>-<cohortId>-<j>) instead of all
// cohorts sharing config.seeds. Runs that share a seed string share all 50 war seeds and group
// orders, so shared seeds make the cohorts of a batch correlated (fast-benchmark.mjs only).
const rawArgs = process.argv.slice(2);
const seedPerCohort = rawArgs.includes("--seed-per-cohort");
const [tag, saltList, firstSeedText, countText, ...names] = rawArgs.filter((a) => a !== "--seed-per-cohort");
if (!tag || !saltList || !firstSeedText || !countText || names.length === 0) {
  throw new Error("usage: make-partition-configs.mjs <tag> <salt,salt,...> <firstSeed> <seedCount> name...");
}
const divisions = [
  { prefix: "A", directory: "official-2025/survivors-online" },
  { prefix: "Y", directory: "official-2025/survivors-online-young" },
];
function readTeams({ prefix, directory }) {
  const pairs = new Map();
  for (const entry of fs.readdirSync(path.resolve(LAB, directory), { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const match = /^(.*)([12])$/.exec(entry.name);
    if (!match) continue;
    const [, base, suffix] = match;
    const warriors = pairs.get(base) ?? [];
    warriors[Number(suffix) - 1] = `${directory}/${entry.name}`;
    pairs.set(base, warriors);
  }
  return [...pairs.entries()]
    .filter(([, warriors]) => warriors.length === 2 && warriors.every(Boolean))
    .map(([base, warriors]) => ({ base, name: `${prefix}_${base}`, warriors }));
}
const allTeams = divisions.flatMap(readTeams);
if (allTeams.length !== 75) throw new Error(`expected 75 complete 2025 teams, found ${allTeams.length}`);
const stableOrder = (teams, salt) => [...teams].sort((left, right) => {
  const a = crypto.createHash("sha256").update(`${salt}:${left.name}`).digest("hex");
  const b = crypto.createHash("sha256").update(`${salt}:${right.name}`).digest("hex");
  return a.localeCompare(b);
});
const cohorts = (teams, salt) => {
  const ordered = stableOrder(teams, salt);
  const result = [];
  for (let index = 0; index < ordered.length; index += 3) {
    result.push({
      id: `${salt}-${String(index / 3 + 1).padStart(2, "0")}`,
      opponents: ordered.slice(index, index + 3).map(({ name, warriors }) => ({ name, warriors })),
    });
  }
  return result;
};

// sanity: salt all-v1 must reproduce the standard screen's cohorts exactly
const standard = JSON.parse(fs.readFileSync(path.join(LAB, "config-bigcheck-m050.json"), "utf8"));
if (JSON.stringify(cohorts(allTeams, "all-v1")) !== JSON.stringify(standard.cohorts)) {
  throw new Error("reimplementation does not reproduce the all-v1 cohorts");
}

const salts = saltList.split(",");
const seedNumbers = Array.from({ length: Number(countText) }, (_, i) => String(Number(firstSeedText) + i).padStart(3, "0"));
const allCohorts = salts.flatMap((salt) => cohorts(allTeams, salt)).map((cohort) =>
  seedPerCohort ? { ...cohort, seeds: seedNumbers.map((n) => `${tag}-${cohort.id}-${n}`) } : cohort);
const seeds = seedPerCohort ? [] : seedNumbers.map((n) => `${tag}-${n}`);
const MICRO = "candidates/generated/microopt-2026-10-01";
const known = {
  m049: ["build/final/ChimeraA", "build/final/ChimeraB"],
  m050: ["build/m050-test/ChimeraA-m050", "build/m050-test/ChimeraB-m050"],
  c090: ["candidates/generated/arena-100-2026-09-30/c090-landmine-avoidance/build/LandmineA",
         "candidates/generated/arena-100-2026-09-30/c090-landmine-avoidance/build/LandmineB"],
};
const written = [];
for (const name of names) {
  const warriors = known[name] ?? [`${MICRO}/${name}/build/${name}A`, `${MICRO}/${name}/build/${name}B`];
  for (const w of warriors) if (!fs.existsSync(path.join(LAB, w))) throw new Error(`missing binary ${w}`);
  const experimentId = `part-${tag}-${name}`;
  const config = {
    experimentId,
    outputPath: `experiments/${experimentId}.json`,
    runDirectory: `build/fast-runs/${experimentId}`,
    battles: standard.battles,
    seeds,
    candidate: { name: `Part_${name}`, warriors },
    cohorts: allCohorts,
    zombies: standard.zombies,
  };
  const file = path.join(LAB, `config-${experimentId}.json`);
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
  written.push(path.basename(file));
}
console.log(written.join(" "));
