import fs from "node:fs";

const field = JSON.parse(fs.readFileSync("config-good-test-good_test-primary.json", "utf8"));
const base = JSON.parse(fs.readFileSync("config-smart-counter-joint-smart.json", "utf8"));
const thirdTeams = [
  field.cohorts[3].opponents[2],
  field.cohorts[12].opponents[2],
  field.cohorts[14].opponents[2],
  field.cohorts[17].opponents[0],
  field.cohorts[22].opponents[0],
  { name: "OFEK_New_Best", warriors: ["C:/Users/ronyr/Downloads/New_Best1", "C:/Users/ronyr/Downloads/New_Best2"] },
  { name: "COD_Good_Test", warriors: ["C:/Users/ronyr/Downloads/Good_Test1", "C:/Users/ronyr/Downloads/Good_Test2"] },
];
const m049 = base.cohorts[0].opponents[0];
const m050 = base.cohorts[0].opponents[1];
const variants = ["baseline", "fixed-both", "fixed-a", "fixed-b", "copy-nine", "copy-nine-a", "copy-nine-b", "hybrid-a", "hybrid-b"];
for (const variant of variants) {
  const config = structuredClone(base);
  config.experimentId = `smart-target-${variant}`;
  config.outputPath = `experiments/smart-counter-2026-09-30/target/${variant}.json`;
  config.runDirectory = `build/official-runs/smart-counter-2026-09-30/target/${variant}`;
  config.battles = 50;
  config.seeds = ["smart-target-fresh-a", "smart-target-fresh-b"];
  config.cohorts = thirdTeams.map((third) => ({ id: `with-${third.name}`, opponents: [m049, m050, third] }));
  if (variant !== "baseline") {
    const other = JSON.parse(fs.readFileSync(`config-smart-ablation-${variant}.json`, "utf8"));
    config.candidate = other.candidate;
  }
  fs.writeFileSync(`config-smart-target-${variant}.json`, `${JSON.stringify(config, null, 2)}\n`);
}

const addTarget = JSON.parse(fs.readFileSync("config-smart-target-baseline.json", "utf8"));
addTarget.experimentId = "smart-target-add-a";
addTarget.outputPath = "experiments/smart-counter-2026-09-30/target/add-a.json";
addTarget.runDirectory = "build/official-runs/smart-counter-2026-09-30/target/add-a";
addTarget.candidate = JSON.parse(fs.readFileSync("config-smart-step-duel-add-a.json", "utf8")).candidate;
fs.writeFileSync("config-smart-target-add-a.json", `${JSON.stringify(addTarget, null, 2)}\n`);

const duel = structuredClone(base);
duel.experimentId = "smart-duel-baseline";
duel.outputPath = "experiments/smart-counter-2026-09-30/duel/baseline.json";
duel.runDirectory = "build/official-runs/smart-counter-2026-09-30/duel/baseline";
duel.battles = 250;
duel.seeds = ["smart-duel-fresh-a", "smart-duel-fresh-b"];
duel.cohorts = [
  { id: "vs-m049", opponents: [m049] },
  { id: "vs-m050", opponents: [m050] },
];
fs.writeFileSync("config-smart-duel-baseline.json", `${JSON.stringify(duel, null, 2)}\n`);

const fixedBoth = JSON.parse(fs.readFileSync("config-smart-ablation-fixed-both.json", "utf8")).candidate;
const fixedDuel = structuredClone(duel);
fixedDuel.experimentId = "smart-duel-fixed-both";
fixedDuel.outputPath = "experiments/smart-counter-2026-09-30/duel/fixed-both.json";
fixedDuel.runDirectory = "build/official-runs/smart-counter-2026-09-30/duel/fixed-both";
fixedDuel.candidate = fixedBoth;
fs.writeFileSync("config-smart-duel-fixed-both.json", `${JSON.stringify(fixedDuel, null, 2)}\n`);

