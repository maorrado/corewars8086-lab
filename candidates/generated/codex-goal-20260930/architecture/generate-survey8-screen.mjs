import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const here = path.resolve(import.meta.dirname);
const source = JSON.parse(fs.readFileSync(path.join(here, "m050_control-antipodal_balanced_holdout.json"), "utf8"));
const teams = source.cohorts.flatMap((cohort) => cohort.opponents);
if (teams.length !== 75 || new Set(teams.map((team) => team.name)).size !== 75) throw new Error("expected 75 unique official 2025 teams");
const rank = (team) => crypto.createHash("sha256").update(`survey8-screen-groups-v1:${team.name}`).digest("hex");
const shuffled = [...teams].sort((a,b)=>rank(a).localeCompare(rank(b)));
const cohorts = Array.from({length:25},(_,i)=>({
  id:`survey8-screen-v1-${String(i+1).padStart(2,"0")}`,
  opponents:structuredClone(shuffled.slice(3*i,3*i+3)),
}));
const seed = "architecture-survey8-name-matched-screen-20260930";
for (const variant of ["m050_control", "zombie_bomb_survey8"]) {
  const config = structuredClone(source);
  config.experimentId = `codex-goal-20260930-architecture-${variant}-survey8-screen`;
  config.outputPath = `../../../../experiments/codex-goal-20260930-architecture/${variant}-survey8_screen.json`;
  config.runDirectory = `../../../../build/official-runs/codex-goal-20260930-architecture/${variant}-survey8_screen`;
  config.battles = 20;
  config.threads = 1;
  config.seeds = [seed];
  config.cohorts = structuredClone(cohorts);
  config.candidate.name = "COD_pair";
  config.candidate.warriors = ["A", "B"].map((entry)=>`../../../../build/codex-goal-20260930-architecture/${variant}/${entry}`);
  const destination = path.join(here, `${variant}-survey8_screen.json`);
  const serialized = `${JSON.stringify(config,null,2)}\n`;
  if (fs.existsSync(destination) && fs.readFileSync(destination,"utf8") !== serialized) throw new Error(`refusing to overwrite modified ${destination}`);
  if (!fs.existsSync(destination)) fs.writeFileSync(destination, serialized);
  console.log(JSON.stringify({destination,name:config.candidate.name,cohorts:cohorts.length,seed,battlesPerArm:cohorts.length*config.battles,threads:config.threads}));
}
