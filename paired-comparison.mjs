import fs from "node:fs";
import path from "node:path";

const [baselinePath, candidatePath, outputPath] = process.argv.slice(2);
if (!baselinePath || !candidatePath) {
  throw new Error("usage: node paired-comparison.mjs <baseline.json> <candidate.json> [output.json]");
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const candidate = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
const key = (run) => `${run.cohortId}\u0000${run.seed}`;
const baselineRuns = new Map(baseline.runs.map((run) => [key(run), run]));
const candidateRuns = new Map(candidate.runs.map((run) => [key(run), run]));

const missingFromCandidate = [...baselineRuns.keys()].filter((runKey) => !candidateRuns.has(runKey));
const missingFromBaseline = [...candidateRuns.keys()].filter((runKey) => !baselineRuns.has(runKey));
if (missingFromCandidate.length || missingFromBaseline.length) {
  throw new Error(`run sets differ: missing candidate=${missingFromCandidate.length}, missing baseline=${missingFromBaseline.length}`);
}

const pairs = [...baselineRuns].map(([runKey, baselineRun]) => {
  const candidateRun = candidateRuns.get(runKey);
  if (baselineRun.battles !== candidateRun.battles) {
    throw new Error(`${runKey}: battle counts differ`);
  }
  const baselineScore = baselineRun.candidate.teamPerBattle;
  const candidateScore = candidateRun.candidate.teamPerBattle;
  return {
    cohortId: baselineRun.cohortId,
    seed: baselineRun.seed,
    battles: baselineRun.battles,
    baseline: baselineScore,
    candidate: candidateScore,
    difference: candidateScore - baselineScore,
  };
});

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const differences = pairs.map((pair) => pair.difference);
const meanDifference = mean(differences);
const variance = differences.reduce((sum, value) => sum + (value - meanDifference) ** 2, 0) / (differences.length - 1);
const standardDeviation = Math.sqrt(variance);
const standardError = standardDeviation / Math.sqrt(differences.length);

// Two-sided 95% Student-t critical values.  The tested protocols have at
// least 25 paired run clusters, so the compact table is sufficient here.
const tTable = new Map([
  [20, 2.0860], [21, 2.0796], [22, 2.0739], [23, 2.0687], [24, 2.0639],
  [25, 2.0595], [26, 2.0555], [27, 2.0518], [28, 2.0484], [29, 2.0452],
  [30, 2.0423], [35, 2.0301], [39, 2.0227], [40, 2.0211], [45, 2.0141],
  [49, 2.0096], [50, 2.0086], [60, 2.0003], [80, 1.9901], [100, 1.9840],
]);
function tCritical(df) {
  if (tTable.has(df)) return tTable.get(df);
  const entries = [...tTable].sort((a, b) => a[0] - b[0]);
  if (df < entries[0][0]) throw new Error(`unsupported degrees of freedom: ${df}`);
  if (df > entries.at(-1)[0]) return 1.96;
  const upperIndex = entries.findIndex(([entryDf]) => entryDf > df);
  const [lowerDf, lowerValue] = entries[upperIndex - 1];
  const [upperDf, upperValue] = entries[upperIndex];
  return lowerValue + (upperValue - lowerValue) * (df - lowerDf) / (upperDf - lowerDf);
}

const critical = tCritical(pairs.length - 1);
const margin = critical * standardError;
const totalBattles = pairs.reduce((sum, pair) => sum + pair.battles, 0);
const weightedDifference = pairs.reduce((sum, pair) => sum + pair.difference * pair.battles, 0) / totalBattles;
const result = {
  schemaVersion: 1,
  baseline: { path: path.resolve(baselinePath), experimentId: baseline.experimentId },
  candidate: { path: path.resolve(candidatePath), experimentId: candidate.experimentId },
  pairedRuns: pairs.length,
  totalBattles,
  weightedDifference,
  clusterMeanDifference: meanDifference,
  standardDeviation,
  standardError,
  confidence95: { lower: meanDifference - margin, upper: meanDifference + margin, tCritical: critical },
  wins: differences.filter((value) => value > 0).length,
  ties: differences.filter((value) => value === 0).length,
  losses: differences.filter((value) => value < 0).length,
  pairs,
};

const json = `${JSON.stringify(result, null, 2)}\n`;
if (outputPath) {
  fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
  fs.writeFileSync(outputPath, json, "utf8");
}
process.stdout.write(json);
