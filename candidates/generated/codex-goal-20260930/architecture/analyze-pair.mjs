import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const gate = process.argv[2];
const variant = process.argv[3];
if (!gate || !variant) throw new Error("usage: node analyze-pair.mjs <gate> <variant>");
const here = path.resolve(import.meta.dirname);
const root = path.resolve(here, "../../../../");
const expectedHashes = {
  m050_control:["0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"],
  zombie_bomb_antipodal:["b8111627d21d2f8b1c40f12e6e65767bf9d8885ee6e1895b1b445c3013f36700", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"],
  zombie_bomb_post_anchor_one:["5571c0bab1efc5750a24976329ab1dc7464d49bdf1e650b5f274d300774e7446", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"],
  zombie_bomb_post_anchor_mem:["7d50ee1edda53adad0815789096016dbe8b042714cdc35ae6752972b53dba509", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"],
};
if (!expectedHashes[variant]) throw new Error(`unknown variant ${variant}`);
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
function load(name) {
  const configPath = path.join(here, `${name}-${gate}.json`);
  const configBytes = fs.readFileSync(configPath);
  const config = JSON.parse(configBytes);
  const resultPath = path.join(root, `experiments/codex-goal-20260930-architecture/${name}-${gate}.json`);
  const result = JSON.parse(fs.readFileSync(resultPath));
  if (result.configSha256 !== sha256(configBytes)) throw new Error(`${name} config changed after run`);
  if (result.runs.length !== config.cohorts.length * config.seeds.length) throw new Error(`${name} incomplete runs`);
  if (result.aggregate.battles !== result.runs.length * config.battles) throw new Error(`${name} incomplete battles`);
  for (const run of result.runs) {
    if (run.inputs[name]?.length !== 2 || run.inputs[name].some((entry,i)=>entry.sha256!==expectedHashes[name][i])) throw new Error(`${name} binary mismatch: ${run.runId}`);
    if (Object.keys(run.inputs).length !== 4 || run.battles !== config.battles) throw new Error(`${name} protocol mismatch: ${run.runId}`);
  }
  return {config,result};
}
const c = load("m050_control");
const v = load(variant);
if (JSON.stringify(c.config.cohorts) !== JSON.stringify(v.config.cohorts) || JSON.stringify(c.config.seeds)!==JSON.stringify(v.config.seeds)) throw new Error("unpaired configs");
if (c.result.engineJar.sha256 !== v.result.engineJar.sha256) throw new Error("engine mismatch");
const controlByRun = new Map(c.result.runs.map((run)=>[run.runId,run]));
const pairs = v.result.runs.map((run)=>{
  const old = controlByRun.get(run.runId);
  if (!old || old.cohortId!==run.cohortId || old.seed!==run.seed) throw new Error(`run mismatch: ${run.runId}`);
  const oldOpponents = Object.entries(old.inputs).filter(([name])=>name!=="m050_control").map(([name,files])=>[name,files.map((f)=>f.sha256)]).sort((a,b)=>a[0].localeCompare(b[0]));
  const newOpponents = Object.entries(run.inputs).filter(([name])=>name!==variant).map(([name,files])=>[name,files.map((f)=>f.sha256)]).sort((a,b)=>a[0].localeCompare(b[0]));
  if (JSON.stringify(oldOpponents)!==JSON.stringify(newOpponents)) throw new Error(`opponents mismatch: ${run.runId}`);
  return {cohort:run.cohortId,seed:run.seed,delta:run.candidate.teamPerBattle-old.candidate.teamPerBattle};
});
const appearances = c.config.cohorts.flatMap((cohort)=>cohort.opponents.map((team)=>team.name));
if (appearances.length!==75 || new Set(appearances).size!==75) throw new Error("not all 75 unique 2025 teams");
const mean = (xs)=>xs.reduce((a,b)=>a+b,0)/xs.length;
const clusters = [...new Set(pairs.map((p)=>p.cohort))].map((cohort)=>mean(pairs.filter((p)=>p.cohort===cohort).map((p)=>p.delta)));
if (clusters.length!==25) throw new Error("expected 25 cohort clusters");
const delta = mean(clusters);
const sem = Math.sqrt(clusters.reduce((sum,x)=>sum+(x-delta)**2,0)/(clusters.length-1)/clusters.length);
const bySeed = Object.fromEntries([...new Set(pairs.map((p)=>p.seed))].map((seed)=>[seed,mean(pairs.filter((p)=>p.seed===seed).map((p)=>p.delta))]));
console.log(JSON.stringify({
  gate, variant,
  engineSha256:c.result.engineJar.sha256,
  expectedHashes:{control:expectedHashes.m050_control,candidate:expectedHashes[variant]},
  cohorts:clusters.length,seeds:c.config.seeds,battlesPerArm:c.result.aggregate.battles,
  control:c.result.aggregate.teamPerBattle,candidate:v.result.aggregate.teamPerBattle,
  delta,relativePercent:delta/c.result.aggregate.teamPerBattle*100,
  ci95ApproxCohortClusterT24:[delta-2.064*sem,delta+2.064*sem],
  clusterSigns:{positive:clusters.filter(x=>x>0).length,zero:clusters.filter(x=>x===0).length,negative:clusters.filter(x=>x<0).length},
  bySeed,
},null,2));
