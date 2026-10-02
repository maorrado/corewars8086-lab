import fs from "node:fs";

const base = JSON.parse(fs.readFileSync("config-m050-control-all-field-holdout.json", "utf8"));
const outputDirectory = "experiments/good-test-evaluation";
const runDirectory = "build/official-runs/good-test-evaluation";

const candidates = {
  good_test: {
    name: "COD_Good_Test",
    warriors: [
      "C:/Users/ronyr/Downloads/Good_Test1",
      "C:/Users/ronyr/Downloads/Good_Test2",
    ],
  },
  m049: {
    name: "COD_m049",
    warriors: [
      "C:/Users/ronyr/.codex/worktrees/smart-fighter/corewars8086-lab/build/final/ChimeraA",
      "C:/Users/ronyr/.codex/worktrees/smart-fighter/corewars8086-lab/build/final/ChimeraB",
    ],
  },
  m050: {
    name: "COD_m050",
    warriors: ["build/m050-repro/ab_pad_a", "build/m050-repro/ab_pad_b"],
  },
};

function writeConfig(name, config) {
  const file = `config-good-test-${name}.json`;
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  console.log(file);
}

function evaluationConfig(candidateId, phase, cohorts, seeds, battles) {
  const experimentId = `good-test-${candidateId}-${phase}`;
  return {
    ...structuredClone(base),
    experimentId,
    outputPath: `${outputDirectory}/${experimentId}.json`,
    runDirectory: `${runDirectory}/${experimentId}`,
    battles,
    threads: 4,
    seeds,
    candidate: candidates[candidateId],
    cohorts,
  };
}

const primarySeeds = [
  "good-test-primary-20260929-a",
  "good-test-primary-20260929-b",
  "good-test-primary-20260929-c",
  "good-test-primary-20260929-d",
];
for (const candidateId of Object.keys(candidates)) {
  writeConfig(
    `${candidateId}-primary`,
    evaluationConfig(candidateId, "primary", base.cohorts, primarySeeds, 100),
  );
}

// A fresh holdout changes both seeds and the three-opponent groupings.  The
// rotation is deterministic so every candidate still receives identical runs.
const opponents = base.cohorts.flatMap((cohort) => cohort.opponents);
const rotated = opponents.slice(17).concat(opponents.slice(0, 17));
const holdoutCohorts = Array.from({ length: 25 }, (_, index) => ({
  id: `good-holdout-${String(index + 1).padStart(2, "0")}`,
  opponents: rotated.slice(index * 3, index * 3 + 3),
}));
const holdoutSeeds = ["good-test-holdout-20260929-a", "good-test-holdout-20260929-b"];
for (const candidateId of Object.keys(candidates)) {
  writeConfig(
    `${candidateId}-holdout`,
    evaluationConfig(candidateId, "holdout", holdoutCohorts, holdoutSeeds, 100),
  );
}

const joint = evaluationConfig(
  "good_test",
  "joint",
  [{
    id: "good-test-joint",
    opponents: [
      candidates.m049,
      candidates.m050,
      {
        name: "OFEK_New_Best",
        warriors: [
          "C:/Users/ronyr/Downloads/New_Best1",
          "C:/Users/ronyr/Downloads/New_Best2",
        ],
      },
    ],
  }],
  [
    "good-test-joint-20260929-a",
    "good-test-joint-20260929-b",
    "good-test-joint-20260929-c",
    "good-test-joint-20260929-d",
  ],
  500,
);
writeConfig("joint", joint);
