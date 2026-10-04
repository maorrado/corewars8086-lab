import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const here = path.resolve(import.meta.dirname);
const root = path.resolve(here, "../../../../");
const suffix = "antipodal_balanced_holdout";
const exactHashes = {
  control:["0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"],
  antipodal:["b8111627d21d2f8b1c40f12e6e65767bf9d8885ee6e1895b1b445c3013f36700", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"],
};
const engineHash = "31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d";
const sha = (data) => crypto.createHash("sha256").update(data).digest("hex");

function load(name, hashes) {
  const configPath = path.join(here, `${name}-${suffix}.json`);
  const configBytes = fs.readFileSync(configPath);
  const config = JSON.parse(configBytes);
  const resultPath = path.join(root, `experiments/codex-goal-20260930-architecture/${name}-${suffix}.json`);
  const result = JSON.parse(fs.readFileSync(resultPath));
  if (result.configSha256 !== sha(configBytes)) throw new Error(`${name}: config hash changed after run`);
  if (result.engineJar.sha256 !== engineHash) throw new Error(`${name}: wrong engine`);
  if (config.candidate.name !== "COD_pair") throw new Error(`${name}: candidate.name must be COD_pair`);
  if (config.threads !== 1 || config.battles !== 50 || config.cohorts.length !== 25 || config.seeds.length !== 2) throw new Error(`${name}: unexpected protocol`);
  if (result.runs.length !== 50 || result.aggregate.battles !== 2500) throw new Error(`${name}: incomplete result`);
  const onDisk = config.candidate.warriors.map((entry)=>sha(fs.readFileSync(path.resolve(here,entry))));
  if (JSON.stringify(onDisk)!==JSON.stringify(hashes)) throw new Error(`${name}: current binaries do not match the expected originals`);
  const configCohorts = new Map(config.cohorts.map((cohort)=>[cohort.id,cohort]));
  const actualRuns = new Set();
  for (const run of result.runs) {
    if (actualRuns.has(run.runId)) throw new Error(`${name}: duplicate run ${run.runId}`);
    actualRuns.add(run.runId);
    const cohort = configCohorts.get(run.cohortId);
    if (!cohort || !config.seeds.includes(run.seed) || run.battles !== 50) throw new Error(`${name}: wrong run id/cohort/seed/battles`);
    if (run.inputs.COD_pair?.length !== 2 || JSON.stringify(run.inputs.COD_pair.map((entry)=>entry.sha256)) !== JSON.stringify(hashes)) throw new Error(`${name}: candidate run hashes wrong ${run.runId}`);
    const wantedNames = ["COD_pair", ...cohort.opponents.map((opponent)=>opponent.name)].sort();
    if (JSON.stringify(Object.keys(run.inputs).sort()) !== JSON.stringify(wantedNames)) throw new Error(`${name}: wrong four teams ${run.runId}`);
    if (Math.abs(run.scores.groups.COD_pair/50-run.candidate.teamPerBattle)>1e-7) throw new Error(`${name}: score normalization mismatch ${run.runId}`);
  }
  for (const cohort of config.cohorts) for (const seed of config.seeds) {
    const id = `${cohort.id}__${seed}`;
    if (!actualRuns.has(id)) throw new Error(`${name}: missing ${id}`);
  }
  const teams = config.cohorts.flatMap((cohort)=>cohort.opponents.map((opponent)=>opponent.name));
  if (teams.length!==75 || new Set(teams).size!==75) throw new Error(`${name}: not all 75 opponents exactly once per seed`);
  return {config,result,configPath,resultPath};
}

const control = load("m050_control",exactHashes.control);
const candidate = load("zombie_bomb_antipodal",exactHashes.antipodal);
if (control.config.candidate.name !== candidate.config.candidate.name) throw new Error("candidate names differ; not a valid name-matched comparison");
for (const field of ["battles","threads","seeds","cohorts","zombies","java","jar"]) {
  if (JSON.stringify(control.config[field])!==JSON.stringify(candidate.config[field])) throw new Error(`configs differ on ${field}`);
}
const oldRuns = new Map(control.result.runs.map((run)=>[run.runId,run]));
const pairs = candidate.result.runs.map((run)=>{
  const old = oldRuns.get(run.runId);
  if (!old || run.seed!==old.seed || run.cohortId!==old.cohortId) throw new Error(`unpaired run ${run.runId}`);
  for (const team of Object.keys(old.inputs).filter((name)=>name!=="COD_pair")) {
    if (JSON.stringify(old.inputs[team].map((entry)=>entry.sha256))!==JSON.stringify(run.inputs[team].map((entry)=>entry.sha256))) throw new Error(`opponent hash mismatch ${run.runId}:${team}`);
  }
  if (JSON.stringify(old.zombies.map((entry)=>entry.sha256))!==JSON.stringify(run.zombies.map((entry)=>entry.sha256))) throw new Error(`Zombie hash mismatch ${run.runId}`);
  return {cohort:run.cohortId,seed:run.seed,delta:run.candidate.teamPerBattle-old.candidate.teamPerBattle};
});
const avg = (values)=>values.reduce((sum,value)=>sum+value,0)/values.length;
const cohortMeans = [...new Set(pairs.map((entry)=>entry.cohort))].map((cohort)=>avg(pairs.filter((entry)=>entry.cohort===cohort).map((entry)=>entry.delta)));
if (cohortMeans.length!==25) throw new Error("expected 25 independent cohort units");
const delta = avg(cohortMeans);
const sem = Math.sqrt(cohortMeans.reduce((sum,value)=>sum+(value-delta)**2,0)/(cohortMeans.length-1)/cohortMeans.length);
console.log(JSON.stringify({
  protocol:"same candidate name; 25 regrouped all-2025 cohorts × 2 fresh seeds × 50 battles per arm",
  controlResult:control.resultPath,candidateResult:candidate.resultPath,
  candidateName:control.config.candidate.name,engineSha256:engineHash,
  exactHashes,battlesPerArm:2500,
  score:{control:control.result.aggregate.teamPerBattle,antipodal:candidate.result.aggregate.teamPerBattle},
  delta,relativePercent:100*delta/control.result.aggregate.teamPerBattle,
  ci95ApproxCohortClusterT24:[delta-2.064*sem,delta+2.064*sem],
  cohortSigns:{positive:cohortMeans.filter(x=>x>0).length,zero:cohortMeans.filter(x=>x===0).length,negative:cohortMeans.filter(x=>x<0).length},
  bySeed:Object.fromEntries(control.config.seeds.map((seed)=>[seed,avg(pairs.filter((entry)=>entry.seed===seed).map((entry)=>entry.delta))])),
},null,2));
