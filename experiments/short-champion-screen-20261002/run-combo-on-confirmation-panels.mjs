import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const study = path.join(root, "experiments", "short-champion-screen-20261002", "four-panel-confirmation");
const configDir = path.join(study, "configs");
const resultDir = path.join(study, "results");
const runRoot = path.join(root, "build", "official-runs", "short-champion-screen-20261002", "combo-four-panel-confirmation");
const candidateA = path.join(root, "build", "combo-zrl03-evaluation-20261002", "ComboA");
const candidateB = path.join(root, "build", "combo-zrl03-evaluation-20261002", "ComboB");
const expected = [
  "605880ba552c3d43c5cd175693b1942cf401c60c2135f62ab76a97dc20d1b051",
  "011720f6ae95c4b225ee92acfcbe4e373e6c56d78fadde3b11268a162529f334",
];
const sha256 = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
for (const [index, file] of [candidateA, candidateB].entries()) {
  if (sha256(file) !== expected[index]) throw new Error(`combo_zrl03 binary hash mismatch: ${file}`);
}
fs.mkdirSync(configDir, { recursive: true });
fs.mkdirSync(resultDir, { recursive: true });

for (let panel = 1; panel <= 4; panel += 1) {
  const id = String(panel).padStart(2, "0");
  const sourceConfigPath = path.join(root, "experiments", "b01d-e1p4-validation-20261002-parallel", "configs", `b01d-e1p4-p${id}-b01d-parallel.json`);
  const config = JSON.parse(fs.readFileSync(sourceConfigPath, "utf8"));
  config.experimentId = `combo-zrl03-confirm-p${id}-20261002`;
  config.candidate = { name: "COD_Good_Test_V4", warriors: [candidateA, candidateB] };
  config.outputPath = path.join(resultDir, `${config.experimentId}.json`);
  config.runDirectory = path.join(runRoot, `p${id}`);
  const configPath = path.join(configDir, `${config.experimentId}.json`);
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, { flag: "wx" });
  console.log(`\n=== combo_zrl03 panel ${id}: ${config.cohorts.length} cohorts × ${config.battles} battles ===`);
  const run = spawnSync(process.execPath, [path.join(root, "official-benchmark.mjs"), configPath], { cwd: root, stdio: "inherit", windowsHide: true });
  if (run.error || run.status !== 0) throw new Error(`Panel ${id} failed: ${run.error?.message ?? run.status}`);
}

const panelMeans = [];
for (let panel = 1; panel <= 4; panel += 1) {
  const id = String(panel).padStart(2, "0");
  const combo = JSON.parse(fs.readFileSync(path.join(resultDir, `combo-zrl03-confirm-p${id}-20261002.json`), "utf8"));
  const v4 = JSON.parse(fs.readFileSync(path.join(root, "experiments", "good-test-v4-check-20261002", "results", `good-test-v4-p${id}-20261002.json`), "utf8"));
  const b01d = JSON.parse(fs.readFileSync(path.join(root, "experiments", "b01d-e1p4-validation-20261002-parallel", "results", `b01d-e1p4-p${id}-b01d-parallel.json`), "utf8"));
  const asMap = data => new Map(data.runs.map(run => [run.cohortId, run]));
  const comboRuns = asMap(combo);
  const v4Runs = asMap(v4);
  const b01dRuns = asMap(b01d);
  const cohortIds = [...comboRuns.keys()];
  if (cohortIds.length !== 25 || v4Runs.size !== 25 || b01dRuns.size !== 25) throw new Error(`Panel ${id} cohort count mismatch`);
  for (const cohortId of cohortIds) {
    const a = comboRuns.get(cohortId), b = v4Runs.get(cohortId), c = b01dRuns.get(cohortId);
    if (!a || !b || !c || a.seed !== b.seed || a.seed !== c.seed || a.battles !== 50 || b.battles !== 50 || c.battles !== 50) {
      throw new Error(`Panel ${id}/${cohortId} pairing mismatch`);
    }
  }
  const average = map => [...map.values()].reduce((sum, run) => sum + run.candidate.teamPerBattle, 0) / map.size;
  panelMeans.push({ panel, combo_zrl03: average(comboRuns), friend_V4: average(v4Runs), b01d: average(b01dRuns), battlesPerPair: 1250 });
}
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
function paired(values) {
  const avg = mean(values);
  const sd = Math.sqrt(values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1));
  const se = sd / Math.sqrt(values.length);
  const tCriticalDf3 = 3.182446;
  return { meanPerBattle: avg, meanPer100: avg * 100, ci95PanelLevelPerBattle: [avg - tCriticalDf3 * se, avg + tCriticalDf3 * se], ci95PanelLevelPer100: [(avg - tCriticalDf3 * se) * 100, (avg + tCriticalDf3 * se) * 100] };
}
const comparisons = {
  comboMinusV4: paired(panelMeans.map(row => row.combo_zrl03 - row.friend_V4)),
  comboMinusB01d: paired(panelMeans.map(row => row.combo_zrl03 - row.b01d)),
  v4MinusB01d: paired(panelMeans.map(row => row.friend_V4 - row.b01d)),
};
const summary = { experimentId: "short-champion-screen-20261002-four-panel-confirmation", design: { independentPanels: 4, cohortsPerPanel: 25, battlesPerCohort: 50, battlesPerCandidate: 5000, comparatorResultsReused: true, panelLevelInference: "t interval over four independent panel means; low power" }, panelMeans, comparisons };
fs.writeFileSync(path.join(study, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, { flag: "wx" });
console.log("\nFOUR-PANEL SUMMARY\n" + JSON.stringify(summary, null, 2));
