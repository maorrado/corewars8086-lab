import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "experiments", "m049-m050-realistic-20260930");
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, `${name}.json`), "utf8"));
const expected = {
  m049: ["106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973", "7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77"],
  m050: ["0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"],
};
const pairs = [
  { label: "seed1", old: read("m049"), next: read("m050") },
  { label: "seed2", old: read("m049-seed2"), next: read("m050-seed2") },
];
const jarHash = pairs[0].old.engineJar.sha256;
const groups = new Map();
const opponentFingerprints = new Map();

for (const pair of pairs) {
  if (pair.old.engineJar.sha256 !== jarHash || pair.next.engineJar.sha256 !== jarHash) throw new Error("Engine mismatch");
  if (pair.old.runs.length !== 50 || pair.next.runs.length !== 50) throw new Error("Expected 50 cohorts per seed");
  const candidates = new Map(pair.next.runs.map((run) => [run.cohortId, run]));
  for (const old of pair.old.runs) {
    const next = candidates.get(old.cohortId);
    if (!next || old.seed !== next.seed || old.battles !== 100 || next.battles !== 100) throw new Error(`Unpaired run ${old.cohortId}`);
    const teams = Object.keys(old.inputs).sort();
    if (JSON.stringify(teams) !== JSON.stringify(Object.keys(next.inputs).sort())) throw new Error("Team names changed");
    const opponentInput = [];
    for (const team of teams) {
      for (const index of [0, 1]) {
        const leftHash = old.inputs[team][index].sha256;
        const rightHash = next.inputs[team][index].sha256;
        if (team === "COD_same_slot") {
          if (leftHash !== expected.m049[index] || rightHash !== expected.m050[index]) throw new Error("Candidate binary hash mismatch");
        } else {
          if (leftHash !== rightHash) throw new Error("Opponent binary hash mismatch");
          opponentInput.push([team, leftHash]);
        }
      }
    }
    const zombieHash = old.zombies.map((zombie, index) => {
      if (zombie.sha256 !== next.zombies[index].sha256) throw new Error("Zombie hash mismatch");
      return zombie.sha256;
    });
    const fingerprint = JSON.stringify({ opponentInput, zombieHash });
    if (opponentFingerprints.has(old.cohortId) && opponentFingerprints.get(old.cohortId) !== fingerprint) throw new Error("Cohort changed across seeds");
    opponentFingerprints.set(old.cohortId, fingerprint);
    if (!groups.has(old.cohortId)) groups.set(old.cohortId, []);
    groups.get(old.cohortId).push({
      seed: old.seed,
      label: pair.label,
      oldScore: old.candidate.teamPerBattle,
      nextScore: next.candidate.teamPerBattle,
      difference: next.candidate.teamPerBattle - old.candidate.teamPerBattle,
    });
  }
}
if (groups.size !== 50 || [...groups.values()].some((records) => records.length !== 2 || records[0].seed === records[1].seed)) {
  throw new Error("Expected two independent seeds for exactly 50 cohorts");
}

function summarize(values) {
  const n = values.length;
  const mean = values.reduce((sum, value) => sum + value, 0) / n;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1);
  const radius = 2.009575 * Math.sqrt(variance / n); // two-sided t(49), approximate
  return {
    blocks: n,
    difference: mean,
    approximateCi95: [mean - radius, mean + radius],
    positive: values.filter((value) => value > 1e-10).length,
    tied: values.filter((value) => Math.abs(value) <= 1e-10).length,
    negative: values.filter((value) => value < -1e-10).length,
  };
}
const results = Object.fromEntries(pairs.map((pair) => {
  const values = [...groups.values()].map((records) => records.find((record) => record.label === pair.label).difference);
  return [pair.label, {
    battlesPerCandidate: pair.old.aggregate.battles,
    m049ScorePerBattle: pair.old.aggregate.teamPerBattle,
    m050ScorePerBattle: pair.next.aggregate.teamPerBattle,
    ...summarize(values),
  }];
}));
const cohortMeans = [...groups.entries()].map(([cohortId, records]) => ({
  cohortId,
  difference: (records[0].difference + records[1].difference) / 2,
  seed1: records[0].difference,
  seed2: records[1].difference,
}));
results.combined = {
  battlesPerCandidate: 10_000,
  m049ScorePerBattle: (results.seed1.m049ScorePerBattle + results.seed2.m049ScorePerBattle) / 2,
  m050ScorePerBattle: (results.seed1.m050ScorePerBattle + results.seed2.m050ScorePerBattle) / 2,
  ...summarize(cohortMeans.map((unit) => unit.difference)),
};
const output = {
  schemaVersion: 1,
  description: "Two fresh independent seeds on the same 50 preselected senior-only four-team cohorts; combined CI clusters by cohort (n=50), not by seed-run (n=100). Approximate CI does not account for unknown 2026 opponent distribution.",
  engineJarSha256: jarHash,
  candidateHashes: expected,
  results,
  cohortMeans,
};
fs.writeFileSync(path.join(root, "comparison-two-seeds.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ ...output, cohortMeans: undefined }, null, 2));
