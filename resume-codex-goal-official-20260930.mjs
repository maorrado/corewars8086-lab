// Resume one of the four interrupted 2026-09-30 official-benchmark suites.
// `plan` is read-only. `run` executes only missing blocks, serially, in NEW paths.
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.dirname(fileURLToPath(import.meta.url));
const officialRunner = path.join(repo, "official-benchmark.mjs");
const requiredJarHash = "31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d";
const allowedConfigs = new Set([
  "config-codex-goal-stackxor-b-holdout-20260930.json",
  "config-codex-goal-phase-xor-a_main-tune-20260930.json",
  "config-codex-goal-phase-xor-a_captured-tune-20260930.json",
  "config-codex-goal-phase-xor-b_main-tune-20260930.json",
]);

function requireThat(ok, message) {
  if (!ok) throw new Error(message);
}
function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
function safeName(value) {
  return value.replace(/[^A-Za-z0-9_.-]/g, "_");
}
function samePath(a, b) {
  return path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
}
function sameValues(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function sameNumber(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-10;
}
function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function parseScores(text) {
  // Deliberately identical to official-benchmark.mjs's CSV parser.
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
function aggregate(runs) {
  // Deliberately identical to official-benchmark.mjs's aggregate calculation.
  const battles = runs.reduce((sum, run) => sum + run.battles, 0);
  return {
    battles,
    teamPerBattle: runs.reduce((sum, run) => sum + run.candidate.teamRaw, 0) / battles,
    warrior1PerBattle: runs.reduce((sum, run) => sum + run.candidate.warrior1Raw, 0) / battles,
    warrior2PerBattle: runs.reduce((sum, run) => sum + run.candidate.warrior2Raw, 0) / battles,
  };
}

const [mode, inputConfig, tag] = process.argv.slice(2);
requireThat(mode === "plan" || mode === "run", "usage: node resume-codex-goal-official-20260930.mjs plan <config.json> | run <config.json> <unique-tag>");
requireThat(inputConfig, "missing config path");
const configPath = path.resolve(inputConfig);
requireThat(path.dirname(configPath).toLowerCase() === repo.toLowerCase() && allowedConfigs.has(path.basename(configPath)), "config is not one of the four approved interrupted suites");
if (mode === "run") requireThat(tag && /^[A-Za-z0-9_-]{1,64}$/.test(tag), "run requires a unique alphanumeric tag (hyphens/underscores allowed)");
const config = readJson(configPath);
const fromConfig = (file) => path.resolve(path.dirname(configPath), file);
const java = fromConfig(config.java ?? "tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe");
const jar = fromConfig(config.jar ?? "repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar");
const originalRoot = fromConfig(config.runDirectory ?? `build/official-runs/${safeName(config.experimentId)}`);
const originalOutput = fromConfig(config.outputPath);
requireThat(fs.existsSync(java) && fs.existsSync(jar) && fs.existsSync(officialRunner), "Java, JAR, or official runner is missing");
requireThat(sha256(jar) === requiredJarHash, `engine JAR hash is not the pinned deterministic v6 hash: ${jar}`);
requireThat(Number.isInteger(config.battles) && config.battles > 0, "invalid battle count");
requireThat(Array.isArray(config.seeds) && config.seeds.length === 2, "expected exactly two configured seeds");
requireThat(Array.isArray(config.cohorts) && config.cohorts.length === 25, "expected exactly 25 configured cohorts");
requireThat(Array.isArray(config.zombies), "missing Zombies");
requireThat(config.candidate?.warriors?.length === 2, "candidate must have two warriors");

function fileSpec(source) {
  const absolute = fromConfig(source);
  requireThat(fs.existsSync(absolute), `missing input binary: ${absolute}`);
  return { source: absolute, bytes: fs.statSync(absolute).size, sha256: sha256(absolute) };
}
const zombies = config.zombies.map((z) => ({ name: z.name, ...fileSpec(z.path) }));
requireThat(new Set(zombies.map((z) => safeName(z.name))).size === zombies.length, "duplicate sanitized Zombie names");
const specs = [];
const ids = new Set();
for (const cohort of config.cohorts) {
  requireThat(cohort?.id && cohort.opponents?.length === 3, `expected a four-team cohort: ${cohort?.id}`);
  const teams = [config.candidate, ...cohort.opponents].map((team) => {
    requireThat(team?.name && team.warriors?.length === 2, `invalid team in ${cohort.id}`);
    return { name: team.name, warriors: team.warriors.map(fileSpec) };
  });
  requireThat(new Set(teams.map((t) => t.name)).size === 4, `duplicate team names in ${cohort.id}`);
  requireThat(new Set(teams.map((t) => safeName(t.name))).size === 4, `duplicate sanitized team names in ${cohort.id}`);
  for (const seed of config.seeds) {
    requireThat(typeof seed === "string" && seed.length > 0, "invalid seed");
    const runId = `${safeName(cohort.id)}__${safeName(seed)}`;
    requireThat(!ids.has(runId), `duplicate run ID after sanitizing: ${runId}`);
    ids.add(runId);
    specs.push({ cohort, seed, runId, teams });
  }
}
requireThat(specs.length === 50, "expected exactly 50 cohort×seed blocks");

function expectedArgs(spec, runDirectory, threads) {
  const warriorsDirectory = path.join(runDirectory, "survivors");
  const zombiesDirectory = path.join(runDirectory, "zombies");
  const scorePath = path.join(runDirectory, "scores.csv");
  const args = [
    "-jar", jar, "--headless", "--comboSize", "4",
    "--battlesPerCombo", String(config.battles), "--seed", spec.seed,
    "--threads", String(threads), "--warriorsDir", warriorsDirectory,
    "--zombiesDir", zombiesDirectory, "--outputFile", scorePath,
  ];
  if (config.parallel === false) args.push("--parallel=false");
  if (config.telemetry) args.push("--telemetryFile", path.join(runDirectory, "telemetry.csv"));
  return args;
}

function validateCopiedFile(actual, expected, target, context) {
  requireThat(actual && samePath(actual.source, expected.source) && samePath(actual.target, target), `${context}: source/target path mismatch`);
  requireThat(actual.bytes === expected.bytes && actual.sha256 === expected.sha256, `${context}: recorded bytes/hash mismatch`);
  requireThat(fs.existsSync(expected.source) && fs.statSync(expected.source).size === expected.bytes && sha256(expected.source) === expected.sha256, `${context}: source changed`);
  requireThat(fs.existsSync(target) && fs.statSync(target).size === expected.bytes && sha256(target) === expected.sha256, `${context}: copied input changed or missing`);
}

function validateRun(record, spec, runDirectory, threads) {
  const context = spec.runId;
  requireThat(record?.runId === context && record.cohortId === spec.cohort.id && record.seed === spec.seed && record.battles === config.battles, `${context}: run identity mismatch`);
  requireThat(record.command && samePath(record.command.executable, java) && sameValues(record.command.args, expectedArgs(spec, runDirectory, threads)), `${context}: Java command/engine/options mismatch`);
  requireThat(Date.parse(record.startedAt) >= fs.statSync(jar).mtimeMs - 1000, `${context}: current pinned JAR has a newer modification time than the run`);
  requireThat(Number.isFinite(record.elapsedSeconds) && record.elapsedSeconds >= 0, `${context}: invalid elapsed time`);
  requireThat(record.inputs && sameValues(Object.keys(record.inputs).sort(), spec.teams.map((t) => t.name).sort()), `${context}: team list mismatch`);
  for (const team of spec.teams) {
    const actual = record.inputs[team.name];
    requireThat(Array.isArray(actual) && actual.length === 2, `${context}: missing warrior inputs for ${team.name}`);
    team.warriors.forEach((warrior, index) => validateCopiedFile(actual[index], warrior,
      path.join(runDirectory, "survivors", `${safeName(team.name)}${index + 1}`), `${context}/${team.name}${index + 1}`));
  }
  requireThat(Array.isArray(record.zombies) && record.zombies.length === zombies.length, `${context}: Zombie list mismatch`);
  zombies.forEach((z, index) => {
    requireThat(record.zombies[index].name === z.name, `${context}: Zombie name/order mismatch`);
    validateCopiedFile(record.zombies[index], z, path.join(runDirectory, "zombies", safeName(z.name)), `${context}/${z.name}`);
  });
  const scorePath = path.join(runDirectory, "scores.csv");
  requireThat(fs.existsSync(scorePath), `${context}: scores.csv is missing`);
  const raw = fs.readFileSync(scorePath, "utf8");
  requireThat(record.rawScoreText === raw, `${context}: raw score text differs from scores.csv`);
  const scores = parseScores(raw);
  requireThat(sameValues(record.scores, scores), `${context}: parsed scores disagree with run.json`);
  const groupNames = spec.teams.map((t) => safeName(t.name)).sort();
  const warriorNames = spec.teams.flatMap((t) => [1, 2].map((i) => `${safeName(t.name)}${i}`)).sort();
  requireThat(sameValues(Object.keys(scores.groups).sort(), groupNames) && sameValues(Object.keys(scores.warriors).sort(), warriorNames), `${context}: score team/warrior list mismatch`);
  requireThat([...Object.values(scores.groups), ...Object.values(scores.warriors)].every(Number.isFinite), `${context}: non-finite score`);
  const candidateName = safeName(config.candidate.name);
  const candidate = {
    teamRaw: scores.groups[candidateName],
    teamPerBattle: scores.groups[candidateName] / config.battles,
    warrior1Raw: scores.warriors[`${candidateName}1`],
    warrior1PerBattle: scores.warriors[`${candidateName}1`] / config.battles,
    warrior2Raw: scores.warriors[`${candidateName}2`],
    warrior2PerBattle: scores.warriors[`${candidateName}2`] / config.battles,
  };
  requireThat(record.candidate && Object.keys(candidate).every((k) => sameNumber(record.candidate[k], candidate[k])), `${context}: candidate scores mismatch`);
  if (config.telemetry) {
    const telemetry = path.join(runDirectory, "telemetry.csv");
    requireThat(record.telemetry && samePath(record.telemetry.path, telemetry) && fs.existsSync(telemetry) && record.telemetry.sha256 === sha256(telemetry), `${context}: telemetry mismatch`);
  } else requireThat(record.telemetry === null, `${context}: unexpected telemetry`);
  requireThat(typeof record.stdout === "string", `${context}: missing Java stdout`);
  return record;
}

function validateUnexpectedRuns(root) {
  if (!fs.existsSync(root)) return;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory() && fs.existsSync(path.join(root, entry.name, "run.json"))) {
      requireThat(ids.has(entry.name), `unexpected completed run outside the 50 configured blocks: ${path.join(root, entry.name)}`);
    }
  }
}

