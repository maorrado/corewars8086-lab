import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { encodeBatch } from "../../tools/engine-acceleration-20261001/runtime/batch-format.mjs";

const root = process.cwd();
const sourceStudy = path.join(root, "experiments", "combo-zrl03-b01d-holdout-20261002");
const output = path.join(root, "experiments", "combo-ah02-evaluation-20261002", "matched-holdout-same-seat");
if (fs.existsSync(output)) throw new Error(`Refusing to overwrite ${output}`);

const sha256 = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));
const sourceManifest = readJson(path.join(sourceStudy, "manifest.json"));
const sourceSummary = readJson(path.join(sourceStudy, "summary.json"));
const referenceConfig = readJson(path.join(root, "experiments", "b01d-e1p4-validation-20261002-parallel", "configs", "b01d-e1p4-p01-b01d-parallel.json"));
const engineJar = referenceConfig.jar;
const java = referenceConfig.java;
const batchClasses = path.join(root, "tools", "engine-acceleration-20261001", "runtime", "classes");
const expectedJar = "31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d";
if (sha256(engineJar) !== expectedJar || sourceManifest.engineJar.sha256 !== expectedJar) throw new Error("Deterministic engine hash mismatch");

const candidateBinaries = [
  path.join(root, "build", "combo-ah02-evaluation-20261002", "ComboA"),
  path.join(root, "build", "combo-ah02-evaluation-20261002", "ComboB"),
];
const expectedCandidateHashes = [
  "dea095d386ae54616a34074fc3762996bcb8a3f3059495af96751e93fe8f143f",
  "d46efcc1b182b71cd57d110cf6484c29f699e8dd3969795b599f4b9a156a956a",
];
const candidateHashes = candidateBinaries.map(sha256);
if (candidateHashes.some((hash, index) => hash !== expectedCandidateHashes[index])) throw new Error(`combo_ah02 binary hash mismatch: ${candidateHashes}`);

const opponentByName = new Map(referenceConfig.cohorts.flatMap(cohort => cohort.opponents).map(team => [team.name, team]));
const zombies = referenceConfig.zombies;
const sourceBinaries = {
  combo_zrl03: [path.join(root, "build", "combo-zrl03-evaluation-20261002", "ComboA"), path.join(root, "build", "combo-zrl03-evaluation-20261002", "ComboB")],
  b01d: [path.join(root, "candidates", "generated", "claude-b01d-e1p4-20261002", "build", "b01d-A"), path.join(root, "candidates", "generated", "claude-b01d-e1p4-20261002", "build", "b01d-B")],
};
const expectedBaselineHashes = {
  combo_zrl03: ["605880ba552c3d43c5cd175693b1942cf401c60c2135f62ab76a97dc20d1b051", "011720f6ae95c4b225ee92acfcbe4e373e6c56d78fadde3b11268a162529f334"],
  b01d: ["775080226ca8f9e9a5aac584094c9066bd2c55365ee8cea1e18db26440d9315e", "884b4d52e4ef1e57db85c88083d0a8667a6bd252a25728da7f5fdedefa6f33c7"],
};
for (const [name, files] of Object.entries(sourceBinaries)) {
  const actual = files.map(sha256);
  if (actual.some((hash, index) => hash !== expectedBaselineHashes[name][index])) throw new Error(`${name} binary hash mismatch: ${actual}`);
}

fs.mkdirSync(output, { recursive: false });
const expectedScoreRecords = new Map(sourceSummary.jobs.map(job => [`${job.panel}-${job.cohort}-${job.arm}`, job]));
const expectedOpponentHashes = new Map(sourceManifest.opponentRoster.flatMap(team => team.warriors.map(warrior => [path.resolve(warrior.path), warrior.sha256])));
const expectedZombieHashes = new Map(sourceManifest.zombies.map(zombie => [path.resolve(zombie.path), zombie.sha256]));
const jobs = [];
const staged = [];
const put = (source, target) => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  const record = { source, target, bytes: fs.statSync(target).size, sha256: sha256(target) };
  staged.push(record);
  return record;
};

