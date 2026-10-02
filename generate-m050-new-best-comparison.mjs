import fs from "node:fs";

const source = JSON.parse(fs.readFileSync("config-m050-m049-control-screen.json", "utf8"));
const selected = [0, 2, 5, 7, 10, 12, 16, 19].map((index) => source.cohorts[index]);
const newBest = {
  name: "OFEK_New_Best",
  warriors: [
    "C:/Users/ronyr/Downloads/New_Best1",
    "C:/Users/ronyr/Downloads/New_Best2"
  ]
};

const common = {
  battles: 50,
  threads: 4,
  seeds: [
    "m050-newbest-901",
    "m050-newbest-902",
    "m050-newbest-903",
    "m050-newbest-904"
  ],
  cohorts: selected.map((cohort) => ({
    id: `new-best-${cohort.id}`,
    opponents: [newBest, ...cohort.opponents.slice(0, 2)]
  })),
  zombies: source.zombies
};

const configs = [
  {
    experimentId: "m049-v-new-best-fresh",
    outputPath: "experiments/m050-search/m049-v-new-best-fresh.json",
    runDirectory: "build/official-runs/m050-search/m049-v-new-best-fresh",
    candidate: {
      name: "COD_m049",
      warriors: [
        "build/chimera-zero-di-elision/b_pad_a",
        "build/chimera-zero-di-elision/a_pad_b"
      ]
    }
  },
  {
    experimentId: "m050-v-new-best-fresh",
    outputPath: "experiments/m050-search/m050-v-new-best-fresh.json",
    runDirectory: "build/official-runs/m050-search/m050-v-new-best-fresh",
    candidate: {
      name: "COD_m050",
      warriors: ["build/final/ChimeraA", "build/final/ChimeraB"]
    }
  }
];

for (const config of configs) {
  const output = `config-${config.experimentId}.json`;
  fs.writeFileSync(output, `${JSON.stringify({ ...config, ...common }, null, 2)}\n`);
  console.log(output);
}
