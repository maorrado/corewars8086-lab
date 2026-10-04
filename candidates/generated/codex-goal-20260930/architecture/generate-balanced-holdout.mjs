import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const here = path.resolve(import.meta.dirname);
const src = (name) => JSON.parse(fs.readFileSync(path.join(here, `${name}-antipodal_holdout.json`), "utf8"));
const control = src("m050_control");
const candidate = src("zombie_bomb_antipodal");
if (JSON.stringify(control.cohorts) !== JSON.stringify(candidate.cohorts)) throw new Error("source cohorts differ");
const teams = control.cohorts.flatMap((cohort) => cohort.opponents);
if (teams.length !== 75 || new Set(teams.map((team) => team.name)).size !== 75) throw new Error("expected all 75 unique teams");
const rank = (team) => crypto.createHash("sha256").update(`antipodal-balanced-holdout-groups-v2:${team.name}`).digest("hex");
const shuffled = [...teams].sort((a,b)=>rank(a).localeCompare(rank(b)));
const cohorts = Array.from({length:25}, (_,i)=>({
  id:`antipodal-balanced-v2-${String(i+1).padStart(2,"0")}`,
  opponents:structuredClone(shuffled.slice(3*i,3*i+3)),
}));
const seeds = [
  "architecture-antipodal-balanced-holdout-gamma-20260930",
  "architecture-antipodal-balanced-holdout-delta-20260930",
];
for (const [name, source] of [["m050_control", control], ["zombie_bomb_antipodal", candidate]]) {
  const config = structuredClone(source);
  const id = `codex-goal-20260930-architecture-${name}-antipodal-balanced-holdout`;
  config.experimentId = id;
  config.outputPath = `../../../../experiments/codex-goal-20260930-architecture/${name}-antipodal_balanced_holdout.json`;
  config.runDirectory = `../../../../build/official-runs/codex-goal-20260930-architecture/${name}-antipodal_balanced_holdout`;
  config.battles = 50;
  config.threads = 1;
  config.seeds = seeds;
  config.cohorts = structuredClone(cohorts);
  config.candidate.name = "COD_pair";
  const destination = path.join(here, `${name}-antipodal_balanced_holdout.json`);
  const serialized = `${JSON.stringify(config,null,2)}\n`;
  if (fs.existsSync(destination) && fs.readFileSync(destination,"utf8") !== serialized) throw new Error(`refusing to change existing ${destination}`);
  if (!fs.existsSync(destination)) fs.writeFileSync(destination, serialized);
  console.log(JSON.stringify({destination,name:config.candidate.name,cohorts:cohorts.length,seeds,battlesPerArm:cohorts.length*seeds.length*config.battles,threads:config.threads}));
}
