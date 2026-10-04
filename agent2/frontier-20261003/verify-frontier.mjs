import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const expected = JSON.parse(fs.readFileSync(path.join(here, "expected-hashes.json"), "utf8"));
const ids = Object.keys(expected).sort();
const plans = ["screen", "holdout", "nozombies", "2024live"];
const usedSalts = new Set();
const usedSeeds = new Set();

for (const id of ids) {
  for (const letter of ["A", "B"]) {
    const file = path.join(here, "arms", id, letter);
    const bytes = fs.readFileSync(file);
    const digest = crypto.createHash("sha256").update(bytes).digest("hex");
    const [size, hash] = expected[id][letter];
    if (bytes.length !== size || digest !== hash || size > 256)
      throw new Error(`${id}/${letter}: size or SHA-256 differs from frozen manifest`);
  }
}

for (const name of plans) {
  const plan = JSON.parse(fs.readFileSync(path.join(here, `frontier-v4-v6-${name}.json`), "utf8"));
  if (usedSalts.has(plan.salt)) throw new Error(`reused salt: ${plan.salt}`);
  usedSalts.add(plan.salt);
  if (plan.arms.length !== ids.length || plan.cohorts.length === 0)
    throw new Error(`${name}: missing arms or cohorts`);
  if (plan.battles !== 40) throw new Error(`${name}: unexpected battle count`);
  const seenArms = new Set();
  for (const arm of plan.arms) {
    if (!expected[arm.id] || seenArms.has(arm.id)) throw new Error(`${name}: unexpected/duplicate arm ${arm.id}`);
    seenArms.add(arm.id);
    const paths = ["A", "B"].map((letter) => `agent2/frontier-20261003/arms/${arm.id}/${letter}`);
    if (JSON.stringify(arm.warriors) !== JSON.stringify(paths))
      throw new Error(`${name}: arm ${arm.id} does not use its frozen snapshot`);
  }
  for (const cohort of plan.cohorts) {
    if (cohort.opponents.length !== 3 || cohort.seeds.length !== 1)
      throw new Error(`${name}: cohort ${cohort.id} is not a four-team paired cell`);
    if (usedSeeds.has(cohort.seeds[0])) throw new Error(`reused seed: ${cohort.seeds[0]}`);
    usedSeeds.add(cohort.seeds[0]);
  }
  if ((name === "nozombies") !== (plan.zombies.length === 0))
    throw new Error(`${name}: wrong Zombie pack`);
  console.log(`${name}: ${plan.arms.length} arms, ${plan.cohorts.length} cohorts, ${plan.cohorts.length * plan.battles} battles/arm`);
}
console.log(`Verified ${ids.length} frozen pairs, ${usedSeeds.size} distinct seeds and ${plans.length} plans.`);
