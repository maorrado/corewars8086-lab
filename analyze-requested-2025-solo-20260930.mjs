import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const expected = {
  m049: ["106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973", "7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77"],
  m050: ["0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"],
};
const results = {};
for (const version of Object.keys(expected)) {
  const configPath = `config-requested-2025-solo-${version}-matched-20260930.json`;
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const result = JSON.parse(fs.readFileSync(config.outputPath, "utf8"));
  assert.equal(result.configSha256, sha256(configPath));
  assert.equal(result.engineJar.sha256, sha256(result.engineJar.path));
  assert.equal(result.runs.length, 25);
  assert.equal(result.aggregate.battles, 1250);
  let points = 0;
  for (const [index, run] of result.runs.entries()) {
    assert.equal(run.cohortId, config.cohorts[index].id);
    assert.equal(run.seed, "requested-2025-joint-20260930-v1");
    assert.equal(run.battles, 50);
    assert.equal(Object.keys(run.inputs).length, 4);
    assert.deepEqual(run.inputs[config.candidate.name].map((input) => input.sha256), expected[version]);
    for (const inputs of Object.values(run.inputs)) {
      for (const input of inputs) assert.equal(input.sha256, sha256(input.source));
    }
    for (const zombie of run.zombies) assert.equal(zombie.sha256, sha256(zombie.source));
    points += run.scores.groups[config.candidate.name];
  }
  assert.ok(Math.abs(points / 1250 - result.aggregate.teamPerBattle) < 1e-10);
  results[version] = result;
  console.log(`${version}: ${points.toFixed(6)} points / 1250 battles = ${(points / 1250).toFixed(6)} points/battle`);
}
assert.equal(results.m049.engineJar.sha256, results.m050.engineJar.sha256);
const differences = results.m049.runs.map((before, index) => {
  const after = results.m050.runs[index];
  const otherInputs = (run) => Object.fromEntries(Object.entries(run.inputs)
    .filter(([name]) => !name.startsWith("COD_"))
    .map(([name, inputs]) => [name, inputs.map((input) => input.sha256)]));
  assert.deepEqual(otherInputs(before), otherInputs(after));
  assert.deepEqual(before.zombies.map((z) => [z.name, z.sha256]), after.zombies.map((z) => [z.name, z.sha256]));
  assert.equal(before.seed, after.seed);
  assert.equal(before.cohortId, after.cohortId);
  return (after.scores.groups.COD_m050 - before.scores.groups.COD_m049) / 50;
});
const delta = differences.reduce((sum, x) => sum + x, 0) / differences.length;
const variance = differences.reduce((sum, x) => sum + (x - delta) ** 2, 0) / (differences.length - 1);
const radius = 2.064 * Math.sqrt(variance / differences.length);
console.log(`m050 minus m049: ${delta.toFixed(6)}; relative ${(100 * delta / results.m049.aggregate.teamPerBattle).toFixed(3)}%; approximate 25-cohort CI [${(delta - radius).toFixed(6)}, ${(delta + radius).toFixed(6)}]`);
console.log("Scores are points per battle, not battle-win percentages. This is one seed on the published 2025 online-stage field.");
