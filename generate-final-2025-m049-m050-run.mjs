import fs from "node:fs";

const base = JSON.parse(fs.readFileSync("config-m050-zdi-control-all-field-h2.json", "utf8"));
const zombies = base.zombies;
const m049 = [
  "build/chimera-zero-di-elision/b_pad_a",
  "build/chimera-zero-di-elision/a_pad_b"
];
const m050 = ["build/final/ChimeraA", "build/final/ChimeraB"];

const soloCommon = {
  battles: 100,
  threads: 4,
  seeds: ["final-2025-solo-20260929"],
  cohorts: base.cohorts,
  zombies
};

const configs = [
  {
    experimentId: "final-2025-m049-once",
    outputPath: "experiments/m050-search/final-2025-m049-once.json",
    runDirectory: "build/official-runs/m050-search/final-2025-m049-once",
    candidate: { name: "COD_m049", warriors: m049 },
    ...soloCommon
  },
  {
    experimentId: "final-2025-m050-once",
    outputPath: "experiments/m050-search/final-2025-m050-once.json",
    runDirectory: "build/official-runs/m050-search/final-2025-m050-once",
    candidate: { name: "COD_m050", warriors: m050 },
    ...soloCommon
  }
];

const jointCohorts = [];
for (const cohort of base.cohorts) {
  const pairs = [[0, 1], [0, 2], [1, 2]];
  for (const [left, right] of pairs) {
    jointCohorts.push({
      id: `joint-${cohort.id}-${left + 1}${right + 1}`,
      opponents: [
        { name: "COD_m049", warriors: m049 },
        cohort.opponents[left],
        cohort.opponents[right]
      ]
    });
  }
}

configs.push({
  experimentId: "final-2025-m049-m050-together-once",
  outputPath: "experiments/m050-search/final-2025-m049-m050-together-once.json",
  runDirectory: "build/official-runs/m050-search/final-2025-m049-m050-together-once",
  battles: 50,
  threads: 4,
  seeds: ["final-2025-joint-20260929"],
  candidate: { name: "COD_m050", warriors: m050 },
  cohorts: jointCohorts,
  zombies
});

for (const config of configs) {
  const output = `config-${config.experimentId}.json`;
  fs.writeFileSync(output, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`${output}: ${config.cohorts.length} cohorts x ${config.battles} battles`);
}
