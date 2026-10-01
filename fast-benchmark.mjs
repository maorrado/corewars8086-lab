// Fast drop-in for official-benchmark.mjs: same config format, same run preparation,
// same result schema -- but every run of every given config executes as a job of ONE
// BatchRunner JVM (repos/corewars8086-6.0.0-fast), sharing one thread pool.
//
// Each job's scores are byte-identical to the original engine run with --parallel=false
// on the same inputs (verified in build/speedup; see study-notes/night-session/SPEEDUP-2026-10-01.md).
// --spot-check N re-runs N evenly spaced runs with the ORIGINAL engine (--parallel=false)
// after the batch and aborts if any score file differs by a single byte.
//
// --java PATH / --jvm-opts "OPTS": JVM for the batch only (default: the config's Java 8). Spot checks
// always use the original engine on the config's Java 8 (the reference).
// Usage: node fast-benchmark.mjs [--threads N] [--spot-check N] [--java PATH] [--jvm-opts "OPTS"] <config.json> [...]
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const LAB = path.dirname(path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")));
const DEFAULT_JAVA = "tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe";
const ORIGINAL_JAR = path.join(LAB, "repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar");
const FAST_JAR = path.join(LAB, "repos/corewars8086-6.0.0-fast/target/corewars8086-6.0.0-jar-with-dependencies.jar");
const BATCH_MAIN = "il.co.codeguru.corewars8086.cli.BatchRunner";

let threads = 8;
let spotCheck = 0;
let batchJavaOverride = null;
let jvmOpts = [];
const configPaths = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--threads") threads = Number(argv[++i]);
  else if (argv[i] === "--spot-check") spotCheck = Number(argv[++i]);
  else if (argv[i] === "--java") batchJavaOverride = path.resolve(argv[++i]);
  else if (argv[i] === "--jvm-opts") jvmOpts = argv[++i].split(" ").filter(Boolean);
  else configPaths.push(argv[i]);
}
if (configPaths.length === 0) throw new Error("usage: node fast-benchmark.mjs [--threads N] [--spot-check N] <config.json> [...]");
if (!Number.isInteger(threads) || threads < 1) throw new Error("--threads must be a positive integer");

