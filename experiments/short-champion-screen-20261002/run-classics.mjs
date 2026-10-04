import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { encodeBatch } from "../../tools/engine-acceleration-20261001/runtime/batch-format.mjs";

const root = process.cwd();
const sourceStudy = path.join(root, "experiments", "combo-zrl03-b01d-holdout-20261002");
const output = path.join(root, "experiments", "short-champion-screen-20261002", "classic-champions");
if (fs.existsSync(output)) throw new Error(`Refusing to overwrite ${output}`);
const sha256 = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));
const sourceManifest = readJson(path.join(sourceStudy, "manifest.json"));
const sourceSummary = readJson(path.join(sourceStudy, "summary.json"));
const v4Summary = readJson(path.join(root, "experiments", "good-test-v4-check-20261002", "combo-zrl03-matched-holdout", "summary.json"));
const ah02Summary = readJson(path.join(root, "experiments", "combo-ah02-evaluation-20261002", "matched-holdout-same-seat", "summary.json"));
const referenceConfig = readJson(path.join(root, "experiments", "b01d-e1p4-validation-20261002-parallel", "configs", "b01d-e1p4-p01-b01d-parallel.json"));
const engineJar = referenceConfig.jar;
const java = referenceConfig.java;
const batchClasses = path.join(root, "tools", "engine-acceleration-20261001", "runtime", "classes");
const expectedJar = "31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d";
if (sha256(engineJar) !== expectedJar || sourceManifest.engineJar.sha256 !== expectedJar) throw new Error("Deterministic engine hash mismatch");

const snapshot = path.join(root, "candidates", "generated", "claude-e1-confirmation-20261001", "source-snapshot", "binaries");
const candidateFiles = {
  m049: [path.join(snapshot, "m049-A"), path.join(snapshot, "m049-B")],
  m050: [path.join(snapshot, "m050-A"), path.join(snapshot, "m050-B")],
};
const expectedCandidateHashes = {
  m049: ["106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973", "7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77"],
  m050: ["0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"],
};
for (const [name, files] of Object.entries(candidateFiles)) {
  const actual = files.map(sha256);
  if (actual.some((hash, index) => hash !== expectedCandidateHashes[name][index])) throw new Error(`${name} hash mismatch: ${actual}`);
}

const opponentByName = new Map(referenceConfig.cohorts.flatMap(cohort => cohort.opponents).map(team => [team.name, team]));
const zombies = referenceConfig.zombies;
const expectedOpponentHashes = new Map(sourceManifest.opponentRoster.flatMap(team => team.warriors.map(warrior => [path.resolve(warrior.path), warrior.sha256])));
const expectedZombieHashes = new Map(sourceManifest.zombies.map(zombie => [path.resolve(zombie.path), zombie.sha256]));
fs.mkdirSync(output, { recursive: false });
const jobs = [];
const put = (source, target) => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  const record = { source, target, bytes: fs.statSync(target).size, sha256: sha256(target) };
  return record;
};
for (const [candidateName, files] of Object.entries(candidateFiles)) {
  for (const panel of sourceManifest.panels) {
    for (const cohort of panel.cohorts) {
      const id = `${candidateName}-p${panel.panel}-c${String(cohort.id).padStart(2, "0")}`;
      const folder = path.join(output, "runs", id);
      const warriors = path.join(folder, "survivors");
      const zombieDirectory = path.join(folder, "zombies");
      fs.mkdirSync(warriors, { recursive: true });
      fs.mkdirSync(zombieDirectory, { recursive: true });
      const inputs = files.map((source, index) => put(source, path.join(warriors, `COD_test${index + 1}`)));
      for (const teamName of cohort.teams) {
        const team = opponentByName.get(teamName);
        if (!team) throw new Error(`Unknown opponent ${teamName}`);
        team.warriors.forEach((source, index) => {
          const expectedHash = expectedOpponentHashes.get(path.resolve(source));
          if (!expectedHash || sha256(source) !== expectedHash) throw new Error(`Opponent hash mismatch ${source}`);
          inputs.push(put(source, path.join(warriors, `${teamName.replace(/[^A-Za-z0-9_-]/g, "_")}${index + 1}`)));
        });
      }
      for (const zombie of zombies) {
        const expectedHash = expectedZombieHashes.get(path.resolve(zombie.path));
        if (!expectedHash || sha256(zombie.path) !== expectedHash) throw new Error(`Zombie hash mismatch ${zombie.path}`);
        inputs.push(put(zombie.path, path.join(zombieDirectory, path.basename(zombie.path))));
      }
      const score = path.join(folder, "scores.csv");
      const args = ["--headless", "--comboSize", "4", "--battlesPerCombo", "20", "--seed", panel.seed,
        "--threads", "1", "--parallel=false", "--warriorsDir", warriors, "--zombiesDir", zombieDirectory, "--outputFile", score];
      jobs.push({ id, candidateName, panel: panel.panel, cohort: cohort.id, teams: cohort.teams, seed: panel.seed, score, args, inputs });
    }
  }
}
if (jobs.length !== 100 || sourceManifest.panels.length !== 2) throw new Error(`Expected 100 jobs, got ${jobs.length}`);