for (const panel of sourceManifest.panels) {
  for (const cohort of panel.cohorts) {
    const id = `combo_ah02-p${panel.panel}-c${String(cohort.id).padStart(2, "0")}`;
    const folder = path.join(output, "runs", id);
    const warriors = path.join(folder, "survivors");
    const zombieDirectory = path.join(folder, "zombies");
    fs.mkdirSync(warriors, { recursive: true });
    fs.mkdirSync(zombieDirectory, { recursive: true });
    const inputRecords = candidateBinaries.map((source, index) => {
      const target = path.join(warriors, `COD_test${index + 1}`);
      fs.copyFileSync(source, target);
      const record = { source, target, bytes: fs.statSync(target).size, sha256: sha256(target) };
      staged.push(record);
      return record;
    });
    for (const teamName of cohort.teams) {
      const team = opponentByName.get(teamName);
      if (!team) throw new Error(`Unknown 2025 opponent: ${teamName}`);
      team.warriors.forEach((source, index) => {
        const expectedHash = expectedOpponentHashes.get(path.resolve(source));
        if (!expectedHash || sha256(source) !== expectedHash) throw new Error(`Opponent hash mismatch: ${source}`);
        inputRecords.push(put(source, path.join(warriors, `${teamName.replace(/[^A-Za-z0-9_-]/g, "_")}${index + 1}`)));
      });
    }
    for (const zombie of zombies) {
      const expectedHash = expectedZombieHashes.get(path.resolve(zombie.path));
      if (!expectedHash || sha256(zombie.path) !== expectedHash) throw new Error(`Zombie hash mismatch: ${zombie.path}`);
      inputRecords.push(put(zombie.path, path.join(zombieDirectory, path.basename(zombie.path))));
    }
    const score = path.join(folder, "scores.csv");
    const args = ["--headless", "--comboSize", "4", "--battlesPerCombo", "20", "--seed", panel.seed,
      "--threads", "1", "--parallel=false", "--warriorsDir", warriors, "--zombiesDir", zombieDirectory, "--outputFile", score];
    jobs.push({ id, panel: panel.panel, cohort: cohort.id, teams: cohort.teams, seed: panel.seed, folder, score, args, inputRecords });
  }
}
if (jobs.length !== 50 || sourceSummary.design.pairedClusters !== 50) throw new Error(`Expected 50 matched cohorts, got ${jobs.length}`);