validateUnexpectedRuns(originalRoot);
const existing = new Map();
const missing = [];
for (const spec of specs) {
  const runDirectory = path.join(originalRoot, spec.runId);
  const recordPath = path.join(runDirectory, "run.json");
  if (fs.existsSync(recordPath)) existing.set(spec.runId, validateRun(readJson(recordPath), spec, runDirectory, config.threads ?? 4));
  else missing.push(spec);
}
console.log(`${path.basename(configPath)}: ${existing.size}/50 verified original blocks; ${missing.length} missing`);
if (missing.length) console.log(`missing IDs: ${missing.map((s) => s.runId).join(", ")}`);
if (mode === "plan") {
  if (fs.existsSync(originalOutput)) console.log(`original output already exists (will not overwrite): ${originalOutput}`);
  process.exit(0);
}
requireThat(!fs.existsSync(originalOutput), `original output already exists; refusing resume: ${originalOutput}`);
requireThat(missing.length > 0, "all original blocks are complete; no rerun is needed");

const stem = path.parse(configPath).name;
const resumeRoot = path.join(repo, "build", "official-runs", "codex-goal-20260930", "resume", `${stem}-${tag}`);
const blockRoot = path.join(resumeRoot, "blocks");
const mergedOutput = path.join(repo, "experiments", "codex-goal-20260930", "resume", `${stem}-${tag}.json`);
requireThat(!fs.existsSync(resumeRoot) && !fs.existsSync(mergedOutput), "resume tag already has artifacts; choose a fresh tag to preserve them");
fs.mkdirSync(resumeRoot, { recursive: true });
const reruns = new Map();
for (const spec of missing) {
  // Absolute input paths keep one-block configs correct when they live below resumeRoot.
  const blockConfig = {
    ...config,
    experimentId: `${config.experimentId}-resume-${tag}-${spec.runId}`,
    java, jar,
    outputPath: path.join(resumeRoot, "block-results", `${spec.runId}.json`),
    runDirectory: blockRoot,
    threads: 1,
    seeds: [spec.seed],
    candidate: { ...config.candidate, warriors: config.candidate.warriors.map(fromConfig) },
    cohorts: [{ ...spec.cohort, opponents: spec.cohort.opponents.map((team) => ({ ...team, warriors: team.warriors.map(fromConfig) })) }],
    zombies: config.zombies.map((z) => ({ ...z, path: fromConfig(z.path) })),
  };
  const blockConfigPath = path.join(resumeRoot, "configs", `${spec.runId}.json`);
  fs.mkdirSync(path.dirname(blockConfigPath), { recursive: true });
  fs.writeFileSync(blockConfigPath, `${JSON.stringify(blockConfig, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  console.log(`running missing block ${spec.runId} with one Java thread`);
  execFileSync(process.execPath, [officialRunner, blockConfigPath], { cwd: repo, stdio: "inherit" });
  const blockResult = readJson(blockConfig.outputPath);
  requireThat(blockResult.schemaVersion === 1 && blockResult.runs?.length === 1, `${spec.runId}: incomplete one-block result`);
  requireThat(samePath(blockResult.configPath, blockConfigPath) && blockResult.configSha256 === sha256(blockConfigPath), `${spec.runId}: one-block config hash mismatch`);
  requireThat(samePath(blockResult.engineJar?.path, jar) && blockResult.engineJar.sha256 === requiredJarHash, `${spec.runId}: one-block engine hash mismatch`);
  const runDirectory = path.join(blockRoot, spec.runId);
  const record = validateRun(readJson(path.join(runDirectory, "run.json")), spec, runDirectory, 1);
  requireThat(sameValues(blockResult.runs[0], record) && sameValues(blockResult.aggregate, aggregate([record])), `${spec.runId}: one-block result/run.json mismatch`);
  requireThat(!reruns.has(spec.runId) && !existing.has(spec.runId), `duplicate completed run ID: ${spec.runId}`);
  reruns.set(spec.runId, record);
}

validateUnexpectedRuns(blockRoot);
requireThat(existing.size + reruns.size === specs.length, "merge lacks one or more configured blocks");
requireThat(sha256(jar) === requiredJarHash, "engine JAR changed during resume");
const runs = specs.map((spec) => {
  const fromOriginal = existing.get(spec.runId);
  const runDirectory = fromOriginal ? path.join(originalRoot, spec.runId) : path.join(blockRoot, spec.runId);
  const threads = fromOriginal ? (config.threads ?? 4) : 1;
  return validateRun(readJson(path.join(runDirectory, "run.json")), spec, runDirectory, threads);
});
requireThat(new Set(runs.map((r) => r.runId)).size === 50, "duplicate run IDs in merged result");
const result = {
  schemaVersion: 1,
  experimentId: config.experimentId,
  generatedAt: new Date().toISOString(),
  configPath,
  configSha256: sha256(configPath),
  engineJar: { path: jar, sha256: requiredJarHash },
  aggregate: aggregate(runs),
  runs,
  resume: {
    originalRunDirectory: originalRoot,
    newRunDirectory: blockRoot,
    reusedOriginalBlocks: existing.size,
    rerunBlocks: reruns.size,
    rerunThreads: 1,
    note: "Original run.json files were validated and left unchanged; missing blocks were run serially in new paths.",
  },
};
fs.mkdirSync(path.dirname(mergedOutput), { recursive: true });
fs.writeFileSync(mergedOutput, `${JSON.stringify(result, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
console.log(`wrote ${mergedOutput}; battles=${result.aggregate.battles}, team=${result.aggregate.teamPerBattle.toFixed(6)}`);
