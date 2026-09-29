import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Joint-battle protocol: m049 and m050 both present in every battle, alongside
// a pair of official 2025 opponents. Each original 3-opponent cohort yields
// all C(3,2)=3 opponent-pairs, so every opponent appears in exactly two pairs
// per cohort. With 50 battles/pair and 25 cohorts x 3 pairs = 75 pair-units,
// each of the 75 official teams appears in exactly 100 battles (2 pairs x 50).
//
// Usage: node joint-benchmark.mjs <config.json> [--swap]
// --swap: swaps candidateA/candidateB team names and file load order, to
// control for load-order / naming artifacts.

const configPath = process.argv[2];
const swap = process.argv.includes("--swap");
if (!configPath) throw new Error("usage: node joint-benchmark.mjs <config.json> [--swap]");

const configAbsolute = path.resolve(configPath);
const root = path.dirname(configAbsolute);
const config = JSON.parse(fs.readFileSync(configAbsolute, "utf8"));
const resolveFromConfig = (file) => path.resolve(root, file);
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const safeName = (value) => value.replace(/[^A-Za-z0-9_.-]/g, "_");

const java = resolveFromConfig(config.java ?? "tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe");
const jar = resolveFromConfig(config.jar ?? "repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar");
const outputPath = resolveFromConfig(config.outputPath);
const runRoot = resolveFromConfig(config.runDirectory ?? `build/official-runs/${safeName(config.experimentId)}`);
const battlesPerPair = config.battlesPerPair;
if (!Number.isInteger(battlesPerPair) || battlesPerPair < 1) throw new Error("config.battlesPerPair must be a positive integer");

function parseScores(text) {
  const parsed = { groups: {}, warriors: {} };
  let section = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "Groups:") { section = "groups"; continue; }
    if (line === "Warriors:") { section = "warriors"; continue; }
    if (!line || !section) continue;
    const separator = line.lastIndexOf(",");
    if (separator < 0) continue;
    parsed[section][line.slice(0, separator)] = Number(line.slice(separator + 1));
  }
  return parsed;
}

function copyTeam(team, destination) {
  if (!team.warriors || team.warriors.length !== 2) throw new Error(`${team.name} must contain exactly two warriors`);
  const files = [];
  team.warriors.forEach((warrior, index) => {
    const source = resolveFromConfig(warrior);
    const target = path.join(destination, `${safeName(team.name)}${index + 1}`);
    fs.copyFileSync(source, target);
    files.push({ source, target, bytes: fs.statSync(source).size, sha256: sha256(source) });
  });
  return files;
}

function pairsOf3(arr) {
  // returns the 3 possible 2-element combinations of a 3-element array
  return [[arr[0], arr[1]], [arr[0], arr[2]], [arr[1], arr[2]]];
}

const candA = swap
  ? { name: config.candidateB.name, warriors: config.candidateB.warriors }
  : { name: config.candidateA.name, warriors: config.candidateA.warriors };
const candB = swap
  ? { name: config.candidateA.name, warriors: config.candidateA.warriors }
  : { name: config.candidateB.name, warriors: config.candidateB.warriors };