const manifest = {
  objective: "Exact paired fresh-holdout run of combo_ah02 on the same 50 2025-field cohort/seed cells used to evaluate Good_Test_V4, combo_zrl03, and b01d.",
  engineJar: { path: engineJar, sha256: sha256(engineJar) },
  sourceHoldout: { path: path.join(sourceStudy, "manifest.json"), sha256: sha256(path.join(sourceStudy, "manifest.json")) },
  candidate: { name: "combo_ah02", binaries: candidateBinaries.map((file, index) => ({ path: file, bytes: fs.statSync(file).size, sha256: candidateHashes[index] })) },
  baselineBinaries: Object.fromEntries(Object.entries(sourceBinaries).map(([arm, files]) => [arm, files.map(file => ({ path: file, bytes: fs.statSync(file).size, sha256: sha256(file) }))])),
  design: { panels: 2, opponentTeams: 75, cohortsPerPanel: 25, battlesPerCohort: 20, battles: 1000, comboSize: 4, zombiesPerBattle: zombies.length, pairedAgainst: ["combo_zrl03", "b01d"], note: "Same 50 cohort-seed cells as the Good_Test_V4 evaluation; baseline results are read from the matching original holdout." },
  panels: sourceManifest.panels,
  jobs: jobs.map(({ id, panel, cohort, teams, seed, args, inputRecords }) => ({ id, panel, cohort, teams, seed, args, inputRecords })),
};
fs.writeFileSync(path.join(output, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
const batchPath = path.join(output, "jobs.nul");
fs.writeFileSync(batchPath, encodeBatch(jobs.map(job => ({ id: job.id, args: job.args }))), { flag: "wx" });
console.log(`Running combo_ah02 on ${jobs.length} matched cohorts (1,000 battles).`);
const classpath = [batchClasses, engineJar].join(path.delimiter);
const execution = spawnSync(java, ["-cp", classpath, "SerialBatchMain", batchPath], { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
fs.writeFileSync(path.join(output, "stdout.txt"), execution.stdout ?? "", { flag: "wx" });
fs.writeFileSync(path.join(output, "stderr.txt"), execution.stderr ?? "", { flag: "wx" });
if (execution.error || execution.status !== 0) throw new Error(`Batch engine failed: ${execution.error?.message ?? execution.stderr}`);

const candidateScore = file => {
  let section = null;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "Groups:") { section = "groups"; continue; }
    if (line === "Warriors:") { section = "warriors"; continue; }
    if (section !== "groups") continue;
    const comma = line.lastIndexOf(",");
    if (comma >= 0 && line.slice(0, comma) === "COD_test") return Number(line.slice(comma + 1));
  }
  throw new Error(`COD_test group score missing: ${file}`);
};
const candidateRecords = jobs.map(job => {
  const marker = new RegExp(`BATCH_V1_DONE ${job.id} (\\d+) (\\d+)`).exec(execution.stdout ?? "");
  if (!marker || Number(marker[1]) !== 20 || !fs.existsSync(job.score)) throw new Error(`Incomplete job ${job.id}`);
  for (const input of job.inputRecords) if (sha256(input.target) !== input.sha256) throw new Error(`Staged input changed: ${input.target}`);
  const rawPoints = candidateScore(job.score);
  return { id: job.id, panel: job.panel, cohort: job.cohort, teams: job.teams, seed: job.seed, battles: 20,
    rawPoints, pointsPerBattle: rawPoints / 20, scoreSha256: sha256(job.score), jobNanos: Number(marker[2]) };
});
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
function pairedStats(values) {
  const average = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1);
  const se = Math.sqrt(variance / values.length);
  const critical = 2.009575;
  return { n: values.length, meanPointsPerBattle: average, meanPointsPer100Battles: average * 100,
    ci95PerBattle: [average - critical * se, average + critical * se],
    ci95PointsPer100Battles: [(average - critical * se) * 100, (average + critical * se) * 100] };
}
const paired = candidateRecords.map(candidate => {
  const combo = expectedScoreRecords.get(`${candidate.panel}-${candidate.cohort}-combo`);
  const b01d = expectedScoreRecords.get(`${candidate.panel}-${candidate.cohort}-b01d`);
  if (!combo || !b01d || combo.teams.join("|") !== candidate.teams.join("|") || b01d.teams.join("|") !== candidate.teams.join("|")) throw new Error(`Holdout cell mismatch at panel ${candidate.panel}, cohort ${candidate.cohort}`);
  return { panel: candidate.panel, cohort: candidate.cohort, combo_ah02: candidate.pointsPerBattle,
    combo_zrl03: combo.pointsPerBattle, b01d: b01d.pointsPerBattle,
    deltaVsCombo: candidate.pointsPerBattle - combo.pointsPerBattle,
    deltaVsB01d: candidate.pointsPerBattle - b01d.pointsPerBattle };
});
const comparisons = Object.fromEntries([["combo_zrl03", "deltaVsCombo"], ["b01d", "deltaVsB01d"]].map(([name, key]) => {
  const values = paired.map(cell => cell[key]);
  const panelMeans = [1, 2].map(panel => mean(paired.filter(cell => cell.panel === panel).map(cell => cell[key])));
  return [name, { ...pairedStats(values), panelMeans, panelSigns: { positive: values.filter(v => v > 0).length, negative: values.filter(v => v < 0).length, tie: values.filter(v => v === 0).length } }];
}));
const candidateMeanPointsPerBattle = mean(candidateRecords.map(record => record.pointsPerBattle));
const summary = { experimentId: path.basename(path.dirname(output)), generatedAt: new Date().toISOString(), candidateMeanPointsPerBattle,
  candidateBattles: 1000, comparisons, pairedCells: paired, jobs: candidateRecords };
fs.writeFileSync(path.join(output, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, { flag: "wx" });
console.log(JSON.stringify({ candidateMeanPointsPerBattle, candidatePointsPer100Battles: candidateMeanPointsPerBattle * 100, candidateBattles: 1000, comparisons }, null, 2));
