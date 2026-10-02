import fs from "node:fs";

function writeConfig(source, id, warriors, outputDirectory = "experiments/good-test-evaluation/second-pass") {
  const config = JSON.parse(fs.readFileSync(source, "utf8"));
  config.experimentId = id;
  config.outputPath = `${outputDirectory}/${id}.json`;
  config.runDirectory = `build/official-runs/good-test-evaluation/second-pass/${id}`;
  config.candidate = { name: `COD_${id}`, warriors };
  fs.writeFileSync(`config-${id}.json`, `${JSON.stringify(config, null, 2)}\n`);
}

writeConfig(
  "config-good-test-quick-control.json",
  "good-test-hardened-quick",
  [
    "build/good-test-signature-hardening/Good_Test1_hardened",
    "build/good-test-signature-hardening/Good_Test2_hardened",
  ],
);

writeConfig(
  "config-good-test-quick-control.json",
  "good-test-compact-b-quick",
  ["C:/Users/ronyr/Downloads/Good_Test1", "C:/Users/ronyr/Downloads/New_Best2"],
);

for (const [suffix, warriors] of [
  ["control", ["C:/Users/ronyr/Downloads/Good_Test1", "C:/Users/ronyr/Downloads/Good_Test2"]],
  ["hardened", ["build/good-test-signature-hardening/Good_Test1_hardened", "build/good-test-signature-hardening/Good_Test2_hardened"]],
]) {
  const config = JSON.parse(fs.readFileSync("config-m049-v-new-best-fresh.json", "utf8"));
  const id = `good-test-newbest-${suffix}`;
  config.experimentId = id;
  config.outputPath = `experiments/good-test-evaluation/second-pass/${id}.json`;
  config.runDirectory = `build/official-runs/good-test-evaluation/second-pass/${id}`;
  config.candidate = { name: `COD_Good_Test_${suffix}`, warriors };
  config.seeds = [
    "good-test-newbest-20260929-a",
    "good-test-newbest-20260929-b",
    "good-test-newbest-20260929-c",
    "good-test-newbest-20260929-d",
  ];
  fs.writeFileSync(`config-${id}.json`, `${JSON.stringify(config, null, 2)}\n`);
}

for (const [suffix, warriors] of [
  ["control", ["C:/Users/ronyr/Downloads/Good_Test1", "C:/Users/ronyr/Downloads/Good_Test2"]],
  ["hardened", ["build/good-test-signature-hardening/Good_Test1_hardened", "build/good-test-signature-hardening/Good_Test2_hardened"]],
]) {
  const config = JSON.parse(fs.readFileSync("config-m049-v-new-best-fresh.json", "utf8"));
  const id = `good-test-signature-counter-${suffix}`;
  config.experimentId = id;
  config.outputPath = `experiments/good-test-evaluation/second-pass/${id}.json`;
  config.runDirectory = `build/official-runs/good-test-evaluation/second-pass/${id}`;
  config.candidate = { name: `COD_Good_Test_${suffix}`, warriors };
  config.seeds = [
    "good-test-signature-counter-20260929-a",
    "good-test-signature-counter-20260929-b",
    "good-test-signature-counter-20260929-c",
    "good-test-signature-counter-20260929-d",
  ];
  for (const cohort of config.cohorts) {
    const counter = cohort.opponents.find((opponent) => opponent.name === "OFEK_New_Best");
    counter.name = "LAB_Signature_Counter";
    counter.warriors = [
      "build/good-test-signature-hardening/Signature_Counter1",
      "build/good-test-signature-hardening/Signature_Counter2",
    ];
  }
  fs.writeFileSync(`config-${id}.json`, `${JSON.stringify(config, null, 2)}\n`);
}

console.log("wrote signature-hardening and compact-B second-pass configs");
