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
  "The current promotion decision is Chimera `m050`; its fresh tune/future gates,",
  "two independent all-2025 holdouts, targeted-counter check, exact binary hashes,",
  "and statistical decision are recorded in",
  "[`experiments/m050-promotion-2026-09-28.json`](experiments/m050-promotion-2026-09-28.json).",
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
  "- `x001-x012` introduced Chimera: a protected, quantized Phoenix replicator with deterministic backward `INT 87h` capture of the Zombie-B/D tail. `y001-y016`, `z001-z012`, `w001-w006`, and `v001-v010` independently varied bands, phases, replication gaps, stack motion, and Zombie-entry placement.",
  "- `w003` was selected on tuning cohorts, then scored 0.583333 on the untouched 750-battle 2025 holdout and 0.608200 over 2,500 battles against all 75 official 2025 teams. On the identical all-2025 protocol, `Registered_Winners` scored 0.538800, the old Phoenix pair 0.472800, and `TOM_ATO` 0.298800.",
  "- The `v001-v010` fine sweep used fresh seeds and initially left `w003` unchanged. A later search expanded the evidence: `k001-k037` tested new signatures and writer/motion families, `l001-l057` separated A/B motion and copy parameters, and `m001-m054` focused around the two asymmetric finalists.",
  "- High tuning results were not promoted without holdout confirmation. For example, `m014` scored 0.651771 on 1,600 tuning battles but only 0.541333 on the first 2,500-battle holdout. A second untouched 5,000-battle holdout found `l022` and `l056` statistically tied.",
  "- Hybrid `m045` combines the eight-word A first copy with the `l022` B phase/motion. It scored 0.578600 on the 5,000-battle final holdout (A 0.289200, B 0.289400), 0.637267 on the 2,500-battle all-2025 test, and 0.621771 on 1,600 fresh tuning battles.",
  "- On the exact final holdout, former champion `w003` scored 0.555067. The paired `m045-w003` improvement was +0.023533 with a 95% run-cluster t interval of [+0.000101, +0.046966]. The exact `m045` binaries were promoted at that stage.",
  "- `m046` keeps `m045` intact except for a captured-Zombie payload in survivor A. It searches backward for `F3 A5 06 1F`, replaces the leading byte with `CC`, and then joins Phoenix. More than 100 payload/signature variants were screened before this version was frozen.",
  "- Two independently shuffled all-field holdouts gave `m046-m045` improvements of +0.008722 and +0.009500 over 6,000 battles per pair in each replication. All 12 partition/seed superunits were positive; their combined 95% t interval was [+0.005431, +0.012791].",
  "- A separate official 2,500-battle all-2025 check scored 0.638867 for `m046` and 0.618933 for `m045`. The paired difference was +0.019933 with a 95% interval of [+0.002211, +0.037656]. The exact tested `m046` binaries were promoted to `final/ChimeraA.asm` and `final/ChimeraB.asm`.",
  "- `m047` gives the captured Zombie in survivor A its own private pointer cell (`0x0280`) and phase (`0x54`), while leaving the original A path and survivor B otherwise unchanged from `m046`. It stayed positive on the 1,000-battle tune validation (+0.008333) and the 640-battle synthetic future pool (+0.005986).",
  "- Three fresh 6,000-battle all-field holdouts gave `m047-m046` differences of +0.000306, +0.017375, and +0.013944. Across all 18,000 battles per pair, the combined improvement was +0.010542 (about 1.63% relative), 15 of 18 partition/seed units were positive, and the 95% interval was [+0.003332, +0.017752]. The exact tested binaries were promoted as Chimera `m047`; the compact evidence record is `experiments/m047-promotion-2026-09-26.json`.",
  "- A later coverage audit identified `rb_p34`, which changes only survivor B's initial Phoenix phase from `0x2C` to `0x34`. It improved over `m047` by +0.013167 on 1,000 tune battles and +0.007507 on a 960-battle, three-seed future pool. On untouched 6,000-battle holdout `cp3`, `m048` scored 0.660431 versus 0.647000 for `m047`: +0.013431 (about 2.08% relative), six of six partition/seed units positive, and a paired-run 95% interval of [+0.000267,+0.026594]. The exact tested binaries were promoted as Chimera `m048`; see `experiments/m048-promotion-2026-09-27.json`.",
  "- A post-`m048` micro search screened 122 one-line or one-constant mutations. B phase `0x25` gained +0.030833 on tune validation but lost -0.064747 on the future pool. The two spatial finalists also failed fresh 6,000-battle all-field holdouts: A's seven-word first copy gained only +0.000744 with a 95% interval crossing zero, and A stack gap `0x0260` lost -0.003944. No candidate was promoted; see `experiments/post-m048-micro-search-2026-09-27.json`.",
  "- `New_Best` targeted the exact m048 A initializer bytes `0E 17 BB 00` and replaced them through `INT 87h` with `FF 26 17 4A`, redirecting A during Phoenix initialization. `m049` reorders each dependency-safe `MOV BX` before `PUSH CS; POP SS`, removing that signature with unchanged size, instruction count, constants, and later register state. It tied m048 in every paired run of 1,000 tune, 960 future-pool, and 6,000 fresh all-2025 battles. In 1,600 fresh direct-counter battles it scored 0.453979 versus m048's 0.281875 and New_Best's 0.441240; all 32 paired run units favored m049 over m048. The exact binaries were promoted; see `experiments/m049-promotion-2026-09-27.json`.",
  "- A post-m049 adversarial audit checked the browser-visible `Registered_Winners` and `Code_Jokers4Life` concern in official v6. m049 beat Registered 0.527750 to 0.371917 over 6,000 controlled battles and scored 0.512292 versus Code_Jokers' 0.061875 across 1,600 targeted battles. Eight direct/shared/split signature defenses all failed broader sentinel non-regression, so none was promoted; see `experiments/post-m049-adversarial-audit-2026-09-27.json`.",
  "- The m050 search explored protected-replication layouts, aliasing, anchor hardening, decoy walls, phase and mask families, and startup/worker micro-optimizations. The promoted `zero-di-elision-ab-pad` candidate removes one redundant startup `XOR DI,DI` from each survivor; A uses `BX` for its captured-Zombie entry calculation, and skipped `CC` padding preserves the 189/117-byte layouts. It improved on fresh 1,000-battle tune and 960-battle future gates, then gained `+0.005867` and `+0.005200` on independent 5,000- and 10,000-battle all-2025 holdouts. Combined, m050 scored 0.669344 versus m049's 0.663922, a `+0.005422` gain (about 0.82% relative) with 95% interval `[+0.000109,+0.010735]`; the 500-battle targeted-counter gate tied. The exact tested binaries were promoted; see `experiments/m050-promotion-2026-09-28.json`.",
  "",
  "Pre-official smoke/debug artifacts and arena snapshots remain in `experiments/` but are intentionally excluded from the score totals above because they do not use the controlled deterministic official-v6 cohort protocol."
);

fs.writeFileSync("experiment-log.md", `${lines.join("\n")}\n`, "utf8");
console.log(JSON.stringify({ output: path.resolve("experiment-log.md"), records: records.length, totalBattles }));
