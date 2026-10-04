import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const here = path.resolve(import.meta.dirname);
const engineHash = "31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d";
const expected = {
  "control-screen":["0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44","06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"],
  "candidate-screen":["b7b6698764bd44528564bd631ac973d45412e3620d5534a1d9a517ae678c07e7","1be29fe20ceb8d48b95495deff57c6e9db06e731166f1e34c638a81cf4ad6aea"],
};
const sha = (bytes)=>crypto.createHash("sha256").update(bytes).digest("hex");
function load(name) {
  const configBytes = fs.readFileSync(path.join(here,`${name}.json`));
  const config = JSON.parse(configBytes);
  const result = JSON.parse(fs.readFileSync(config.outputPath));
  if (config.candidate.name!=="COD_pair" || config.cohorts.length!==25 || config.seeds.length!==1 || config.battles!==20 || config.threads!==1) throw new Error(`${name}: wrong protocol`);
  if (result.configSha256!==sha(configBytes) || result.engineJar.sha256!==engineHash || result.runs.length!==25 || result.aggregate.battles!==500) throw new Error(`${name}: result/protocol mismatch`);
  const currentHashes = config.candidate.warriors.map((file)=>sha(fs.readFileSync(file)));
  if (JSON.stringify(currentHashes)!==JSON.stringify(expected[name])) throw new Error(`${name}: current binary hash mismatch`);
  const names = config.cohorts.flatMap((cohort)=>cohort.opponents.map((team)=>team.name));
  if (names.length!==75 || new Set(names).size!==75) throw new Error(`${name}: expected 75 unique field teams`);
  const cohortById = new Map(config.cohorts.map((cohort)=>[cohort.id,cohort]));
  const seen = new Set();
  for (const run of result.runs) {
    if (seen.has(run.runId)) throw new Error(`${name}: repeated run ${run.runId}`);
    seen.add(run.runId);
    const cohort = cohortById.get(run.cohortId);
    if (!cohort || run.seed!==config.seeds[0] || run.battles!==20) throw new Error(`${name}: wrong run ${run.runId}`);
    if (JSON.stringify(Object.keys(run.inputs).sort())!==JSON.stringify(["COD_pair",...cohort.opponents.map((team)=>team.name)].sort())) throw new Error(`${name}: wrong teams ${run.runId}`);
    if (JSON.stringify(run.inputs.COD_pair.map((entry)=>entry.sha256))!==JSON.stringify(expected[name])) throw new Error(`${name}: wrong candidate bytes ${run.runId}`);
    if (Math.abs(run.scores.groups.COD_pair/20-run.candidate.teamPerBattle)>1e-7) throw new Error(`${name}: score mismatch ${run.runId}`);
  }
  for (const cohort of config.cohorts) if (!seen.has(`${cohort.id}__${config.seeds[0]}`)) throw new Error(`${name}: missing cohort ${cohort.id}`);
  return {config,result};
}
const control=load("control-screen"), candidate=load("candidate-screen");
for (const field of ["cohorts","seeds","zombies","battles","threads","java","jar"]) if (JSON.stringify(control.config[field])!==JSON.stringify(candidate.config[field])) throw new Error(`unpaired ${field}`);
if (control.config.candidate.name!==candidate.config.candidate.name) throw new Error("candidate names differ");
const oldRuns=new Map(control.result.runs.map((run)=>[run.runId,run]));
const diffs=candidate.result.runs.map((run)=>{
  const old=oldRuns.get(run.runId);
  if (!old || old.cohortId!==run.cohortId || old.seed!==run.seed) throw new Error(`unpaired run ${run.runId}`);
  for (const team of Object.keys(old.inputs).filter((name)=>name!=="COD_pair")) if (JSON.stringify(old.inputs[team].map((entry)=>entry.sha256))!==JSON.stringify(run.inputs[team].map((entry)=>entry.sha256))) throw new Error(`opponents differ ${run.runId}:${team}`);
  if (JSON.stringify(old.zombies.map((entry)=>entry.sha256))!==JSON.stringify(run.zombies.map((entry)=>entry.sha256))) throw new Error(`Zombies differ ${run.runId}`);
  return run.candidate.teamPerBattle-old.candidate.teamPerBattle;
});
const delta=diffs.reduce((sum,value)=>sum+value,0)/25;
const sem=Math.sqrt(diffs.reduce((sum,value)=>sum+(value-delta)**2,0)/24/25);
console.log(JSON.stringify({protocol:"name-matched 25-cohort 75-team 2025 screen, one new seed, 20 battles/cohort/arm",battlesPerArm:500,engineHash,expected,score:{control:control.result.aggregate.teamPerBattle,candidate:candidate.result.aggregate.teamPerBattle},delta,relativePercent:100*delta/control.result.aggregate.teamPerBattle,ci95ApproxCohortClusterT24:[delta-2.064*sem,delta+2.064*sem],signs:{positive:diffs.filter((x)=>x>0).length,zero:diffs.filter((x)=>x===0).length,negative:diffs.filter((x)=>x<0).length}},null,2));
