import crypto from "node:crypto";
import fs from "node:fs";

const hash = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const m049 = ["build/chimera-zero-di-elision/b_pad_a", "build/chimera-zero-di-elision/a_pad_b"];
const m050 = ["build/m050-repro/ab_pad_a", "build/m050-repro/ab_pad_b"];
const expected = {
  m049: ["106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973", "7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77"],
  m050: ["0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"],
};
for (const [id, warriors] of Object.entries({ m049, m050 })) {
  if (warriors.some((file, index) => hash(file) !== expected[id][index])) throw new Error(`${id} binary hash mismatch`);
}

const config = JSON.parse(fs.readFileSync("config-final-2025-m049-m050-together-once.json", "utf8"));
config.experimentId = "requested-2025-online-field-m049-m050-20260930";
config.outputPath = "experiments/requested-2025-field-20260930/joint-m049-m050.json";
config.runDirectory = "build/official-runs/requested-2025-field-20260930/joint-m049-m050";
config.seeds = ["requested-2025-joint-20260930-v1"];
config.candidate.warriors = m050;
for (const cohort of config.cohorts) {
  if (cohort.opponents.length !== 3 || cohort.opponents[0].name !== "COD_m049") throw new Error("Unexpected joint cohort");
  cohort.opponents[0].warriors = m049;
}
if (config.cohorts.length !== 75 || config.battles !== 50) throw new Error("Unexpected suite size");
fs.writeFileSync("config-requested-2025-joint-m049-m050-20260930.json", `${JSON.stringify(config, null, 2)}\n`);
console.log(`${config.cohorts.length} four-team cohorts × ${config.battles} battles; exact candidate hashes checked`);
