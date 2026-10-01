// Writes matched-seed screen configs (lab root, config-micro-<tag>-<name>.json) for the
// micro-optimization candidates AND the baselines, all on the same seeds, so every
// comparison is matched. Cohorts/zombies/battles are copied from config-bigcheck-m050.json
// (the all-2025 real field: 25 cohorts x 50 battles per seed).
// Usage: node candidates/generated/microopt-2026-10-01/make-configs.mjs <tag> <firstSeed> <count> name...
import fs from "node:fs";
import path from "node:path";

const LAB = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "../../..");
const [tag, firstSeedText, countText, ...names] = process.argv.slice(2);
if (!tag || !firstSeedText || !countText || names.length === 0) {
  throw new Error("usage: make-configs.mjs <tag> <firstSeed> <count> name...");
}
const template = JSON.parse(fs.readFileSync(path.join(LAB, "config-bigcheck-m050.json"), "utf8"));
const firstSeed = Number(firstSeedText);
const count = Number(countText);
const seeds = Array.from({ length: count }, (_, i) => `${tag}-${String(firstSeed + i).padStart(3, "0")}`);

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
  const experimentId = `micro-${tag}-${name}`;
  const config = {
    experimentId,
    outputPath: `experiments/${experimentId}.json`,
    runDirectory: `build/fast-runs/${experimentId}`,
    battles: template.battles,
    seeds,
    candidate: { name: `Micro_${name}`, warriors },
    cohorts: template.cohorts,
    zombies: template.zombies,
  };
  const file = path.join(LAB, `config-${experimentId}.json`);
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
  written.push(path.basename(file));
}
console.log(written.join(" "));
