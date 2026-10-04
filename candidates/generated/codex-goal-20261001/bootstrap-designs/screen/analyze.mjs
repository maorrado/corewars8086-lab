import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const resolve = file => path.resolve(here, file);
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const sha = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const equal = (a, b, message) => assert(JSON.stringify(a) === JSON.stringify(b), message);
const close = (a, b, message) => assert(Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1e-7, message);
const protocol = read(resolve("protocol.json"));
const manifest = read(resolve("input-manifest.json"));
const frozenHashes = new Map(manifest.inputs.map(x => [resolve(x.path), x.sha256]));
for (const entry of manifest.inputs) {
  const file = resolve(entry.path);
  assert(fs.statSync(file).size === entry.bytes && sha(file) === entry.sha256, "Frozen input changed: " + entry.path);
}
equal(manifest.suite, protocol.id, "Wrong suite manifest");
equal(sha(resolve("protocol.json")), manifest.protocolSha256, "Protocol hash mismatch");
const configs = Object.fromEntries(manifest.configs.map(record => {
  equal(sha(resolve(record.path)), record.sha256, "Configuration hash mismatch");
  return [record.arm, read(resolve(record.path))];
}));
assert(protocol.arms.length === 5 && protocol.cohorts === 25, "Expected five arms and 25 cohorts");
const ref = configs.c090;
for (const arm of protocol.arms) {
  const config = configs[arm];
  equal(config.cohorts, ref.cohorts, "Opponent roster mismatch");
  equal(config.zombies, ref.zombies, "Zombie roster mismatch");
  equal(config.seeds, [protocol.randomness.seed], "Seed mismatch");
  assert(config.battles === 20 && config.threads === 1 && config.parallel === false && config.telemetry === false, "Protocol settings mismatch");
  equal(config.candidate.name, "COD_pair", "Candidate-name mismatch");
  equal(config.candidate.warriors.map(file => frozenHashes.get(resolve(file))), protocol.candidateHashes[arm], "Candidate hash mismatch");
}
const h = protocol.randomness.range;
assert(h.lastWarSeed - h.firstWarSeed + 1 === 20, "Bad seed interval");
for (const old of protocol.randomness.excludedRanges) assert(h.lastWarSeed < old.firstWarSeed || old.lastWarSeed < h.firstWarSeed, "Seed range overlap");
if (process.argv.includes("--check-inputs")) {
  process.stdout.write(JSON.stringify({ status: "frozen inputs verified", arms: protocol.arms, battlesPerArm: 500, seed: protocol.randomness.seed, range: h }, null, 2) + "\n");
  process.exit(0);
}
const means = {};
const rows = {};
for (const arm of protocol.arms) {
  const config = configs[arm];
  const result = read(resolve(config.outputPath));
  equal(result.experimentId, config.experimentId, "Result ID mismatch");
  equal(result.configSha256, manifest.configs.find(x => x.arm === arm).sha256, "Result config hash mismatch");
  equal(result.engineJar.sha256, manifest.engine.sha256, "Result engine hash mismatch");
  assert(result.runs.length === 25, "Incomplete or extra runs: " + arm);
  const byCohort = new Map();
  for (const run of result.runs) {
    assert(!byCohort.has(run.cohortId), "Duplicate result cohort");
    const cohort = config.cohorts.find(x => x.id === run.cohortId);
    assert(cohort && run.seed === protocol.randomness.seed && run.battles === 20, "Unexpected cohort, seed or battle count");
    const args = run.command?.args ?? [];
    assert(args.includes("--parallel=false") || (args.includes("--parallel") && args[args.indexOf("--parallel") + 1] === "false"), "Run was not sequential");
    const teams = [config.candidate, ...cohort.opponents];
    equal(Object.keys(run.inputs).sort(), teams.map(t => t.name).sort(), "Run team set mismatch");
    for (const team of teams) equal(run.inputs[team.name].map(x => x.sha256), team.warriors.map(file => frozenHashes.get(resolve(file))), "Run warrior hashes mismatch");
    equal(run.zombies.map(z => [z.name, z.sha256]), config.zombies.map(z => [z.name, frozenHashes.get(resolve(z.path))]), "Run Zombie hashes mismatch");
    close(run.candidate.teamRaw, run.scores.groups.COD_pair, "Raw score mismatch");
    close(run.candidate.teamPerBattle, run.candidate.teamRaw / 20, "Normalized score mismatch");
    byCohort.set(run.cohortId, run.candidate.teamPerBattle);
  }
  rows[arm] = byCohort;
  means[arm] = [...byCohort.values()].reduce((a, b) => a + b, 0) / 25;
  assert(result.aggregate.battles === 500, "Wrong total battles");
  close(means[arm], result.aggregate.teamPerBattle, "Aggregate mismatch");
}
const comparisons = [];
const selectedForFreshHoldout = [];
for (const arm of ["entry_lea", "b_fallthrough", "both"]) {
  let positiveBoth = true;
  for (const reference of ["c090", "m050"]) {
    const deltas = ref.cohorts.map(c => rows[arm].get(c.id) - rows[reference].get(c.id));
    const mean = deltas.reduce((a, b) => a + b, 0) / 25;
    const sd = Math.sqrt(deltas.reduce((s, d) => s + (d - mean) ** 2, 0) / 24);
    const half = 2.0638985616280205 * sd / Math.sqrt(25);
    const positive = mean > 1e-8;
    positiveBoth &&= positive;
    comparisons.push({ arm, reference, nCohorts: 25, meanDelta: mean,
      scorePercentagePoints: 100 * mean, relativePercent: 100 * mean / means[reference],
      descriptive95CohortInterval: [mean - half, mean + half],
      wins: deltas.filter(x => x > 1e-8).length, losses: deltas.filter(x => x < -1e-8).length,
      ties: deltas.filter(x => Math.abs(x) <= 1e-8).length, positive,
      cohortDeltas: Object.fromEntries(ref.cohorts.map((c, i) => [c.id, deltas[i]])) });
  }
  if (positiveBoth) selectedForFreshHoldout.push(arm);
}
process.stdout.write(JSON.stringify({
  suite: protocol.id, battlesPerArm: 500, means, comparisons, selectedForFreshHoldout,
  decision: protocol.decision.selection, limitation: protocol.decision.boundary
}, null, 2) + "\n");

