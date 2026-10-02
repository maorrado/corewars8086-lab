import crypto from "node:crypto";
import fs from "node:fs";

const expected = {
  "build/chimera-zero-di-elision/b_pad_a": "106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973",
  "build/chimera-zero-di-elision/a_pad_b": "7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77",
  "build/final/ChimeraA": "0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44",
  "build/final/ChimeraB": "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782",
};
for (const [file, hash] of Object.entries(expected)) {
  const actual = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  if (actual !== hash) throw new Error(`${file}: unexpected SHA-256 ${actual}`);
}

const configs = ["m049", "m050"].map((version) => {
  const source = JSON.parse(fs.readFileSync(`config-final-2025-${version}-once.json`, "utf8"));
  source.experimentId = `requested-2025-solo-${version}-matched-20260930`;
  source.outputPath = `experiments/requested-2025-field-20260930/solo-${version}-matched.json`;
  source.runDirectory = `build/official-runs/requested-2025-field-20260930/solo-${version}-matched`;
  source.battles = 50;
  source.threads = 4;
  source.seeds = ["requested-2025-joint-20260930-v1"];
  return source;
});
if (JSON.stringify(configs[0].cohorts) !== JSON.stringify(configs[1].cohorts) ||
    JSON.stringify(configs[0].zombies) !== JSON.stringify(configs[1].zombies)) {
  throw new Error("Solo fields differ");
}
const joint = JSON.parse(fs.readFileSync("config-requested-2025-joint-m049-m050-20260930.json", "utf8"));
if (configs[0].cohorts.length !== 25 || joint.cohorts.length !== 75) {
  throw new Error("Unexpected solo/joint cohort counts");
}
for (let index = 0; index < configs[0].cohorts.length; index++) {
  const solo = configs[0].cohorts[index];
  const expectedPairs = [[0, 1], [0, 2], [1, 2]];
  for (let pairIndex = 0; pairIndex < 3; pairIndex++) {
    const observed = joint.cohorts[index * 3 + pairIndex];
    const published = observed.opponents.filter((team) => !team.name.startsWith("COD_"));
    const expected = expectedPairs[pairIndex].map((position) => solo.opponents[position]);
    if (JSON.stringify(published) !== JSON.stringify(expected)) {
      throw new Error(`Solo/joint field differs at ${solo.id}, pair ${pairIndex}`);
    }
  }
}
if (JSON.stringify(configs[0].zombies) !== JSON.stringify(joint.zombies)) {
  throw new Error("Solo and joint Zombie sets differ");
}
for (const config of configs) {
  const file = `config-${config.experimentId}.json`;
  if (fs.existsSync(file) || fs.existsSync(config.outputPath)) {
    throw new Error(`${file} or result already exists; refusing to overwrite`);
  }
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`${file}: ${config.cohorts.length} cohorts x ${config.battles} battles`);
}
