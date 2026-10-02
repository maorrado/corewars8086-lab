import fs from "node:fs";
import path from "node:path";

const outputDirectory = path.join(import.meta.dirname, "experiments", "m049-m050-realistic-20260930");
const read = (name) => JSON.parse(fs.readFileSync(path.join(outputDirectory, `${name}.json`), "utf8"));
const expected = {
  m049: ["106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973", "7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77"],
  m050: ["0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"],
  xorb: ["0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44", "fb66036e0b20a8df162da32e453cc148b5ff5ea0d1494439f3c417be0a57d994"],
};
const pairSets = ["", "-seed2"].map((suffix, index) => ({
  label: `seed${index + 1}`,
  m049: read(`m049${suffix}`),
  m050: read(`m050${suffix}`),
  xorb: read(`xorb${suffix}`),
}));
const jarHash = pairSets[0].m050.engineJar.sha256;
const byCohort = new Map();
const opponentFingerprints = new Map();

for (const set of pairSets) {
  if ([set.m049, set.m050, set.xorb].some((result) => result.engineJar.sha256 !== jarHash || result.runs.length !== 50)) {
    throw new Error("Engine mismatch or incorrect cohort count");
  }
  const m050Runs = new Map(set.m050.runs.map((run) => [run.cohortId, run]));
  const xorRuns = new Map(set.xorb.runs.map((run) => [run.cohortId, run]));
  for (const old of set.m049.runs) {
    const control = m050Runs.get(old.cohortId);
    const candidate = xorRuns.get(old.cohortId);
    if (!control || !candidate || old.seed !== control.seed || old.seed !== candidate.seed
      || old.battles !== 100 || control.battles !== 100 || candidate.battles !== 100) {
      throw new Error(`Unpaired cohort ${old.cohortId}`);
    }
    const runs = { m049: old, m050: control, xorb: candidate };
    const names = Object.keys(old.inputs).sort();
    const fingerprint = [];
    for (const [id, run] of Object.entries(runs)) {
      if (JSON.stringify(Object.keys(run.inputs).sort()) !== JSON.stringify(names)) throw new Error("Team list mismatch");
      for (const [index, hash] of expected[id].entries()) {
        if (run.inputs.COD_same_slot[index].sha256 !== hash) throw new Error(`${id} candidate hash mismatch`);
      }
      for (const name of names.filter((name) => name !== "COD_same_slot")) {
        for (const warrior of run.inputs[name]) fingerprint.push(`${id}:${name}:${warrior.sha256}`);
      }
      for (const zombie of run.zombies) fingerprint.push(`${id}:zombie:${zombie.name}:${zombie.sha256}`);
    }
    const reference = fingerprint.filter((value) => value.startsWith("m049:")).map((value) => value.slice(5));
    for (const id of ["m050", "xorb"]) {
      const compared = fingerprint.filter((value) => value.startsWith(`${id}:`)).map((value) => value.slice(id.length + 1));
      if (JSON.stringify(compared) !== JSON.stringify(reference)) throw new Error("Opponent or Zombie hash mismatch");
    }
    const immutableFingerprint = JSON.stringify(reference);
    if (opponentFingerprints.has(old.cohortId) && opponentFingerprints.get(old.cohortId) !== immutableFingerprint) {
      throw new Error("Cohort changed between seeds");
    }
    opponentFingerprints.set(old.cohortId, immutableFingerprint);
    const unit = {
      cohortId: old.cohortId,
      seed: old.seed,
      m049: old.candidate.teamPerBattle,
      m050: control.candidate.teamPerBattle,
      xorb: candidate.candidate.teamPerBattle,
      differenceVsM050: candidate.candidate.teamPerBattle - control.candidate.teamPerBattle,
      differenceVsM049: candidate.candidate.teamPerBattle - old.candidate.teamPerBattle,
    };
    if (!byCohort.has(old.cohortId)) byCohort.set(old.cohortId, []);
    byCohort.get(old.cohortId).push(unit);
  }
}
if (byCohort.size !== 50 || [...byCohort.values()].some((units) => units.length !== 2 || units[0].seed === units[1].seed)) {
  throw new Error("Expected two distinct seed results per 50 cohorts");
}

