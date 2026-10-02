import fs from "node:fs";

const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const key = (run) => `${run.cohortId}\0${run.seed}`;

function compare(candidate, control) {
  const controls = new Map(control.runs.map((run) => [key(run), run.candidate.teamPerBattle]));
  const differences = candidate.runs.map((run) => run.candidate.teamPerBattle - controls.get(key(run)));
  const mean = differences.reduce((sum, value) => sum + value, 0) / differences.length;
  const variance = differences.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (differences.length - 1);
  const standardError = Math.sqrt(variance / differences.length);
  // 95% two-sided Student-t critical values for the run counts used here.
  const tCritical = differences.length >= 80 ? 1.984 : differences.length >= 40 ? 2.010 : 2.064;
  return {
    candidateScore: candidate.aggregate.teamPerBattle,
    controlScore: control.aggregate.teamPerBattle,
    meanDifference: mean,
    relativeImprovement: mean / control.aggregate.teamPerBattle,
    ci95: [mean - tCritical * standardError, mean + tCritical * standardError],
    positiveRuns: differences.filter((value) => value > 0).length,
    tiedRuns: differences.filter((value) => value === 0).length,
    negativeRuns: differences.filter((value) => value < 0).length,
    runCount: differences.length,
  };
}

const primaryCandidate = read("experiments/good-test-evaluation/validation/good-test-bmain20-full-primary.json");
const primaryControl = read("experiments/good-test-evaluation/good-test-good_test-primary.json");
const result = { primary: compare(primaryCandidate, primaryControl) };

const holdoutCandidatePath = "experiments/good-test-evaluation/validation/good-test-bmain20-fresh-holdout.json";
const holdoutControlPath = "experiments/good-test-evaluation/validation/good-test-control-fresh-holdout.json";
if (fs.existsSync(holdoutCandidatePath) && fs.existsSync(holdoutControlPath)) {
  result.holdout = compare(read(holdoutCandidatePath), read(holdoutControlPath));
}

fs.writeFileSync("experiments/good-test-evaluation/validation/comparison.json", `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
