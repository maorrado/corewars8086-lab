import fs from "node:fs";
import crypto from "node:crypto";

const directory = "experiments/good-test-evaluation";
const read = (name) => JSON.parse(fs.readFileSync(`${directory}/${name}`, "utf8"));
const primary = {
  good: read("good-test-good_test-primary.json"),
  m049: read("good-test-m049-primary.json"),
  m050: read("good-test-m050-primary.json"),
};
const holdout = {
  good: read("good-test-good_test-holdout.json"),
  m049: read("good-test-m049-holdout.json"),
  m050: read("good-test-m050-holdout.json"),
};
const joint = read("good-test-good_test-joint.json");

const runKey = (run) => `${run.cohortId}\0${run.seed}`;
function cohortComparison(left, right) {
  const rightRuns = new Map(right.runs.map((run) => [runKey(run), run]));
  const grouped = new Map();
  for (const run of left.runs) {
    const peer = rightRuns.get(runKey(run));
    const values = grouped.get(run.cohortId) ?? [];
    values.push(run.candidate.teamPerBattle - peer.candidate.teamPerBattle);
    grouped.set(run.cohortId, values);
  }
  return [...grouped].map(([cohortId, values]) => ({
    cohortId,
    difference: values.reduce((sum, value) => sum + value, 0) / values.length,
    runs: values.length,
  })).sort((a, b) => b.difference - a.difference);
}

function jointScores() {
  const totals = new Map();
  for (const run of joint.runs) {
    for (const [name, score] of Object.entries(run.scores.groups)) {
      totals.set(name, (totals.get(name) ?? 0) + score);
    }
  }
  return [...totals].map(([name, score]) => ({
    name,
    scorePerBattle: score / joint.aggregate.battles,
  })).sort((a, b) => b.scorePerBattle - a.scorePerBattle);
}

const patterns = {
  int86: [0xcd, 0x86],
  int87: [0xcd, 0x87],
  nrg: [0x9b, 0x9b],
  repMovsw: [0xf3, 0xa5],
  callFarBx: [0xff, 0x1f],
  arenaFill: [0xcc, 0xcc],
};
function binaryFacts(path) {
  const bytes = fs.readFileSync(path);
  const offsets = {};
  for (const [name, pattern] of Object.entries(patterns)) {
    offsets[name] = [];
    for (let index = 0; index <= bytes.length - pattern.length; index += 1) {
      if (pattern.every((value, offset) => bytes[index + offset] === value)) offsets[name].push(index);
    }
  }
  return {
    path,
    bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    offsets,
  };
}

const summary = {
  generatedAt: new Date().toISOString(),
  primary: Object.fromEntries(Object.entries(primary).map(([name, result]) => [name, result.aggregate])),
  primaryGoodVsM050ByCohort: cohortComparison(primary.good, primary.m050),
  primaryGoodVsM049ByCohort: cohortComparison(primary.good, primary.m049),
  holdout: Object.fromEntries(Object.entries(holdout).map(([name, result]) => [name, result.aggregate])),
  holdoutGoodVsM050ByCohort: cohortComparison(holdout.good, holdout.m050),
  joint: jointScores(),
  binaries: [
    binaryFacts("C:/Users/ronyr/Downloads/Good_Test1"),
    binaryFacts("C:/Users/ronyr/Downloads/Good_Test2"),
  ],
};

fs.writeFileSync(`${directory}/summary.json`, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  primary: summary.primary,
  primaryBestFiveVsM050: summary.primaryGoodVsM050ByCohort.slice(0, 5),
  primaryWorstFiveVsM050: summary.primaryGoodVsM050ByCohort.slice(-5).reverse(),
  holdout: summary.holdout,
  joint: summary.joint,
  binaries: summary.binaries,
}, null, 2));
