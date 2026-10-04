import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const here = path.resolve(import.meta.dirname);
const root = path.resolve(here, "../../../../");
const reference = JSON.parse(fs.readFileSync(path.resolve(here, "../independent-b-exact-worker-copy/screen-control.json"), "utf8"));
const pool = reference.cohorts.flatMap((cohort) => cohort.opponents);
if (pool.length !== 75 || new Set(pool.map((team) => team.name)).size !== 75) throw new Error("expected 75 unique official 2025 teams");

const rank = (team) => crypto.createHash("sha256").update(`novel-architecture-v2-regroup:${team.name}`).digest("hex");
const ordered = [...pool].sort((a, b) => rank(a).localeCompare(rank(b)));
const cohorts = Array.from({length:25}, (_,index)=>({
  id:`novel-v2-${String(index+1).padStart(2,"0")}`,
  opponents:ordered.slice(index*3,index*3+3),
}));
const smokeNames = ["A_HRZ_Registered_Winners","A_HRZ_Code_Jokers4Life","A_TOM_2B2Team"];
const smokeTeams = smokeNames.map((name)=>{
  const found = pool.find((team)=>team.name===name);
  if (!found) throw new Error(`missing smoke opponent ${name}`);
  return found;
});
const build = (leaf)=>path.join(root,"build/codex-goal-20260930/novel-architecture-v2",leaf);
const control = [path.join(root,"build/m050-repro/ab_pad_a"),path.join(root,"build/m050-repro/ab_pad_b")];
const candidate = [build("A"),build("B")];
for (const file of [...control,...candidate]) if (!fs.existsSync(file)) throw new Error(`missing binary ${file}`);
const seed = "codex-goal-novel-architecture-v2-new-field-20260930-8419";

function config(kind, warriors, chosenCohorts, chosenSeed) {
  const isSmoke = kind==="candidate-smoke";
  return {
    experimentId:`codex-goal-novel-architecture-v2-${kind}-20260930`,
    outputPath:path.join(root,"experiments/codex-goal-20260930/novel-architecture-v2",`${kind}.json`),
    runDirectory:path.join(root,"build/official-runs/codex-goal-20260930/novel-architecture-v2",kind),
    battles:20,
    threads:1,
    seeds:[chosenSeed],
    candidate:{name:"COD_pair",warriors},
    cohorts:chosenCohorts,
    zombies:reference.zombies,
    java:reference.java,
    jar:reference.jar,
  };
}

const files = [
  ["candidate-smoke.json",config("candidate-smoke",candidate,[{id:"novel-v2-smoke",opponents:smokeTeams}],"codex-goal-novel-architecture-v2-smoke-20260930-8419")],
  ["control-screen.json",config("control-screen",control,cohorts,seed)],
  ["candidate-screen.json",config("candidate-screen",candidate,cohorts,seed)],
];
for (const [name,data] of files) {
  const file = path.join(here,name);
  if (fs.existsSync(file)) throw new Error(`refusing to overwrite ${file}`);
  if (fs.existsSync(data.outputPath) || fs.existsSync(data.runDirectory)) throw new Error(`run output already exists for ${name}`);
  fs.writeFileSync(file,JSON.stringify(data,null,2)+"\n");
  console.log(file);
}
