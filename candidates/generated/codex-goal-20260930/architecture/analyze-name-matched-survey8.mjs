import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const here = path.resolve(import.meta.dirname);
const root = path.resolve(here,"../../../../");
const expectedEngine = "31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d";
const hashes = {
  m050_control:["0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"],
  zombie_bomb_survey8:["cbc60ecc87c1b7e6bea632f17c9cb56bb60b1cdf7ad76194d6cb7d3244a8cde4", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"],
};
const sha = (data)=>crypto.createHash("sha256").update(data).digest("hex");
function load(name) {
  const configFile = path.join(here,`${name}-survey8_screen.json`);
  const configBytes = fs.readFileSync(configFile);
  const config = JSON.parse(configBytes);
  const resultFile = path.join(root,`experiments/codex-goal-20260930-architecture/${name}-survey8_screen.json`);
  const result = JSON.parse(fs.readFileSync(resultFile));
  if (config.candidate.name!=="COD_pair") throw new Error(`${name}: candidate name differs`);
  if (result.configSha256!==sha(configBytes)) throw new Error(`${name}: config changed after run`);
  if (result.engineJar.sha256!==expectedEngine) throw new Error(`${name}: engine hash differs`);
  if (config.cohorts.length!==25 || config.seeds.length!==1 || config.battles!==20 || config.threads!==1) throw new Error(`${name}: screen protocol differs`);
  if (result.runs.length!==25 || result.aggregate.battles!==500) throw new Error(`${name}: incomplete result`);
  const actualHashes = config.candidate.warriors.map((file)=>sha(fs.readFileSync(path.resolve(here,file))));
  if (JSON.stringify(actualHashes)!==JSON.stringify(hashes[name])) throw new Error(`${name}: candidate binary differs on disk`);
  const cohorts = new Map(config.cohorts.map((cohort)=>[cohort.id,cohort]));
  const actualIds = new Set();
  for (const run of result.runs) {
    if (actualIds.has(run.runId)) throw new Error(`${name}: duplicate run`);
    actualIds.add(run.runId);
    const cohort = cohorts.get(run.cohortId);
    if (!cohort || run.seed!==config.seeds[0] || run.battles!==20) throw new Error(`${name}: cohort/seed/battles mismatch ${run.runId}`);
    const wanted = ["COD_pair",...cohort.opponents.map((team)=>team.name)].sort();
    if (JSON.stringify(Object.keys(run.inputs).sort())!==JSON.stringify(wanted)) throw new Error(`${name}: four-team inputs mismatch ${run.runId}`);
    if (JSON.stringify(run.inputs.COD_pair.map((item)=>item.sha256))!==JSON.stringify(hashes[name])) throw new Error(`${name}: run binary hashes mismatch ${run.runId}`);
    if (Math.abs(run.scores.groups.COD_pair/20-run.candidate.teamPerBattle)>1e-7) throw new Error(`${name}: score mismatch ${run.runId}`);
  }
  for (const cohort of config.cohorts) if (!actualIds.has(`${cohort.id}__${config.seeds[0]}`)) throw new Error(`${name}: missing ${cohort.id}`);
  const names = config.cohorts.flatMap((cohort)=>cohort.opponents.map((team)=>team.name));
  if (names.length!==75 || new Set(names).size!==75) throw new Error(`${name}: not 75 unique opponents`);
  return {config,result,resultFile};
}
const old = load("m050_control");
const now = load("zombie_bomb_survey8");
if (old.config.candidate.name!==now.config.candidate.name) throw new Error("unequal candidate names");
for (const key of ["cohorts","seeds","zombies","threads","battles","java","jar"]) {
  if (JSON.stringify(old.config[key])!==JSON.stringify(now.config[key])) throw new Error(`unpaired ${key}`);
}
const oldRuns = new Map(old.result.runs.map((run)=>[run.runId,run]));
const differences = now.result.runs.map((run)=>{
  const baseline = oldRuns.get(run.runId);
  if (!baseline || baseline.cohortId!==run.cohortId || baseline.seed!==run.seed) throw new Error(`unpaired run ${run.runId}`);
  for (const team of Object.keys(run.inputs).filter((name)=>name!=="COD_pair")) {
    if (JSON.stringify(run.inputs[team].map((item)=>item.sha256))!==JSON.stringify(baseline.inputs[team].map((item)=>item.sha256))) throw new Error(`opponent bytes differ ${run.runId}:${team}`);
  }
  if (JSON.stringify(run.zombies.map((item)=>item.sha256))!==JSON.stringify(baseline.zombies.map((item)=>item.sha256))) throw new Error(`Zombie bytes differ ${run.runId}`);
  return run.candidate.teamPerBattle-baseline.candidate.teamPerBattle;
});
const delta = differences.reduce((sum,value)=>sum+value,0)/25;
const sem = Math.sqrt(differences.reduce((sum,value)=>sum+(value-delta)**2,0)/24/25);
console.log(JSON.stringify({
  protocol:"same-name COD_pair; 25 freshly regrouped all-2025 cohorts × one new seed × 20 battles per arm",
  resultFiles:[old.resultFile,now.resultFile],engineSha256:expectedEngine,hashes,battlesPerArm:500,
  scores:{m050:old.result.aggregate.teamPerBattle,survey8:now.result.aggregate.teamPerBattle},
  delta,relativePercent:100*delta/old.result.aggregate.teamPerBattle,
  ci95ApproxCohortClusterT24:[delta-2.064*sem,delta+2.064*sem],
  signs:{positive:differences.filter((x)=>x>0).length,zero:differences.filter((x)=>x===0).length,negative:differences.filter((x)=>x<0).length},
},null,2));
