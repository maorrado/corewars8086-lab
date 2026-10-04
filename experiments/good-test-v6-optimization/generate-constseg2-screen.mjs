import fs from "node:fs";
import path from "node:path";

const base = JSON.parse(fs.readFileSync("config-m050-control-all-field-holdout.json", "utf8"));
const outDir = "experiments/good-test-v6-optimization";
const absolute = (file) => path.resolve(file);
const seeds = ["good-v6-constseg2-20261002-e", "good-v6-constseg2-20261002-f"];
const arms = {
  v6_control: {
    name: "V6_control",
    warriors: [absolute("build/good-test-v6-optimization/V6_1"), "C:/Users/ronyr/Downloads/Good_Test_V6_2"],
  },
  v6_constseg2: {
    name: "V6_constseg2",
    warriors: [
      absolute("build/good-test-v6-optimization/constseg2/V6_1_constseg2"),
      absolute("build/good-test-v6-optimization/constseg2/V6_2_constseg2"),
    ],
  },
};

for (const [id, candidate] of Object.entries(arms)) {
  const experimentId = `good-test-v6-${id}-constseg2-screen-20261002`;
  const cohorts = base.cohorts.map((cohort) => ({
    ...cohort,
    opponents: cohort.opponents.map((team) => ({ ...team, warriors: team.warriors.map(absolute) })),
  }));
  const config = {
    ...structuredClone(base),
    java: absolute("tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe"),
    jar: absolute("repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar"),
    experimentId,
    outputPath: absolute(`${outDir}/${experimentId}.json`),
    runDirectory: absolute(`build/official-runs/good-test-v6-optimization/constseg2/${id}`),
    cohorts,
    zombies: base.zombies.map((zombie) => ({ ...zombie, path: absolute(zombie.path) })),
    battles: 50,
    seeds,
    candidate: { ...candidate, warriors: candidate.warriors.map(absolute) },
  };
  const configPath = absolute(`${outDir}/${experimentId}.config.json`);
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  console.log(configPath);
}
