import crypto from "node:crypto";
import fs from "node:fs";

const ids = ["a_main", "a_captured", "a_both", "b_main", "ab_main", "all"];
const overrides = new Map(process.argv.slice(2).map((entry) => {
  const separator = entry.indexOf("=");
  if (separator < 1) throw new Error(`expected id=path, got ${entry}`);
  return [entry.slice(0, separator), entry.slice(separator + 1)];
}));
const controlFile = "experiments/codex-goal-20260930/pair/ab-tune.json";
const control = JSON.parse(fs.readFileSync(controlFile, "utf8"));
if (control.runs.length !== 50 || control.aggregate.battles !== 500) throw new Error("control sample mismatch");
const baseline = new Map(control.runs.map((run) => [`${run.cohortId}|${run.seed}`, run.scores.groups.COD_pair / 10]));
if (baseline.size !== 50) throw new Error("control blocks not unique");
const sha = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
for (const id of ids) {
  const config = JSON.parse(fs.readFileSync(`config-codex-goal-phase-xor-${id}-tune-20260930.json`, "utf8"));
  const file = overrides.get(id) ?? config.outputPath;
  if (!fs.existsSync(file)) { console.log(`${id}: pending`); continue; }
  const result = JSON.parse(fs.readFileSync(file, "utf8"));
  if (result.runs.length !== 50 || result.aggregate.battles !== 500 || result.engineJar.sha256 !== control.engineJar.sha256) throw new Error(`${id}: sample/engine mismatch`);
  const expected = config.candidate.warriors.map(sha);
  const differences = [];
  for (const run of result.runs) {
    if (run.battles !== 10 || Object.keys(run.scores.groups).length !== 4) throw new Error(`${id}: protocol mismatch`);
    if (JSON.stringify(run.inputs.COD_pair?.map((entry) => entry.sha256)) !== JSON.stringify(expected)) throw new Error(`${id}: binary hash mismatch`);
    const key = `${run.cohortId}|${run.seed}`;
    if (!baseline.has(key)) throw new Error(`${id}: unmatched block ${key}`);
    differences.push(run.scores.groups.COD_pair / 10 - baseline.get(key));
  }
  const mean = differences.reduce((sum, value) => sum + value, 0) / differences.length;
  const positive = differences.filter((value) => value > 1e-8).length;
  const negative = differences.filter((value) => value < -1e-8).length;
  console.log(`${id}: ${result.aggregate.teamPerBattle.toFixed(6)}, delta ${mean.toFixed(6)}, ${positive} positive/${negative} negative/${50 - positive - negative} tied blocks`);
}
