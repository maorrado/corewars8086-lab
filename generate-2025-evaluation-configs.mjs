import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const divisions = [
  { prefix: "A", directory: "official-2025/survivors-online" },
  { prefix: "Y", directory: "official-2025/survivors-online-young" },
];

const holdoutNames = new Set([
  "OHS_TrojanByte",
  "GSA_GoonSquad",
  "WAN_Baltika9",
  "OST_Gamma",
  "GSA_VanLavan",
  "WHS_K0F1M_AL_T1L1M",
  "HRZ_Thingies",
  "OHS_TOMEX",
  "HRZ_ADDvanced",
  "HRZ_CodeEliteGang",
  "HRZ_Ctrl_Alt_Elite",
  "GSA_LVS_FIT",
  "MTA_Hexellent",
  "TOM_The_Crushers",
  "SZR_The_Chargers",
]);

function readTeams({ prefix, directory }) {
  const pairs = new Map();
  for (const entry of fs.readdirSync(path.resolve(root, directory), { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const match = /^(.*)([12])$/.exec(entry.name);
    if (!match) continue;
    const [, base, suffix] = match;
    const warriors = pairs.get(base) ?? [];
    warriors[Number(suffix) - 1] = `${directory}/${entry.name}`;
    pairs.set(base, warriors);
  }
  return [...pairs.entries()]
    .filter(([, warriors]) => warriors.length === 2 && warriors.every(Boolean))
    .map(([base, warriors]) => ({ base, name: `${prefix}_${base}`, warriors }));
}

const allTeams = divisions.flatMap(readTeams);
if (allTeams.length !== 75) throw new Error(`expected 75 complete 2025 teams, found ${allTeams.length}`);

function stableOrder(teams, salt) {
  return [...teams].sort((left, right) => {
    const a = crypto.createHash("sha256").update(`${salt}:${left.name}`).digest("hex");
    const b = crypto.createHash("sha256").update(`${salt}:${right.name}`).digest("hex");
    return a.localeCompare(b);
  });
}

function cohorts(teams, salt) {
  if (teams.length % 3 !== 0) throw new Error(`${teams.length} opponents cannot be divided into three-team cohorts`);
  const ordered = stableOrder(teams, salt);
  const result = [];
  for (let index = 0; index < ordered.length; index += 3) {
    result.push({
      id: `${salt}-${String(index / 3 + 1).padStart(2, "0")}`,
      opponents: ordered.slice(index, index + 3).map(({ name, warriors }) => ({ name, warriors })),
    });
  }
  return result;
}

const zombies = ["a", "b", "c", "d"].map((suffix) => ({
  name: `zom20${suffix}`,
  path: `official-2025/zombies-live/zom20${suffix}`,
}));
const placeholder = {
  name: "COD_placeholder",
  warriors: ["build/final/PhoenixA", "build/final/PhoenixB"],
};

function writeTemplate(file, experimentId, teams, battles, seeds, salt) {
  const config = {
    experimentId,
    outputPath: `experiments/${experimentId}.json`,
    runDirectory: `build/official-runs/${experimentId}`,
    battles,
    threads: 4,
    seeds,
    candidate: placeholder,
    cohorts: cohorts(teams, salt),
    zombies,
  };
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return { file, teams: teams.length, cohorts: config.cohorts.length, battlesPerCandidate: battles * seeds.length * config.cohorts.length };
}

const tuning = allTeams.filter((team) => !holdoutNames.has(team.base));
const holdout = allTeams.filter((team) => holdoutNames.has(team.base));
if (tuning.length !== 60 || holdout.length !== 15) {
  throw new Error(`expected 60 tuning and 15 holdout teams, found ${tuning.length}/${holdout.length}`);
}

const outputs = [
  writeTemplate("config-2025-tune-template.json", "2025-tune-template", tuning, 12, ["tune-001"], "tune-v1"),
  writeTemplate("config-2025-holdout-template.json", "2025-holdout-template", holdout, 50, ["holdout-001", "holdout-002", "holdout-003"], "holdout-v1"),
  writeTemplate("config-2025-all-template.json", "2025-all-template", allTeams, 50, ["all-001", "all-002"], "all-v1"),
];
fs.writeFileSync("2025-evaluation-split.json", `${JSON.stringify({
  schemaVersion: 1,
  totalTeams: allTeams.length,
  tuning: tuning.map(({ base, name }) => ({ base, name })),
  holdout: holdout.map(({ base, name }) => ({ base, name })),
  outputs,
}, null, 2)}\n`, "utf8");
console.log(JSON.stringify(outputs, null, 2));
