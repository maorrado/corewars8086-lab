import crypto from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = path.resolve(import.meta.dirname);
const buildRoot = path.join(root, "build");
const screenId = process.env.SCREEN_ID ?? "partner-screen";
const outputRoot = path.join(buildRoot, `m050-${screenId}`);
const java = path.join(root, "tools", "temurin8-jre", "jdk8u504-b01-jre", "bin", "java.exe");
const jar = path.join(root, "repos", "corewars8086-6.0.0-deterministic", "target", "corewars8086-6.0.0-jar-with-dependencies.jar");
const template = JSON.parse(fs.readFileSync(path.join(root, "config-2025-tune-template.json"), "utf8"));
const finalA = path.resolve(root, process.env.BASE_A ?? path.join("build", "final", "ChimeraA"));
const finalB = path.join(root, "build", "final", "ChimeraB");
const partnerSlot = (process.env.PARTNER_SLOT ?? "B").toUpperCase();
if (!new Set(["A", "B"]).has(partnerSlot)) throw new Error("PARTNER_SLOT must be A or B");
const battles = Number(process.env.BATTLES ?? 12);
const concurrency = Number(process.env.CONCURRENCY ?? Math.min(4, os.cpus().length));
const limit = Number(process.env.LIMIT ?? 0);

const allowedTopLevel = [
  /^ab50-parameter-sweep$/,
  /^candidates$/,
  /^chimera-adaptive$/,
  /^final-recheck$/,
  /^phoenix-motion-sweep$/,
  /^phoenix-parameter-sweep$/,
  /^quantized-phoenix-sweep$/,
  /^sweep-/,
  /^v\d/,
];

const selectedCohorts = ["tune-v1-06", "tune-v1-17", "tune-v1-08"].map((id, index) => {
  const cohort = template.cohorts.find((value) => value.id === id);
  if (!cohort) throw new Error(`missing cohort ${id}`);
  return { ...cohort, seed: `m050-${screenId}-${String(index + 1).padStart(2, "0")}` };
});

const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const safeName = (value) => value.replace(/[^A-Za-z0-9_.-]/g, "_");

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(file));
    else files.push(file);
  }
  return files;
}

const finalHashes = new Set([sha256(finalA), sha256(finalB)]);
const byHash = new Map();
for (const file of walk(buildRoot)) {
  const relative = path.relative(buildRoot, file);
  const [topLevel] = relative.split(path.sep);
  if (!allowedTopLevel.some((pattern) => pattern.test(topLevel))) continue;
  const stat = fs.statSync(file);
  if (stat.size < 1 || stat.size > 256 || path.extname(file)) continue;
  const hash = sha256(file);
  if (finalHashes.has(hash)) continue;
  if (!byHash.has(hash)) byHash.set(hash, { hash, file, bytes: stat.size, aliases: [] });
  byHash.get(hash).aliases.push(relative.replaceAll("\\", "/"));
}

let candidates = [...byHash.values()].sort((a, b) => a.aliases[0].localeCompare(b.aliases[0]));
if (limit > 0) candidates = candidates.slice(0, limit);

function parseScores(text) {
  const groups = {};
  let inGroups = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "Groups:") { inGroups = true; continue; }
    if (line === "Warriors:") break;
    if (!inGroups || !line) continue;
    const separator = line.lastIndexOf(",");
    groups[line.slice(0, separator)] = Number(line.slice(separator + 1));
  }
  return groups;
}

function copyTeam(team, directory) {
  team.warriors.forEach((warrior, index) => {
    fs.copyFileSync(warrior, path.join(directory, `${safeName(team.name)}${index + 1}`));
  });
}

async function runOne(id, partner, cohort) {
  const runDirectory = path.join(outputRoot, safeName(id), cohort.id);
  const survivors = path.join(runDirectory, "survivors");
  const zombies = path.join(runDirectory, "zombies");
  fs.mkdirSync(survivors, { recursive: true });
  fs.mkdirSync(zombies, { recursive: true });

  const warriors = partnerSlot === "A" ? [partner, finalB] : [finalA, partner];
  copyTeam({ name: "COD", warriors }, survivors);
  for (const opponent of cohort.opponents) {
    copyTeam({
      name: opponent.name,
      warriors: opponent.warriors.map((file) => path.resolve(root, file)),
    }, survivors);
  }
  for (const zombie of template.zombies) {
    fs.copyFileSync(path.resolve(root, zombie.path), path.join(zombies, safeName(zombie.name)));
  }

  const scorePath = path.join(runDirectory, "scores.csv");
  const args = [
    "-jar", jar,
    "--headless",
    "--comboSize", "4",
    "--battlesPerCombo", String(battles),
    "--seed", cohort.seed,
    "--threads", "2",
    "--warriorsDir", survivors,
    "--zombiesDir", zombies,
    "--outputFile", scorePath,
  ];
  await execFileAsync(java, args, { maxBuffer: 16 * 1024 * 1024 });
  const groups = parseScores(fs.readFileSync(scorePath, "utf8"));
  return groups.COD / battles;
}

async function mapConcurrent(items, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function consume() {
    while (true) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, consume));
  return results;
}

fs.mkdirSync(outputRoot, { recursive: true });
console.log(`screening ${candidates.length} unique partner binaries at ${battles} battles x ${selectedCohorts.length} cohorts`);

const controls = {};
for (const cohort of selectedCohorts) {
  controls[cohort.id] = await runOne("m049-control", partnerSlot === "A" ? finalA : finalB, cohort);
}
const controlMean = Object.values(controls).reduce((sum, value) => sum + value, 0) / selectedCohorts.length;
console.log(`control=${controlMean.toFixed(6)} ${JSON.stringify(controls)}`);

let completed = 0;
const results = await mapConcurrent(candidates, async (candidate) => {
  const scores = {};
  for (const cohort of selectedCohorts) {
    scores[cohort.id] = await runOne(candidate.hash.slice(0, 12), candidate.file, cohort);
  }
  const mean = Object.values(scores).reduce((sum, value) => sum + value, 0) / selectedCohorts.length;
  completed += 1;
  if (completed % 10 === 0 || completed === candidates.length) {
    console.log(`completed ${completed}/${candidates.length}`);
  }
  return {
    ...candidate,
    file: path.relative(root, candidate.file).replaceAll("\\", "/"),
    scores,
    mean,
    delta: mean - controlMean,
  };
});
results.sort((a, b) => b.delta - a.delta);

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  protocol: { battles, concurrency, cohorts: selectedCohorts.map(({ id, seed }) => ({ id, seed })) },
  control: { warriors: [path.relative(root, finalA), path.relative(root, finalB)], partnerSlot, scores: controls, mean: controlMean },
  candidateCount: results.length,
  results,
};
const outputPath = path.join(root, "experiments", "m050-search", `${screenId}.json`);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log("top candidates:");
for (const result of results.slice(0, 20)) {
  console.log(`${result.delta >= 0 ? "+" : ""}${result.delta.toFixed(6)} mean=${result.mean.toFixed(6)} ${result.file}`);
}
console.log(`wrote ${outputPath}`);