// Each source file is hashed once per harness run (the same opponents and zombies appear in
// hundreds of runs; re-hashing them was most of the preparation time).
const hashCache = new Map();
const sha256 = (file) => {
  if (!hashCache.has(file)) hashCache.set(file, crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"));
  return hashCache.get(file);
};
const safeName = (value) => value.replace(/[^A-Za-z0-9_.-]/g, "_");

// identical to official-benchmark.mjs
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

// ---- prepare every run of every config exactly as official-benchmark.mjs does ----
const experiments = [];
const jobs = []; // { experiment, runId, cohort, seed, runDirectory, scorePath, jobArgs, inputs, zombieInputs }
let java = null;
for (const configPath of configPaths) {
  const configAbsolute = path.resolve(configPath);
  const root = path.dirname(configAbsolute);
  const config = JSON.parse(fs.readFileSync(configAbsolute, "utf8"));
  const resolveFromConfig = (file) => path.resolve(root, file);

  const configJava = resolveFromConfig(config.java ?? DEFAULT_JAVA);
  if (java !== null && java !== configJava) throw new Error("all configs of one batch must use the same java");
  java = configJava;
  if (config.jar && resolveFromConfig(config.jar) !== ORIGINAL_JAR) {
    throw new Error(`${configPath}: uses a non-default engine jar (${config.jar}); the fast runner only reproduces the original engine`);
  }
  if (config.telemetry) throw new Error(`${configPath}: telemetry is not supported by the fast runner`);

  const outputPath = resolveFromConfig(config.outputPath);
  const runRoot = resolveFromConfig(config.runDirectory ?? `build/fast-runs/${safeName(config.experimentId)}`);
  const battles = config.battles;
  if (!Number.isInteger(battles) || battles < 1) throw new Error("config.battles must be a positive integer");
  if (!config.candidate?.warriors || config.candidate.warriors.length !== 2) throw new Error("candidate must contain exactly two warriors");

  const copyTeam = (team, destination) => {
    if (!team.warriors || team.warriors.length !== 2) throw new Error(`${team.name} must contain exactly two warriors`);
    const files = [];
    team.warriors.forEach((warrior, index) => {
      const source = resolveFromConfig(warrior);
      const target = path.join(destination, `${safeName(team.name)}${index + 1}`);
      fs.copyFileSync(source, target);
      files.push({ source, target, bytes: fs.statSync(source).size, sha256: sha256(source) });
    });
    return files;
  };

  if (experiments.some((e) => e.runRoot === runRoot || e.outputPath === outputPath)) {
    throw new Error(`${configPath}: run directory or output path collides with another config of this batch`);
  }
  const experiment = { configAbsolute, config, outputPath, runRoot, battles, jobs: [] };
  experiments.push(experiment);
  // Input directories are shared: one zombies directory per config and one survivors
  // directory per cohort, used by all of that cohort's seeds (their contents are identical;
  // official-benchmark.mjs copies them again for every seed). The engine only reads them;
  // its one modification (WarriorRepository.fixFiles: rename *.bin, delete names with '.')
  // gives the same result when repeated, and all jobs are loaded before any war runs.
  const zombiesDirectory = path.join(runRoot, "_inputs", "zombies");
  fs.rmSync(zombiesDirectory, { recursive: true, force: true }); // no stale zombies from older runs
  fs.mkdirSync(zombiesDirectory, { recursive: true });
  const zombieInputs = config.zombies.map((zombie) => {
    const source = resolveFromConfig(zombie.path);
    const target = path.join(zombiesDirectory, safeName(zombie.name));
    fs.copyFileSync(source, target);
    return { name: zombie.name, source, target, bytes: fs.statSync(source).size, sha256: sha256(source) };
  });
  for (const cohort of config.cohorts) {
    if (cohort.opponents.length !== 3) throw new Error(`${cohort.id} must contain exactly three opponents`);
    const warriorsDirectory = path.join(runRoot, "_inputs", safeName(cohort.id), "survivors");
    fs.rmSync(warriorsDirectory, { recursive: true, force: true }); // exactly this cohort's files
    fs.mkdirSync(warriorsDirectory, { recursive: true });
    const teams = [config.candidate, ...cohort.opponents];
    const inputs = {};
    for (const team of teams) inputs[team.name] = copyTeam(team, warriorsDirectory);
    for (const seed of config.seeds) {
      const runId = `${safeName(cohort.id)}__${safeName(seed)}`;
      const runDirectory = path.join(runRoot, runId);
      fs.mkdirSync(runDirectory, { recursive: true });

      const scorePath = path.join(runDirectory, "scores.csv");
      if (fs.existsSync(scorePath)) fs.unlinkSync(scorePath); // a failed job must not leave a stale file behind
      const jobArgs = [
        "--headless",
        "--comboSize", "4",
        "--battlesPerCombo", String(battles),
        "--seed", seed,
        "--warriorsDir", warriorsDirectory,
        "--zombiesDir", zombiesDirectory,
        "--outputFile", scorePath,
      ];
      const job = { experiment, runId, cohort, seed, runDirectory, scorePath, jobArgs, inputs, zombieInputs, index: jobs.length };
      jobs.push(job);
      experiment.jobs.push(job);
    }
  }
}

// ---- one JVM for everything ----
const batchDirectory = path.join(LAB, "build/fast-runs");
fs.mkdirSync(batchDirectory, { recursive: true });
const jobsFile = path.join(batchDirectory, `jobs-${process.pid}.tsv`);
fs.writeFileSync(jobsFile, jobs.map((job) => job.jobArgs.join("\t")).join("\n") + "\n", "utf8");
const batchJava = batchJavaOverride ?? java;
const batchArgs = [...jvmOpts, "-cp", FAST_JAR, BATCH_MAIN, jobsFile, String(threads)];
console.log(`fast-benchmark: ${experiments.length} config(s), ${jobs.length} runs, ${threads} threads, ${batchJava} ${jvmOpts.join(" ")}`);
const batchStartedAt = new Date().toISOString();
const started = process.hrtime.bigint();
execFileSync(batchJava, batchArgs, { stdio: ["ignore", "ignore", "inherit"], maxBuffer: 64 * 1024 * 1024 });
const batchSeconds = Number(process.hrtime.bigint() - started) / 1e9;
fs.unlinkSync(jobsFile);
console.log(`batch finished in ${batchSeconds.toFixed(2)}s`);

// ---- optional spot check against the original engine ----
const spotChecked = [];
if (spotCheck > 0) {
  const count = Math.min(spotCheck, jobs.length);
  for (let k = 0; k < count; k++) {
    const job = jobs[Math.floor((k + 0.5) * jobs.length / count)];
    const checkPath = path.join(job.runDirectory, "spot-check-original.csv");
    const args = ["-jar", ORIGINAL_JAR, ...job.jobArgs.slice(0, -1), checkPath, "--parallel=false"];
    execFileSync(java, args, { stdio: "ignore" });
    const same = fs.readFileSync(checkPath).equals(fs.readFileSync(job.scorePath));
    fs.unlinkSync(checkPath);
    if (!same) throw new Error(`SPOT CHECK FAILED: ${job.runId} differs from the original engine`);
    spotChecked.push(job.runId);
  }
  console.log(`spot check: ${spotChecked.length} run(s) byte-identical to the original engine (--parallel=false)`);
}

// ---- results, in the official schema ----
const totalBattles = jobs.reduce((sum, job) => sum + job.experiment.battles, 0);
const engineJar = { path: FAST_JAR, sha256: sha256(FAST_JAR) };
for (const experiment of experiments) {
  const { config, battles } = experiment;
  const runs = [];
  for (const job of experiment.jobs) {
    const rawScoreText = fs.readFileSync(job.scorePath, "utf8");
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
    if (![candidate.teamRaw, candidate.warrior1Raw, candidate.warrior2Raw].every(Number.isFinite)) {
      throw new Error(`${job.runId}: candidate scores missing from ${job.scorePath}`);
    }
    const record = {
      runId: job.runId,
      cohortId: job.cohort.id,
      seed: job.seed,
      battles,
      startedAt: batchStartedAt,
      elapsedSeconds: batchSeconds * battles / totalBattles,
      elapsedSecondsKind: "amortized share of one BatchRunner JVM",
      command: { executable: batchJava, args: batchArgs, jobIndex: job.index, jobArgs: job.jobArgs },
      inputs: job.inputs,
      zombies: job.zombieInputs,
      scores,
      candidate,
      telemetry: null,
      rawScoreText,
      stdout: `BatchRunner job ${job.index}`,
    };
    fs.writeFileSync(path.join(job.runDirectory, "run.json"), `${JSON.stringify(record, null, 2)}\n`, "utf8");
    runs.push(record);
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
    configPath: experiment.configAbsolute,
    configSha256: sha256(experiment.configAbsolute),
    engineJar,
    engine: {
      runner: "fast-benchmark.mjs / BatchRunner (one JVM, shared pool)",
      semantics: "byte-identical to the original engine with --parallel=false",
      threads,
      java: batchJava,
      jvmOpts,
      referenceJava: java,
      batchSeconds,
      batchRuns: jobs.length,
      batchConfigs: experiments.length,
      spotChecked,
    },
    aggregate,
    runs,
  };
  fs.mkdirSync(path.dirname(experiment.outputPath), { recursive: true });
  fs.writeFileSync(experiment.outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(`${config.experimentId}: team=${aggregate.teamPerBattle.toFixed(6)}, w1=${aggregate.warrior1PerBattle.toFixed(6)}, w2=${aggregate.warrior2PerBattle.toFixed(6)}, battles=${aggregate.battles} -> ${experiment.outputPath}`);
}
