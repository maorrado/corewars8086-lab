import fs from "node:fs";

const smart = JSON.parse(fs.readFileSync("config-smart-duel-baseline.json", "utf8")).candidate;
const team = { name: "COD_Add_A_m050_B", warriors: ["build/smart-step-operators/add-a/A", "build/m050-repro/ab_pad_b"] };
const duel = JSON.parse(fs.readFileSync("config-smart-defense-duel-m050-control.json", "utf8"));
duel.experimentId = "add-a-m050-b-duel";
duel.outputPath = "experiments/smart-counter-2026-09-30/defense/add-a-m050-b-duel.json";
duel.runDirectory = "build/official-runs/smart-counter-2026-09-30/defense/add-a-m050-b-duel";
duel.candidate = team;
duel.cohorts = [{ id: "vs-smart", opponents: [smart] }];
fs.writeFileSync("config-add-a-m050-b-duel.json", `${JSON.stringify(duel, null, 2)}\n`);
const field = JSON.parse(fs.readFileSync("config-smart-defense-field-screen-m050-control.json", "utf8"));
field.experimentId = "add-a-m050-b-field-screen";
field.outputPath = "experiments/smart-counter-2026-09-30/defense/add-a-m050-b-field-screen.json";
field.runDirectory = "build/official-runs/smart-counter-2026-09-30/defense/add-a-m050-b-field-screen";
field.candidate = team;
fs.writeFileSync("config-add-a-m050-b-field-screen.json", `${JSON.stringify(field, null, 2)}\n`);
