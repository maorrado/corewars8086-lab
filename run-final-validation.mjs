import { execFileSync } from "node:child_process";
import fs from "node:fs";

const battles = Number(process.env.FINAL_BATTLES ?? 300);
const seeds = (process.env.FINAL_SEEDS ?? "final-001,final-002,final-003,final-004,final-005").split(",");

const jobs = [
  {
    id: "phoenix-final-train",
    template: "config-official-v004-quick.json",
    candidate: { name: "COD_Phoenix", warriors: ["build/final/PhoenixA", "build/final/PhoenixB"] },
  },
  {
    id: "phoenix-final-holdout",
    template: "config-official-holdout.json",
    candidate: { name: "COD_Phoenix", warriors: ["build/final/PhoenixA", "build/final/PhoenixB"] },
  },
  {
    id: "registered-final-holdout",
    template: "config-official-holdout.json",
    candidate: {
      name: "HRZ_Registered_Winners",
      warriors: [
        "official-2025/survivors-online/HRZ_Registered_Winners1",
        "official-2025/survivors-online/HRZ_Registered_Winners2",
      ],
    },
  },
];

for (const job of jobs) {
  const config = JSON.parse(fs.readFileSync(job.template, "utf8"));
  config.experimentId = job.id;
  config.outputPath = `experiments/${job.id}.json`;
  config.runDirectory = `build/official-runs/${job.id}`;
  config.battles = battles;
  config.seeds = seeds;
  config.candidate = job.candidate;
  const configPath = `config-${job.id}.json`;
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  execFileSync(process.execPath, ["official-benchmark.mjs", configPath], { stdio: "inherit" });
}
