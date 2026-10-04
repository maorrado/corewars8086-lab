import fs from "node:fs";
import path from "node:path";

const base = JSON.parse(fs.readFileSync("config-m050-control-all-field-holdout.json", "utf8"));
const outDir = "experiments/good-test-v6-optimization";
const runDir = "build/official-runs/good-test-v6-optimization";
const absolute = (file) => path.resolve(file);
const candidatePaths = {
  v6_control: {
    name: "V6_control",
    warriors: [
      absolute("build/good-test-v6-optimization/V6_1"),
      "C:/Users/ronyr/Downloads/Good_Test_V6_2",
    ],
  },
  v6_leasp: {
    name: "V6_leaSP",
    warriors: [
      absolute("build/good-test-v6-optimization/leasp/V6_1_leaSP"),
      absolute("build/good-test-v6-optimization/leasp/V6_2_leaSP"),
    ],
  },
  good_test_v4: {
    name: "Good_Test_V4",
    warriors: [
      "C:/Users/ronyr/Downloads/Good_Test_V4_1",
      "C:/Users/ronyr/Downloads/Good_Test_V4_2",
    ],
  },
  combo_zrl03: {
    name: "combo_zrl03",
    warriors: [
      absolute("build/combo-zrl03-evaluation-20261002/ComboA"),
      absolute("build/combo-zrl03-evaluation-20261002/ComboB"),
    ],
  },
};

const seeds = [
  "good-v6-screen-20261002-a",
  "good-v6-screen-20261002-b",
];

for (const [id, rawCandidate] of Object.entries(candidatePaths)) {
  const experimentId = `good-test-v6-${id}-screen2-20261002`;
  const candidate = {
    ...rawCandidate,
    warriors: rawCandidate.warriors.map(absolute),
  };
  const cohorts = base.cohorts.map((cohort) => ({
    ...cohort,
    opponents: cohort.opponents.map((team) => ({
      ...team,
      warriors: team.warriors.map(absolute),
    })),
  }));
  const config = {
    ...structuredClone(base),
    java: absolute("tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe"),
    jar: absolute("repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar"),
    experimentId,
    outputPath: absolute(`${outDir}/${experimentId}.json`),
    runDirectory: absolute(`${runDir}/screen2/${id}`),
    cohorts,
    zombies: base.zombies.map((zombie) => ({ ...zombie, path: absolute(zombie.path) })),
    battles: 50,
    seeds,
    candidate,
  };
  const configPath = absolute(`${outDir}/${experimentId}.config.json`);
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  console.log(configPath);
}
