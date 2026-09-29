import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Round-robin tournament: every pair of teams fights together against a
// rotating pair of real-2025 filler opponents (comboSize=4 is fixed by the
// engine), giving a head-to-head signal for every team pair.
//
// Usage: node tournament-benchmark.mjs <config.json>
// Config: { experimentId, outputPath, runDirectory, battlesPerPair,
//   threads, seeds[], teams: [{name, warriors:[a,b]}, ...],
//   fillerCohorts: [{opponents:[{name,warriors},{name,warriors}]}, ...],
//   zombies: [...] }
// fillerCohorts rotate across team-pairs (pair index mod fillerCohorts.length).

const configPath = process.argv[2];
if (!configPath) throw new Error("usage: node tournament-benchmark.mjs <config.json>");

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

const teams = config.teams;
const fillerCohorts = config.fillerCohorts;
const pairs = [];
for (let i = 0; i < teams.length; i++) {
  for (let j = i + 1; j < teams.length; j++) {
    pairs.push([teams[i], teams[j]]);
  }
}

const runs = [];
for (let pairIdx = 0; pairIdx < pairs.length; pairIdx++) {
  const [teamA, teamB] = pairs[pairIdx];
  const filler = fillerCohorts[pairIdx % fillerCohorts.length];
  const [oppX, oppY] = filler.opponents;

  for (const seed of config.seeds) {
    const runId = `${safeName(teamA.name)}_vs_${safeName(teamB.name)}__${safeName(seed)}`;
    const runDirectory = path.join(runRoot, runId);
    const warriorsDirectory = path.join(runDirectory, "survivors");
    const zombiesDirectory = path.join(runDirectory, "zombies");
    fs.mkdirSync(warriorsDirectory, { recursive: true });
    fs.mkdirSync(zombiesDirectory, { recursive: true });

    const battleTeams = [teamA, teamB, oppX, oppY];
    const inputs = {};
    for (const team of battleTeams) inputs[team.name] = copyTeam(team, warriorsDirectory);
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

    const teamANameSafe = safeName(teamA.name);
    const teamBNameSafe = safeName(teamB.name);
    const record = {
      runId,
      pairIndex: pairIdx,
      fillerOpponents: [oppX.name, oppY.name],
      seed,
      battles: battlesPerPair,
      startedAt,
      elapsedSeconds,
      inputs,
      zombies: zombieInputs,
      scores,
      teamA: { name: teamA.name, teamRaw: scores.groups[teamANameSafe], teamPerBattle: scores.groups[teamANameSafe] / battlesPerPair },
      teamB: { name: teamB.name, teamRaw: scores.groups[teamBNameSafe], teamPerBattle: scores.groups[teamBNameSafe] / battlesPerPair },
      rawScoreText,
      stdout,
    };
    fs.writeFileSync(path.join(runDirectory, "run.json"), `${JSON.stringify(record, null, 2)}\n`, "utf8");
    runs.push(record);
    console.log(`[${pairIdx + 1}/${pairs.length}] ${runId}: ${teamA.name}=${record.teamA.teamPerBattle.toFixed(4)} ${teamB.name}=${record.teamB.teamPerBattle.toFixed(4)} (${elapsedSeconds.toFixed(2)}s)`);
  }
}

// Aggregate per-team standings: sum of head-to-head wins/losses/ties across all pairings
const standings = {};
for (const team of teams) standings[team.name] = { wins: 0, losses: 0, ties: 0, totalScore: 0, totalBattles: 0 };
for (const run of runs) {
  const diff = run.teamA.teamPerBattle - run.teamB.teamPerBattle;
  if (Math.abs(diff) < 1e-6) {
    standings[run.teamA.name].ties++;
    standings[run.teamB.name].ties++;
  } else if (diff > 0) {
    standings[run.teamA.name].wins++;
    standings[run.teamB.name].losses++;
  } else {
    standings[run.teamA.name].losses++;
    standings[run.teamB.name].wins++;
  }
  standings[run.teamA.name].totalScore += run.teamA.teamRaw;
  standings[run.teamA.name].totalBattles += run.battles;
  standings[run.teamB.name].totalScore += run.teamB.teamRaw;
  standings[run.teamB.name].totalBattles += run.battles;
}
for (const name of Object.keys(standings)) {
  standings[name].meanScore = standings[name].totalScore / standings[name].totalBattles;
}

const result = {
  schemaVersion: 1,
  experimentId: config.experimentId,
  generatedAt: new Date().toISOString(),
  configPath: configAbsolute,
  configSha256: sha256(configAbsolute),
  engineJar: { path: jar, sha256: sha256(jar) },
  standings,
  runs,
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

console.log("\nFinal standings (by head-to-head win count):");
const ranked = Object.entries(standings).sort((a, b) => b[1].wins - a[1].wins || b[1].meanScore - a[1].meanScore);
for (const [name, s] of ranked) {
  console.log(`  ${name.padEnd(20)} W=${s.wins} L=${s.losses} T=${s.ties}  meanScore=${s.meanScore.toFixed(4)}`);
}
console.log(`\nwrote ${outputPath}`);
