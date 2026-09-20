import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const configPath = process.argv[2];
if (!configPath) throw new Error("usage: node official-benchmark.mjs <config.json>");

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
const battles = config.battles;
if (!Number.isInteger(battles) || battles < 1) throw new Error("config.battles must be a positive integer");
if (!config.candidate?.warriors || config.candidate.warriors.length !== 2) throw new Error("candidate must contain exactly two warriors");

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

const runs = [];
for (const cohort of config.cohorts) {
  if (cohort.opponents.length !== 3) throw new Error(`${cohort.id} must contain exactly three opponents`);
  for (const seed of config.seeds) {
    const runId = `${safeName(cohort.id)}__${safeName(seed)}`;
    const runDirectory = path.join(runRoot, runId);
    const warriorsDirectory = path.join(runDirectory, "survivors");
    const zombiesDirectory = path.join(runDirectory, "zombies");
    fs.mkdirSync(warriorsDirectory, { recursive: true });
    fs.mkdirSync(zombiesDirectory, { recursive: true });

    const teams = [config.candidate, ...cohort.opponents];
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
      "--battlesPerCombo", String(battles),
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
    const candidateName = safeName(config.candidate.name);
    const candidate = {
      teamRaw: scores.groups[candidateName],
      teamPerBattle: scores.groups[candidateName] / battles,
      warrior1Raw: scores.warriors[`${candidateName}1`],
      warrior1PerBattle: scores.warriors[`${candidateName}1`] / battles,
      warrior2Raw: scores.warriors[`${candidateName}2`],
      warrior2PerBattle: scores.warriors[`${candidateName}2`] / battles,
    };
    const record = {
      runId,
      cohortId: cohort.id,
      seed,
      battles,
      startedAt,
      elapsedSeconds,
      command: { executable: java, args },
      inputs,
      zombies: zombieInputs,
      scores,
      candidate,
      rawScoreText,
      stdout,
    };
    fs.writeFileSync(path.join(runDirectory, "run.json"), `${JSON.stringify(record, null, 2)}\n`, "utf8");
    runs.push(record);
    console.log(`${runId}: team=${candidate.teamPerBattle.toFixed(6)}, w1=${candidate.warrior1PerBattle.toFixed(6)}, w2=${candidate.warrior2PerBattle.toFixed(6)} (${elapsedSeconds.toFixed(2)}s)`);
  }
}

const aggregate = {
  battles: runs.reduce((sum, run) => sum + run.battles, 0),
  teamPerBattle: runs.reduce((sum, run) => sum + run.candidate.teamRaw, 0) / runs.reduce((sum, run) => sum + run.battles, 0),
  warrior1PerBattle: runs.reduce((sum, run) => sum + run.candidate.warrior1Raw, 0) / runs.reduce((sum, run) => sum + run.battles, 0),
  warrior2PerBattle: runs.reduce((sum, run) => sum + run.candidate.warrior2Raw, 0) / runs.reduce((sum, run) => sum + run.battles, 0),
};
const result = {
  schemaVersion: 1,
  experimentId: config.experimentId,
  generatedAt: new Date().toISOString(),
  configPath: configAbsolute,
  configSha256: sha256(configAbsolute),
  engineJar: { path: jar, sha256: sha256(jar) },
  aggregate,
  runs,
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(`aggregate: team=${aggregate.teamPerBattle.toFixed(6)}, w1=${aggregate.warrior1PerBattle.toFixed(6)}, w2=${aggregate.warrior2PerBattle.toFixed(6)}, battles=${aggregate.battles}`);
console.log(`wrote ${outputPath}`);
