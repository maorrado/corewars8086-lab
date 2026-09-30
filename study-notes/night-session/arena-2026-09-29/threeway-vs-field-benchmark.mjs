import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Three fixed teams share every single battle together, with a rotating 4th
// slot filled by real 2025 opponents (comboSize=4 is fixed by the engine).
// Unlike tournament-benchmark.mjs (which isolates pairwise head-to-head
// signal using fixed filler opponents), this puts all three fixed teams in
// the SAME room for every battle, against a genuinely varied real field --
// closer to what an actual multi-round final against the real competitor
// pool looks like.
//
// Usage: node threeway-vs-field-benchmark.mjs <config.json>
// Config: { experimentId, outputPath, runDirectory, battlesPerOpponent,
//   threads, seeds[], teams: [{name, warriors:[a,b]}, ...] (exactly 3),
//   opponents: [{name, warriors:[a,b]}, ...] (the real field, rotates one
//   per battle-run), zombies: [...] }

const configPath = process.argv[2];
if (!configPath) throw new Error("usage: node threeway-vs-field-benchmark.mjs <config.json>");

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
const battlesPerOpponent = config.battlesPerOpponent;
if (!Number.isInteger(battlesPerOpponent) || battlesPerOpponent < 1) throw new Error("config.battlesPerOpponent must be a positive integer");
if (!config.teams || config.teams.length !== 3) throw new Error("config.teams must contain exactly three fixed teams");

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

const fixedTeams = config.teams;
const opponents = config.opponents;
const seeds = config.seeds;

const runs = [];
let runIndex = 0;
for (const opponent of opponents) {
  for (const seed of seeds) {
    runIndex++;
    const runId = `vsField__${safeName(opponent.name)}__${safeName(seed)}`;
    const runDirectory = path.join(runRoot, runId);
    const warriorsDirectory = path.join(runDirectory, "survivors");
    const zombiesDirectory = path.join(runDirectory, "zombies");
    fs.mkdirSync(warriorsDirectory, { recursive: true });
    fs.mkdirSync(zombiesDirectory, { recursive: true });

    const battleTeams = [...fixedTeams, opponent];
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
      "--battlesPerCombo", String(battlesPerOpponent),
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

    const teamResults = {};
    for (const team of battleTeams) {
      const nameSafe = safeName(team.name);
      teamResults[team.name] = {
        teamRaw: scores.groups[nameSafe],
        teamPerBattle: scores.groups[nameSafe] / battlesPerOpponent,
      };
    }

    const record = {
      runId,
      opponent: opponent.name,
      seed,
      battles: battlesPerOpponent,
      startedAt,
      elapsedSeconds,
      inputs,
      zombies: zombieInputs,
      scores,
      teamResults,
      rawScoreText,
      stdout,
    };
    fs.writeFileSync(path.join(runDirectory, "run.json"), `${JSON.stringify(record, null, 2)}\n`, "utf8");
    runs.push(record);
    const summary = fixedTeams.map((t) => `${t.name}=${teamResults[t.name].teamPerBattle.toFixed(4)}`).join(" ");
    console.log(`[${runIndex}/${opponents.length * seeds.length}] vs ${opponent.name}: ${summary} (${elapsedSeconds.toFixed(2)}s)`);
  }
}

// Aggregate standings for the 3 fixed teams across every single battle run.
const standings = {};
for (const team of fixedTeams) standings[team.name] = { totalScore: 0, totalBattles: 0, wins: 0, losses: 0, ties: 0 };
for (const run of runs) {
  const scoresThisRun = fixedTeams.map((t) => ({ name: t.name, perBattle: run.teamResults[t.name].teamPerBattle }));
  const best = Math.max(...scoresThisRun.map((s) => s.perBattle));
  for (const s of scoresThisRun) {
    standings[s.name].totalScore += run.teamResults[s.name].teamRaw;
    standings[s.name].totalBattles += run.battles;
    if (Math.abs(s.perBattle - best) < 1e-6) standings[s.name].wins++;
    else standings[s.name].losses++;
  }
}
for (const name of Object.keys(standings)) {
  standings[name].meanScore = standings[name].totalScore / standings[name].totalBattles;
}

const totalBattles = runs.reduce((sum, r) => sum + r.battles, 0);
const result = {
  schemaVersion: 1,
  experimentId: config.experimentId,
  generatedAt: new Date().toISOString(),
  configPath: configAbsolute,
  configSha256: sha256(configAbsolute),
  engineJar: { path: jar, sha256: sha256(jar) },
  totalBattles,
  standings,
  runs,
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

console.log(`\nTotal battles: ${totalBattles}`);
console.log("Final standings (by best-of-3-per-battle win count, i.e. who scored highest among the 3 fixed teams most often):");
const ranked = Object.entries(standings).sort((a, b) => b[1].wins - a[1].wins || b[1].meanScore - a[1].meanScore);
for (const [name, s] of ranked) {
  console.log(`  ${name.padEnd(20)} bestOfRun=${s.wins} notBest=${s.losses}  meanScore=${s.meanScore.toFixed(4)}`);
}
console.log(`\nwrote ${outputPath}`);