const fixedField = JSON.parse(fs.readFileSync("config-smart-counter-field-smart.json", "utf8"));
fixedField.experimentId = "smart-field-fixed-both";
fixedField.outputPath = "experiments/smart-counter-2026-09-30/field/fixed-both.json";
fixedField.runDirectory = "build/official-runs/smart-counter-2026-09-30/field/fixed-both";
fixedField.candidate = fixedBoth;
fs.writeFileSync("config-smart-field-fixed-both.json", `${JSON.stringify(fixedField, null, 2)}\n`);

for (const variant of ["fixed-a", "fixed-b"]) {
  const pair = JSON.parse(fs.readFileSync(`config-smart-ablation-${variant}.json`, "utf8")).candidate;
  const d = structuredClone(duel);
  d.experimentId = `smart-duel-${variant}`;
  d.outputPath = `experiments/smart-counter-2026-09-30/duel/${variant}.json`;
  d.runDirectory = `build/official-runs/smart-counter-2026-09-30/duel/${variant}`;
  d.candidate = pair;
  d.battles = 125;
  fs.writeFileSync(`config-smart-duel-${variant}.json`, `${JSON.stringify(d, null, 2)}\n`);
  const f = structuredClone(fixedField);
  f.experimentId = `smart-field-screen-${variant}`;
  f.outputPath = `experiments/smart-counter-2026-09-30/field/screen-${variant}.json`;
  f.runDirectory = `build/official-runs/smart-counter-2026-09-30/field/screen-${variant}`;
  f.candidate = pair;
  f.battles = 25;
  f.cohorts = f.cohorts.slice(0, 10);
  fs.writeFileSync(`config-smart-field-screen-${variant}.json`, `${JSON.stringify(f, null, 2)}\n`);
}

const smart = base.candidate;
const smartFieldScreen = JSON.parse(fs.readFileSync("config-smart-counter-field-smart.json", "utf8"));
smartFieldScreen.experimentId = "smart-field-screen-control";
smartFieldScreen.outputPath = "experiments/smart-counter-2026-09-30/field/screen-control.json";
smartFieldScreen.runDirectory = "build/official-runs/smart-counter-2026-09-30/field/screen-control";
smartFieldScreen.battles = 25;
smartFieldScreen.cohorts = smartFieldScreen.cohorts.slice(0, 10);
fs.writeFileSync("config-smart-field-screen-control.json", `${JSON.stringify(smartFieldScreen, null, 2)}\n`);
const defensePairs = {
  "m049-control": m049.warriors,
  "m050-control": m050.warriors,
  "m049-smart-a": [smart.warriors[0], m049.warriors[1]],
  "m049-smart-b": [m049.warriors[0], smart.warriors[1]],
  "m050-smart-a": [smart.warriors[0], m050.warriors[1]],
  "m050-smart-b": [m050.warriors[0], smart.warriors[1]],
};
for (const [name, warriors] of Object.entries(defensePairs)) {
  const c = structuredClone(duel);
  c.experimentId = `smart-defense-duel-${name}`;
  c.outputPath = `experiments/smart-counter-2026-09-30/defense/${name}.json`;
  c.runDirectory = `build/official-runs/smart-counter-2026-09-30/defense/${name}`;
  c.candidate = { name: `COD_${name.replaceAll("-", "_")}`, warriors };
  c.cohorts = [{ id: "vs-smart", opponents: [smart] }];
  fs.writeFileSync(`config-smart-defense-duel-${name}.json`, `${JSON.stringify(c, null, 2)}\n`);
  const f = JSON.parse(fs.readFileSync("config-smart-counter-field-m050.json", "utf8"));
  f.experimentId = `smart-defense-field-screen-${name}`;
  f.outputPath = `experiments/smart-counter-2026-09-30/defense/field-screen-${name}.json`;
  f.runDirectory = `build/official-runs/smart-counter-2026-09-30/defense/field-screen-${name}`;
  f.candidate = c.candidate;
  f.battles = 25;
  f.cohorts = f.cohorts.slice(0, 10);
  fs.writeFileSync(`config-smart-defense-field-screen-${name}.json`, `${JSON.stringify(f, null, 2)}\n`);
}
