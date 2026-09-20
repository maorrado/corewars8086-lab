import fs from "node:fs";
import path from "node:path";

const experimentDirectory = "experiments";
const records = [];

for (const file of fs.readdirSync(experimentDirectory).filter((name) => name.endsWith(".json")).sort()) {
  let result;
  try {
    result = JSON.parse(fs.readFileSync(path.join(experimentDirectory, file), "utf8"));
  } catch {
    continue;
  }
  if (result.schemaVersion !== 1 || !result.aggregate?.battles || !result.runs?.length) continue;

  const first = result.runs[0];
  const candidateName = Object.keys(first.inputs)[0];
  const candidateInputs = first.inputs[candidateName] ?? [];
  records.push({
    file,
    id: result.experimentId,
    battles: result.aggregate.battles,
    team: result.aggregate.teamPerBattle,
    w1: result.aggregate.warrior1PerBattle,
    w2: result.aggregate.warrior2PerBattle,
    candidateName,
    binaries: candidateInputs.map((input) => path.basename(input.source)).join(" + "),
    hashes: candidateInputs.map((input) => input.sha256.slice(0, 12)).join(" / "),
    cohorts: [...new Set(result.runs.map((run) => run.cohortId))].join(", "),
    seeds: [...new Set(result.runs.map((run) => run.seed))].join(", "),
  });
}

const totalBattles = records.reduce((sum, record) => sum + record.battles, 0);
const fmt = (value) => Number(value).toFixed(6);
const lines = [
  "# Reproducible official-engine experiment ledger",
  "",
  `Generated from ${records.length} schema-v1 result files containing ${totalBattles.toLocaleString("en-US")} measured battles.`,
  "Each linked JSON contains the exact Java command, engine/config SHA-256, complete input paths and hashes, Zombies, opponents, seeds, raw score text, team score and both per-warrior scores for every run.",
  "The table below is only the compact index; the JSON is the audit record.",
  "",
  "| Experiment | Battles | Team | Warrior 1 | Warrior 2 | Exact candidate inputs | SHA-256 prefixes | Cohorts | Seeds |",
  "|---|---:|---:|---:|---:|---|---|---|---|",
];

for (const record of records) {
  const link = `experiments/${record.file}`;
  lines.push(`| [${record.id}](${link}) | ${record.battles} | ${fmt(record.team)} | ${fmt(record.w1)} | ${fmt(record.w2)} | ${record.candidateName}: \`${record.binaries}\` | \`${record.hashes}\` | ${record.cohorts} | ${record.seeds} |`);
}

lines.push(
  "",
  "## Version lineage and decisions",
  "",
  "- `v004` was the first official-engine baseline. `v005` added Zombie theft; `v007-v012` explored AB50 relocation; `v013-v018` tested runway/NRG/worm families; `v019-v021` tested Zombie carpets/hybrids; `v022-v023` tested call cannons.",
  "- `v024` introduced the protected-stack Phoenix. `v025` added a simple stolen-Zombie payload. `v026` used two separated Phoenix bands and became the first balanced leader. `v027` changed stride. `v028` made a captured Zombie re-enter Phoenix; it lost on both train and holdout.",
  "- `p001-p014` are AB50 parameter variants. `q001-q008` vary Phoenix target bands. `r001-r006` quantize load offsets into replication-sized bands. `m001-m008` vary replication gap and stack-motion constants.",
  "- `m006` beat `v026` on both the 600-battle train check (0.493056 vs 0.469444) and the 600-battle holdout check (0.450000 vs 0.337778), so its exact binaries were promoted unchanged to `final/PhoenixA.asm` and `final/PhoenixB.asm`.",
  "- The final 4,500-battle train and 4,500-battle holdout use five new seeds. `Registered_Winners` was rerun on the exact same 4,500-battle holdout rather than compared across incompatible pools.",
  "",
  "Pre-official smoke/debug artifacts and arena snapshots remain in `experiments/` but are intentionally excluded from the score totals above because they do not use the controlled deterministic official-v6 cohort protocol."
);

fs.writeFileSync("experiment-log.md", `${lines.join("\n")}\n`, "utf8");
console.log(JSON.stringify({ output: path.resolve("experiment-log.md"), records: records.length, totalBattles }));
