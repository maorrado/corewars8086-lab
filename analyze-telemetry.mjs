import fs from "node:fs";
import path from "node:path";

const [inputPath, candidateGroup, outputPath] = process.argv.slice(2);
if (!inputPath || !candidateGroup) {
  throw new Error("usage: node analyze-telemetry.mjs <telemetry.csv> <candidate-group> [output.json]");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const headers = rows.shift();
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

const number = (value) => value === "" ? null : Number(value);
const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const round6 = (value) => value === null ? null : Number(value.toFixed(6));

const rows = parseCsv(fs.readFileSync(inputPath, "utf8")).map((row) => ({
  ...row,
  war: number(row.war),
  seed: number(row.seed),
  endRound: number(row.endRound),
  endReason: number(row.endReason),
  loadOffset: number(row.loadOffset),
  alive: row.alive === "true",
  deathRound: number(row.deathRound),
  cs: number(row.cs),
  ip: number(row.ip),
  energy: number(row.energy),
}));

const candidateRows = rows.filter((row) => row.group === candidateGroup);
if (!candidateRows.length) throw new Error(`candidate group not found: ${candidateGroup}`);
const wars = new Map();
for (const row of candidateRows) {
  if (!wars.has(row.war)) wars.set(row.war, []);
  wars.get(row.war).push(row);
}

function summarizeWarrior(nameRows) {
  const deaths = nameRows.filter((row) => row.deathRound !== null);
  const deathRounds = deaths.map((row) => row.deathRound);
  return {
    starts: nameRows.length,
    alive: nameRows.filter((row) => row.alive).length,
    survivalRate: round6(mean(nameRows.map((row) => row.alive ? 1 : 0))),
    cpuDeaths: deaths.filter((row) => row.deathReason === "CPU exception").length,
    memoryDeaths: deaths.filter((row) => row.deathReason === "memory exception").length,
    meanDeathRound: round6(mean(deathRounds)),
    medianDeathRound: median(deathRounds),
    p90DeathRound: deathRounds.length ? [...deathRounds].sort((a, b) => a - b)[Math.floor((deathRounds.length - 1) * 0.9)] : null,
    arenaCsAlive: nameRows.filter((row) => row.alive && row.cs === 0x1000).length,
    shiftedCsAlive: nameRows.filter((row) => row.alive && row.cs !== 0x1000).length,
  };
}

const warriorNames = [...new Set(candidateRows.map((row) => row.name))].sort();
const warriorSummary = Object.fromEntries(warriorNames.map((name) => [name, summarizeWarrior(candidateRows.filter((row) => row.name === name))]));
const pairOutcomes = { bothAlive: 0, onlyFirst: 0, onlySecond: 0, neitherAlive: 0 };
for (const warRows of wars.values()) {
  const ordered = [...warRows].sort((a, b) => a.name.localeCompare(b.name));
  const first = ordered[0]?.alive ?? false;
  const second = ordered[1]?.alive ?? false;
  if (first && second) pairOutcomes.bothAlive++;
  else if (first) pairOutcomes.onlyFirst++;
  else if (second) pairOutcomes.onlySecond++;
  else pairOutcomes.neitherAlive++;
}

const loadBands = {};
for (const row of candidateRows) {
  const band = `0x${(row.loadOffset >>> 12).toString(16).toUpperCase()}000`;
  loadBands[band] ??= { starts: 0, alive: 0, deathRounds: [] };
  loadBands[band].starts++;
  if (row.alive) loadBands[band].alive++;
  if (row.deathRound !== null) loadBands[band].deathRounds.push(row.deathRound);
}
for (const band of Object.values(loadBands)) {
  band.survivalRate = round6(band.alive / band.starts);
  band.meanDeathRound = round6(mean(band.deathRounds));
  delete band.deathRounds;
}

const result = {
  schemaVersion: 1,
  input: path.resolve(inputPath),
  candidateGroup,
  wars: wars.size,
  pairOutcomes,
  warriors: warriorSummary,
  loadBands,
};
const json = `${JSON.stringify(result, null, 2)}\n`;
if (outputPath) fs.writeFileSync(outputPath, json, "utf8");
process.stdout.write(json);
