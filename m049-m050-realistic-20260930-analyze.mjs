import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const outputDirectory = path.join(root, "experiments", "m049-m050-realistic-20260930");
const left = JSON.parse(fs.readFileSync(path.join(outputDirectory, "m049.json"), "utf8"));
const right = JSON.parse(fs.readFileSync(path.join(outputDirectory, "m050.json"), "utf8"));
const expected = {
  m049: ["106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973", "7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77"],
  m050: ["0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"],
};
if (left.engineJar.sha256 !== right.engineJar.sha256) throw new Error("Engine JAR mismatch");
if (left.runs.length !== 50 || right.runs.length !== 50) throw new Error("Expected exactly 50 paired cohorts");
const rightRuns = new Map(right.runs.map((run) => [run.runId, run]));

function rankOfCandidate(run) {
  const candidateScore = run.scores.groups.COD_same_slot;
  const otherScores = Object.entries(run.scores.groups)
    .filter(([name]) => name !== "COD_same_slot")
    .map(([, score]) => score);
  if (otherScores.length !== 3) throw new Error("Expected three opposing teams");
  return 1 + otherScores.filter((score) => score > candidateScore + 1e-8).length
    + otherScores.filter((score) => Math.abs(score - candidateScore) <= 1e-8).length / 2;
}

function firstPlaceOrTied(run) {
  const candidateScore = run.scores.groups.COD_same_slot;
  return Object.entries(run.scores.groups).every(([name, score]) =>
    name === "COD_same_slot" || candidateScore >= score - 1e-8);
}

const units = [];
for (const baseline of left.runs) {
  const candidate = rightRuns.get(baseline.runId);
  if (!candidate || baseline.seed !== candidate.seed || baseline.battles !== candidate.battles) {
    throw new Error(`Unpaired run: ${baseline.runId}`);
  }
  const keys = Object.keys(baseline.inputs).sort();
  if (JSON.stringify(keys) !== JSON.stringify(Object.keys(candidate.inputs).sort())) throw new Error("Team list changed");
  for (const key of keys) {
    for (const index of [0, 1]) {
      const hash049 = baseline.inputs[key][index].sha256;
      const hash050 = candidate.inputs[key][index].sha256;
      if (key === "COD_same_slot") {
        if (hash049 !== expected.m049[index] || hash050 !== expected.m050[index]) throw new Error(`Candidate hash mismatch: ${baseline.runId}`);
      } else if (hash049 !== hash050) throw new Error(`Opponent hash mismatch: ${baseline.runId}: ${key}`);
    }
  }
  for (let index = 0; index < baseline.zombies.length; index++) {
    if (baseline.zombies[index].sha256 !== candidate.zombies[index].sha256) throw new Error("Zombie hash mismatch");
  }
  units.push({
    cohortId: baseline.cohortId,
    seed: baseline.seed,
    battles: baseline.battles,
    m049: baseline.candidate.teamPerBattle,
    m050: candidate.candidate.teamPerBattle,
    difference: candidate.candidate.teamPerBattle - baseline.candidate.teamPerBattle,
    rank049: rankOfCandidate(baseline),
    rank050: rankOfCandidate(candidate),
    firstOrTied049: firstPlaceOrTied(baseline),
    firstOrTied050: firstPlaceOrTied(candidate),
    aDifference: candidate.candidate.warrior1PerBattle - baseline.candidate.warrior1PerBattle,
    bDifference: candidate.candidate.warrior2PerBattle - baseline.candidate.warrior2PerBattle,
  });
}
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const values = units.map((unit) => unit.difference);
const delta = mean(values);
const variance = values.reduce((sum, value) => sum + (value - delta) ** 2, 0) / (values.length - 1);
const sem = Math.sqrt(variance / values.length);
const tCritical49df = 2.009575;
const result = {
  schemaVersion: 1,
  description: "One-shot fresh 2025 senior-only four-team paired competition proxy; 62 published senior teams, 50 cohorts, 100 battles each, live 2025 zombies. Not an actual 2025 or 2026 final.",
  engineJarSha256: left.engineJar.sha256,
  candidateHashes: expected,
  battlesPerCandidate: left.aggregate.battles,
  cohortCount: units.length,
  m049ScorePerBattle: left.aggregate.teamPerBattle,
  m050ScorePerBattle: right.aggregate.teamPerBattle,
  pairedDifference: delta,
  relativeDifference: delta / left.aggregate.teamPerBattle,
  cohortClusterApproximateCi95: [delta - tCritical49df * sem, delta + tCritical49df * sem],
  cohortSigns: { m050Better: values.filter((value) => value > 1e-10).length, tied: values.filter((value) => Math.abs(value) <= 1e-10).length, m049Better: values.filter((value) => value < -1e-10).length },
  m049MeanBlockRank: mean(units.map((unit) => unit.rank049)),
  m050MeanBlockRank: mean(units.map((unit) => unit.rank050)),
  firstPlaceOrTiedBlocks: {
    m049: units.filter((unit) => unit.firstOrTied049).length,
    m050: units.filter((unit) => unit.firstOrTied050).length,
  },
  warriorDifferences: {
    A: mean(units.map((unit) => unit.aDifference)),
    B: mean(units.map((unit) => unit.bDifference)),
  },
  panelMeans: [1, 2].map((panel) => {
    const panelUnits = units.filter((unit) => unit.cohortId.startsWith(`senior-panel-${panel}-`));
    return { panel, m049: mean(panelUnits.map((unit) => unit.m049)), m050: mean(panelUnits.map((unit) => unit.m050)), difference: mean(panelUnits.map((unit) => unit.difference)) };
  }),
  units,
};
const target = path.join(outputDirectory, "comparison.json");
fs.writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ ...result, units: undefined }, null, 2));