function cluster(values) {
  const n = values.length;
  const mean = values.reduce((sum, value) => sum + value, 0) / n;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1);
  const radius = 2.009575 * Math.sqrt(variance / n);
  return {
    blocks: n,
    mean,
    approximateCi95: [mean - radius, mean + radius],
    positive: values.filter((value) => value > 1e-10).length,
    tied: values.filter((value) => Math.abs(value) <= 1e-10).length,
    negative: values.filter((value) => value < -1e-10).length,
  };
}

function blockRank(run) {
  const score = run.scores.groups.COD_same_slot;
  const others = Object.entries(run.scores.groups).filter(([name]) => name !== "COD_same_slot").map(([, value]) => value);
  if (others.length !== 3) throw new Error("Expected four teams per block");
  return {
    midrank: 1 + others.filter((value) => value > score + 1e-8).length
      + others.filter((value) => Math.abs(value - score) <= 1e-8).length / 2,
    firstOrTied: others.every((value) => score >= value - 1e-8),
  };
}

function rankSummary(result) {
  const ranks = result.runs.map(blockRank);
  return {
    meanBlockRank: ranks.reduce((sum, item) => sum + item.midrank, 0) / ranks.length,
    firstOrTiedBlocks: ranks.filter((item) => item.firstOrTied).length,
  };
}

const seedResults = pairSets.map((set, index) => {
  const rows = [...byCohort.values()].map((units) => units[index]);
  return {
    seed: rows[0].seed,
    battlesPerCandidate: 5000,
    scores: Object.fromEntries(["m049", "m050", "xorb"].map((id) => [id, set[id].aggregate.teamPerBattle])),
    blockRanks: Object.fromEntries(["m049", "m050", "xorb"].map((id) => [id, rankSummary(set[id])])),
    xorbVsM050: cluster(rows.map((unit) => unit.differenceVsM050)),
    xorbVsM049: cluster(rows.map((unit) => unit.differenceVsM049)),
  };
});
const cohortMeans = [...byCohort.entries()].map(([cohortId, units]) => ({
  cohortId,
  differenceVsM050: (units[0].differenceVsM050 + units[1].differenceVsM050) / 2,
  differenceVsM049: (units[0].differenceVsM049 + units[1].differenceVsM049) / 2,
}));
const combined = {
  battlesPerCandidate: 10000,
  scores: Object.fromEntries(["m049", "m050", "xorb"].map((id) => [id, (seedResults[0].scores[id] + seedResults[1].scores[id]) / 2])),
  blockRanks: Object.fromEntries(["m049", "m050", "xorb"].map((id) => [id, {
    meanBlockRank: (seedResults[0].blockRanks[id].meanBlockRank + seedResults[1].blockRanks[id].meanBlockRank) / 2,
    firstOrTiedBlocks: seedResults[0].blockRanks[id].firstOrTiedBlocks + seedResults[1].blockRanks[id].firstOrTiedBlocks,
  }])),
  xorbVsM050: cluster(cohortMeans.map((unit) => unit.differenceVsM050)),
  xorbVsM049: cluster(cohortMeans.map((unit) => unit.differenceVsM049)),
};
const output = {
  schemaVersion: 1,
  description: "XOR-B versus m049/m050 on exactly the same 50 2025 senior-only four-team cohorts and two fresh seeds. Approximate CI clusters 50 cohort means, not 100 seed-runs. Conditional on this archived online field and 2025 Zombies, not actual 2026 final.",
  engineJarSha256: jarHash,
  candidateHashes: expected,
  seedResults,
  combined,
  cohortMeans,
};
fs.writeFileSync(path.join(outputDirectory, "comparison-with-xorb.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ ...output, cohortMeans: undefined }, null, 2));
