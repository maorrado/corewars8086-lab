import fs from "node:fs";

const expected = {
  COD_m049: ["106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973", "7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77"],
  COD_m050: ["0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"],
  CLAUDE_smart_fixed_toggle: ["bea990bbf2c60cb4c39d80dd5b533f83a1eb62f1ad202020c6d4e93cbebc2747", "9761054288100948cfcf3610c8d989f16eba68f0f501b90c21b7de9ead380c8f"],
};
const scenarios = [
  ["m049+m050", "experiments/requested-2025-field-20260930/joint-m049-m050.json", ["COD_m049", "COD_m050"]],
  ["m049+m050+Claude", "experiments/m050-search/requested-final-2025-m049-m050-claude-together-once-20260930.json", ["COD_m049", "COD_m050", "CLAUDE_smart_fixed_toggle"]],
];
let firstEngine;
for (const [label, file, namedTeams] of scenarios) {
  if (!fs.existsSync(file)) {
    console.log(`${label}: pending`);
    continue;
  }
  const result = JSON.parse(fs.readFileSync(file, "utf8"));
  if (result.runs.length !== 75 || result.aggregate.battles !== 3750) throw new Error(`${label}: unexpected suite size`);
  if (firstEngine && result.engineJar.sha256 !== firstEngine) throw new Error(`${label}: engine mismatch`);
  firstEngine = result.engineJar.sha256;
  const raw = Object.fromEntries(namedTeams.map((name) => [name, 0]));
  const firstOrTied = Object.fromEntries(namedTeams.map((name) => [name, 0]));
  const headToHead = [];
  for (const run of result.runs) {
    if (run.battles !== 50 || run.seed !== "requested-2025-joint-20260930-v1") throw new Error(`${label}: seed/battle mismatch`);
    if (Object.keys(run.scores.groups).length !== 4) throw new Error(`${label}: expected four teams`);
    for (const name of namedTeams) {
      if (!run.inputs[name] || run.inputs[name].some((warrior, index) => warrior.sha256 !== expected[name][index])) {
        throw new Error(`${label}: ${name} binary hash mismatch`);
      }
      raw[name] += run.scores.groups[name];
      const otherScores = Object.entries(run.scores.groups).filter(([other]) => other !== name).map(([, score]) => score);
      if (otherScores.every((score) => run.scores.groups[name] >= score - 1e-8)) firstOrTied[name]++;
    }
    headToHead.push((run.scores.groups.COD_m050 - run.scores.groups.COD_m049) / 50);
  }
  const diff = headToHead.reduce((sum, value) => sum + value, 0) / headToHead.length;
  const sd = Math.sqrt(headToHead.reduce((sum, value) => sum + (value - diff) ** 2, 0) / (headToHead.length - 1));
  const radius = 1.993 * sd / Math.sqrt(headToHead.length);
  console.log(`${label}: 75 cohorts × 50 = 3750 battles, one seed`);
  for (const name of namedTeams) console.log(`  ${name}: ${(raw[name] / 3750).toFixed(6)} score/battle, first-or-tied in ${firstOrTied[name]}/75 cohort aggregates`);
  console.log(`  m050-minus-m049: ${diff.toFixed(6)}, approximate cohort CI [${(diff - radius).toFixed(6)}, ${(diff + radius).toFixed(6)}]`);
}
