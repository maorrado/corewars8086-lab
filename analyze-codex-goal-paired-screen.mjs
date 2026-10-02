import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const [controlPath, variantPath] = process.argv.slice(2);
if (!controlPath || !variantPath) {
  throw new Error("usage: node analyze-codex-goal-paired-screen.mjs <control-result.json> <variant-result.json>");
}
const read = (file) => JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
const control = read(controlPath);
const variant = read(variantPath);
const must = (value, message) => { if (!value) throw new Error(message); };
const config = (result) => {
  const bytes = fs.readFileSync(path.resolve(result.configPath));
  must(crypto.createHash("sha256").update(bytes).digest("hex") === result.configSha256, "result config hash mismatch");
  return JSON.parse(bytes.toString("utf8"));
};
const controlConfig = config(control);
const variantConfig = config(variant);
const name = controlConfig.candidate.name;
must(name === variantConfig.candidate.name, "candidate group names differ: pairing invalid");
must(control.engineJar.sha256 === variant.engineJar.sha256, "engine JAR differs");
must(control.aggregate.battles === variant.aggregate.battles, "battle totals differ");
must(control.runs.length === variant.runs.length, "run counts differ");
must(JSON.stringify(controlConfig.cohorts) === JSON.stringify(variantConfig.cohorts), "cohorts differ");
must(JSON.stringify(controlConfig.seeds) === JSON.stringify(variantConfig.seeds), "seeds differ");
must(JSON.stringify(controlConfig.zombies) === JSON.stringify(variantConfig.zombies), "Zombies differ");
must(controlConfig.battles === variantConfig.battles, "battles per run differ");
must(controlConfig.cohorts.length === 25, "expected all 25 four-team field cohorts");
const cohortIds = controlConfig.cohorts.map((cohort) => cohort.id);
must(new Set(cohortIds).size === cohortIds.length, "duplicate configured cohort ID");
must(new Set(controlConfig.seeds).size === controlConfig.seeds.length, "duplicate configured seed");
const expectedKeys = new Set(cohortIds.flatMap((cohortId) => controlConfig.seeds.map((seed) => `${cohortId}\0${seed}`)));
const expectedBattles = expectedKeys.size * controlConfig.battles;
must(control.runs.length === expectedKeys.size && variant.runs.length === expectedKeys.size, "incomplete run set");
must(control.aggregate.battles === expectedBattles && variant.aggregate.battles === expectedBattles, "incomplete battle total");

const byKey = new Map();
const opponentSignature = (run) => Object.entries(run.inputs)
  .filter(([team]) => team !== name)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([team, files]) => [team, files.map((file) => file.sha256)]);
const zombieSignature = (run) => run.zombies.map((z) => [z.name, z.sha256]);
const pairSignature = (run) => run.inputs[name].map((file) => file.sha256);
const controlPair = pairSignature(control.runs[0]);
const variantPair = pairSignature(variant.runs[0]);
for (const run of control.runs) {
  const key = `${run.cohortId}\0${run.seed}`;
  must(expectedKeys.has(key), `unexpected control run ${key}`);
  must(!byKey.has(key), `duplicate control run ${key}`);
  must(run.inputs[name]?.length === 2, `missing control pair ${key}`);
  must(JSON.stringify(pairSignature(run)) === JSON.stringify(controlPair), `control binary changed mid-run ${key}`);
  must(run.battles === controlConfig.battles, `wrong control battle count ${key}`);
  byKey.set(key, run);
}
const differences = [];
const byCohort = new Map();
const variantKeys = new Set();
for (const run of variant.runs) {
  const key = `${run.cohortId}\0${run.seed}`;
  must(expectedKeys.has(key), `unexpected variant run ${key}`);
  must(!variantKeys.has(key), `duplicate variant run ${key}`);
  variantKeys.add(key);
  const baseline = byKey.get(key);
  must(baseline, `unmatched variant run ${key}`);
  must(run.inputs[name]?.length === 2, `missing variant pair ${key}`);
  must(JSON.stringify(pairSignature(run)) === JSON.stringify(variantPair), `variant binary changed mid-run ${key}`);
  must(run.battles === baseline.battles, `different battle count ${key}`);
  must(JSON.stringify(opponentSignature(run)) === JSON.stringify(opponentSignature(baseline)), `opponents differ ${key}`);
  must(JSON.stringify(zombieSignature(run)) === JSON.stringify(zombieSignature(baseline)), `Zombies differ ${key}`);
  const delta = run.candidate.teamPerBattle - baseline.candidate.teamPerBattle;
  differences.push(delta);
  byCohort.set(run.cohortId, [...(byCohort.get(run.cohortId) ?? []), delta]);
}
must(differences.length === byKey.size, "missing variant runs");
const cohorts = [...byCohort.values()].map((values) => values.reduce((a, b) => a + b, 0) / values.length);
const mean = cohorts.reduce((a, b) => a + b, 0) / cohorts.length;
const variance = cohorts.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (cohorts.length - 1);
must(cohorts.length === 25, "incomplete cohort set");
const t = 2.064; // t(24), approximate 95% CI
const margin = t * Math.sqrt(variance / cohorts.length);
const diffAggregate = variant.aggregate.teamPerBattle - control.aggregate.teamPerBattle;
must(Math.abs(mean - diffAggregate) < 1e-5, "cohort and aggregate differences disagree");
console.log(JSON.stringify({
  candidateName: name,
  engineSha256: control.engineJar.sha256,
  battlesPerArm: control.aggregate.battles,
  cohortCount: cohorts.length,
  control: control.aggregate.teamPerBattle,
  variant: variant.aggregate.teamPerBattle,
  delta: diffAggregate,
  ci95ApproxCohort: [mean - margin, mean + margin],
  cohortSigns: {
    positive: cohorts.filter((x) => x > 1e-7).length,
    tied: cohorts.filter((x) => Math.abs(x) <= 1e-7).length,
    negative: cohorts.filter((x) => x < -1e-7).length,
  },
  hashes: {
    control: controlPair,
    variant: variantPair,
  },
}, null, 2));