const manifest = {
  objective: "Shortest same-seat comparison of the four leading pairs on the exact 50 cohort/seed cells used for the V4, combo_zrl03, b01d, and combo_ah02 quick holdout.",
  engineJar: { path: engineJar, sha256: sha256(engineJar) },
  sourceHoldout: { path: path.join(sourceStudy, "manifest.json"), sha256: sha256(path.join(sourceStudy, "manifest.json")) },
  candidates: Object.fromEntries(Object.entries(candidateFiles).map(([name, files]) => [name, files.map((file, index) => ({ path: file, bytes: fs.statSync(file).size, sha256: sha256(file) }))])),
  design: { panels: 2, opponentTeams: 75, cohortsPerPanel: 25, battlesPerCohort: 20, battlesPerCandidate: 1000, totalNewBattles: 2000, comboSize: 4, zombiesPerBattle: zombies.length, seatAndName: "COD_test1/COD_test2", note: "Existing results for V4, combo_zrl03, b01d, and combo_ah02 use these exact 50 cells; only m049 and m050 are newly executed." },
  panels: sourceManifest.panels,
  jobs: jobs.map(({ id, candidateName, panel, cohort, teams, seed, args, inputs }) => ({ id, candidateName, panel, cohort, teams, seed, args, inputs })),
};
fs.writeFileSync(path.join(output, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
const batchPath = path.join(output, "jobs.nul");
fs.writeFileSync(batchPath, encodeBatch(jobs.map(job => ({ id: job.id, args: job.args }))), { flag: "wx" });
console.log(`Running m049 and m050 on 50 matched holdout cells each (2,000 battles total).`);
const classpath = [batchClasses, engineJar].join(path.delimiter);
const execution = spawnSync(java, ["-cp", classpath, "SerialBatchMain", batchPath], { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
fs.writeFileSync(path.join(output, "stdout.txt"), execution.stdout ?? "", { flag: "wx" });
fs.writeFileSync(path.join(output, "stderr.txt"), execution.stderr ?? "", { flag: "wx" });
if (execution.error || execution.status !== 0) throw new Error(`Batch engine failed: ${execution.error?.message ?? execution.stderr}`);

const readGroupScore = file => {
  let groups = false;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "Groups:") { groups = true; continue; }
    if (line === "Warriors:") groups = false;
    if (!groups) continue;
    const comma = line.lastIndexOf(",");
    if (comma >= 0 && line.slice(0, comma) === "COD_test") return Number(line.slice(comma + 1));
  }
  throw new Error(`COD_test group score missing from ${file}`);
};
const newResults = Object.fromEntries(Object.keys(candidateFiles).map(name => [name, []]));
for (const job of jobs) {
  const marker = new RegExp(`BATCH_V1_DONE ${job.id} (\\d+) (\\d+)`).exec(execution.stdout ?? "");
  if (!marker || Number(marker[1]) !== 20 || !fs.existsSync(job.score)) throw new Error(`Incomplete job ${job.id}`);
  for (const input of job.inputs) if (sha256(input.target) !== input.sha256) throw new Error(`Staged input changed: ${input.target}`);
  const rawPoints = readGroupScore(job.score);
  newResults[job.candidateName].push({ panel: job.panel, cohort: job.cohort, teams: job.teams, seed: job.seed,
    rawPoints, pointsPerBattle: rawPoints / 20, scoreSha256: sha256(job.score), jobNanos: Number(marker[2]) });
}

const codeCells = new Map();
const setCells = (name, cells, fields) => codeCells.set(name, new Map(cells.map(cell => [cell.panel + "-" + cell.cohort, fields(cell)])));
for (const job of sourceSummary.jobs) {
  if (!codeCells.has(job.arm === "combo" ? "combo_zrl03" : "b01d")) codeCells.set(job.arm === "combo" ? "combo_zrl03" : "b01d", new Map());
  codeCells.get(job.arm === "combo" ? "combo_zrl03" : "b01d").set(job.panel + "-" + job.cohort, { teams: job.teams, pointsPerBattle: job.pointsPerBattle });
}
setCells("friend_V4", v4Summary.v4Jobs, cell => ({ teams: cell.teams, pointsPerBattle: cell.pointsPerBattle }));
setCells("combo_ah02", ah02Summary.jobs, cell => ({ teams: cell.teams, pointsPerBattle: cell.pointsPerBattle }));
for (const [name, cells] of Object.entries(newResults)) setCells(name, cells, cell => ({ teams: cell.teams, pointsPerBattle: cell.pointsPerBattle }));
const codeNames = [...codeCells.keys()];
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
function stats(values) {
  const average = mean(values);
  const sd = Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
  const se = sd / Math.sqrt(values.length);
  const critical = 2.009575;
  return { n: values.length, mean: average, meanPer100: average * 100,
    ci95: [average - critical * se, average + critical * se], ci95Per100: [(average - critical * se) * 100, (average + critical * se) * 100] };
}
const ranking = codeNames.map(name => {
  const cells = codeCells.get(name);
  if (cells.size !== 50) throw new Error(`${name} has ${cells.size} matched cells, expected 50`);
  const values = [...cells.values()].map(cell => cell.pointsPerBattle);
  return { name, ...stats(values), totalPoints: mean(values) * 1000 };
}).sort((a, b) => b.mean - a.mean);
const pairwise = [];
for (let i = 0; i < ranking.length; i++) for (let j = i + 1; j < ranking.length; j++) {
  const higher = ranking[i].name;
  const lower = ranking[j].name;
  const highCells = codeCells.get(higher);
  const lowCells = codeCells.get(lower);
  const deltas = [...highCells.entries()].map(([key, cell]) => {
    const other = lowCells.get(key);
    if (!other || other.teams.join("|") !== cell.teams.join("|")) throw new Error(`Pairing mismatch ${higher}/${lower}/${key}`);
    return cell.pointsPerBattle - other.pointsPerBattle;
  });
  pairwise.push({ higher, lower, ...stats(deltas), signs: { wins: deltas.filter(x => x > 0).length, losses: deltas.filter(x => x < 0).length, ties: deltas.filter(x => x === 0).length } });
}
const summary = { experimentId: "short-champion-screen-20261002", generatedAt: new Date().toISOString(), candidateBattles: 1000,
  newBattlesRun: 2000, ranking, pairwise, newlyRunCells: Object.fromEntries(Object.entries(newResults)),
  previousData: { comboHoldout: path.join(sourceStudy, "summary.json"), v4Holdout: path.join(root, "experiments", "good-test-v4-check-20261002", "combo-zrl03-matched-holdout", "summary.json"), ah02Holdout: path.join(root, "experiments", "combo-ah02-evaluation-20261002", "matched-holdout-same-seat", "summary.json") } };
fs.writeFileSync(path.join(output, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, { flag: "wx" });
console.log(JSON.stringify({ ranking, keyPairwise: pairwise.filter(row => ["m049", "m050", "b01d", "combo_zrl03", "combo_ah02", "friend_V4"].includes(row.higher) && ["m049", "m050", "b01d", "combo_zrl03", "combo_ah02", "friend_V4"].includes(row.lower)) }, null, 2));