const runs = [];
for (const cohort of config.cohorts) {
  if (cohort.opponents.length !== 3) throw new Error(`${cohort.id} must contain exactly three opponents`);
  const pairs = pairsOf3(cohort.opponents);
  for (let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
    const [opp1, opp2] = pairs[pairIndex];
    for (const seed of config.seeds) {
      const runId = `${safeName(cohort.id)}_pair${pairIndex}__${safeName(seed)}`;
      const runDirectory = path.join(runRoot, runId);
      const warriorsDirectory = path.join(runDirectory, "survivors");
      const zombiesDirectory = path.join(runDirectory, "zombies");
      fs.mkdirSync(warriorsDirectory, { recursive: true });
      fs.mkdirSync(zombiesDirectory, { recursive: true });

      // Load order: swap flips which candidate is copied first, matching the
      // --swap semantics (candA/candB already swapped above), plus opponent
      // order is deterministic (opp1 then opp2) unless swap also reverses it.
      const teams = swap ? [candA, candB, opp2, opp1] : [candA, candB, opp1, opp2];
      const inputs = {};
      for (const team of teams) inputs[team.name] = copyTeam(team, warriorsDirectory);
      const zombieInputs = config.zombies.map((zombie) => {
        const source = resolveFromConfig(zombie.path);
        const target = path.join(zombiesDirectory, safeName(zombie.name));
        fs.copyFileSync(source, target);
        return { name: zombie.name, source, target, bytes: fs.statSync(source).size, sha256: sha256(source) };
      });

      const scorePath = path.join(runDirectory, "scores.csv");
      const args = [
        "-jar", jar,
        "--headless",
        "--comboSize", "4",
        "--battlesPerCombo", String(battlesPerPair),
        "--seed", seed,
        "--threads", String(config.threads ?? 4),
        "--warriorsDir", warriorsDirectory,
        "--zombiesDir", zombiesDirectory,
        "--outputFile", scorePath,
      ];
      const startedAt = new Date().toISOString();
      const started = process.hrtime.bigint();
      const stdout = execFileSync(java, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
      const elapsedSeconds = Number(process.hrtime.bigint() - started) / 1e9;
      const rawScoreText = fs.readFileSync(scorePath, "utf8");
      const scores = parseScores(rawScoreText);

      const candANameSafe = safeName(candA.name);
      const candBNameSafe = safeName(candB.name);
      const record = {
        runId,
        cohortId: cohort.id,
        pairIndex,
        opponentPair: [opp1.name, opp2.name],
        seed,
        swap,
        battles: battlesPerPair,
        startedAt,
        elapsedSeconds,
        command: { executable: java, args },
        inputs,
        zombies: zombieInputs,
        scores,
        candidateA: {
          rawName: config.candidateA.name,
          loadedAs: candANameSafe,
          teamRaw: scores.groups[candANameSafe],
          teamPerBattle: scores.groups[candANameSafe] / battlesPerPair,
        },
        candidateB: {
          rawName: config.candidateB.name,
          loadedAs: candBNameSafe,
          teamRaw: scores.groups[candBNameSafe],
          teamPerBattle: scores.groups[candBNameSafe] / battlesPerPair,
        },
        rawScoreText,
        stdout,
      };
      fs.writeFileSync(path.join(runDirectory, "run.json"), `${JSON.stringify(record, null, 2)}\n`, "utf8");
      runs.push(record);
      console.log(`${runId}: ${config.candidateA.name}=${record.candidateA.teamPerBattle.toFixed(6)} ${config.candidateB.name}=${record.candidateB.teamPerBattle.toFixed(6)} (${elapsedSeconds.toFixed(2)}s)`);
    }
  }
}

const totalBattles = runs.reduce((sum, run) => sum + run.battles, 0);
const aggregate = {
  battles: totalBattles,
  candidateA: {
    name: config.candidateA.name,
    teamPerBattle: runs.reduce((sum, run) => sum + run.candidateA.teamRaw, 0) / totalBattles,
  },
  candidateB: {
    name: config.candidateB.name,
    teamPerBattle: runs.reduce((sum, run) => sum + run.candidateB.teamRaw, 0) / totalBattles,
  },
};
const result = {
  schemaVersion: 1,
  experimentId: config.experimentId,
  generatedAt: new Date().toISOString(),
  configPath: configAbsolute,
  configSha256: sha256(configAbsolute),
  engineJar: { path: jar, sha256: sha256(jar) },
  swap,
  aggregate,
  runs,
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(`aggregate: ${config.candidateA.name}=${aggregate.candidateA.teamPerBattle.toFixed(6)} ${config.candidateB.name}=${aggregate.candidateB.teamPerBattle.toFixed(6)} battles=${totalBattles}`);
console.log(`wrote ${outputPath}`);
