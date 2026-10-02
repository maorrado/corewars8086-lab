import fs from "node:fs";

function writeValidation(sourcePath, id, seeds, battles) {
  const config = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  config.experimentId = id;
  config.outputPath = `experiments/good-test-evaluation/validation/${id}.json`;
  config.runDirectory = `build/official-runs/good-test-evaluation/validation/${id}`;
  config.battles = battles;
  config.seeds = seeds;
  config.candidate = {
    name: "COD_Good_Test_bmain20",
    warriors: [
      "build/good-test-phase-sweep/bmain_201",
      "build/good-test-phase-sweep/bmain_202",
    ],
  };
  fs.writeFileSync(`config-${id}.json`, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function writeControl(sourcePath, id, seeds, battles) {
  const config = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  config.experimentId = id;
  config.outputPath = `experiments/good-test-evaluation/validation/${id}.json`;
  config.runDirectory = `build/official-runs/good-test-evaluation/validation/${id}`;
  config.battles = battles;
  config.seeds = seeds;
  fs.writeFileSync(`config-${id}.json`, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

writeValidation(
  "config-good-test-good_test-primary.json",
  "good-test-bmain20-full-primary",
  [
    "good-test-primary-20260929-a",
    "good-test-primary-20260929-b",
    "good-test-primary-20260929-c",
    "good-test-primary-20260929-d",
  ],
  100,
);

writeValidation(
  "config-good-test-good_test-holdout.json",
  "good-test-bmain20-fresh-holdout",
  [
    "good-test-bmain20-holdout-20260929-a",
    "good-test-bmain20-holdout-20260929-b",
    "good-test-bmain20-holdout-20260929-c",
    "good-test-bmain20-holdout-20260929-d",
  ],
  50,
);

writeControl(
  "config-good-test-good_test-holdout.json",
  "good-test-control-fresh-holdout",
  [
    "good-test-bmain20-holdout-20260929-a",
    "good-test-bmain20-holdout-20260929-b",
    "good-test-bmain20-holdout-20260929-c",
    "good-test-bmain20-holdout-20260929-d",
  ],
  50,
);

for (const variant of ["bmain_1c", "bmain_8", "bmain_18"]) {
  const config = JSON.parse(fs.readFileSync("config-good-test-good_test-holdout.json", "utf8"));
  const id = `good-test-${variant}-fresh-holdout`;
  config.experimentId = id;
  config.outputPath = `experiments/good-test-evaluation/validation/${id}.json`;
  config.runDirectory = `build/official-runs/good-test-evaluation/validation/${id}`;
  config.battles = 50;
  config.seeds = [
    "good-test-bmain20-holdout-20260929-a",
    "good-test-bmain20-holdout-20260929-b",
    "good-test-bmain20-holdout-20260929-c",
    "good-test-bmain20-holdout-20260929-d",
  ];
  config.candidate = {
    name: `COD_Good_Test_${variant}`,
    warriors: [
      `build/good-test-phase-sweep/${variant}1`,
      `build/good-test-phase-sweep/${variant}2`,
    ],
  };
  fs.writeFileSync(`config-${id}.json`, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

console.log("wrote full-primary and paired fresh-holdout validation configs, including three alternatives");
