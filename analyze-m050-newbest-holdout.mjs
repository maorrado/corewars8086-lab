import fs from "node:fs";

const root = "experiments/smart-counter-2026-09-30/newbest-holdout";
const control = JSON.parse(fs.readFileSync(`${root}/control.json`, "utf8"));
const trial = JSON.parse(fs.readFileSync(`${root}/xor-b.json`, "utf8"));
const scores = new Map(control.runs.map((run) => [run.runId, run.candidate.teamPerBattle]));
const values = trial.runs.map((run) => run.candidate.teamPerBattle - scores.get(run.runId));
const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
const sd = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1));
const half = 1.96 * sd / Math.sqrt(values.length);
console.log({ control: control.aggregate.teamPerBattle, candidate: trial.aggregate.teamPerBattle, battles: trial.aggregate.battles });
console.log({ n: values.length, mean, ci95: [mean - half, mean + half], wins: values.filter((v) => v > 0).length, losses: values.filter((v) => v < 0).length, ties: values.filter((v) => v === 0).length });
