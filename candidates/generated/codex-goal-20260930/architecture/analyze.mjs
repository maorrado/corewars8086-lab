import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../../../");
const read = (name, gate) => JSON.parse(fs.readFileSync(path.join(root, `experiments/codex-goal-20260930-architecture/${name}-${gate}.json`), "utf8"));
const control = read("m050_control", "holdout");
const candidate = read("zombie_bomb_two", "holdout");
const expected = new Map([
  ["m050_control", ["0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"]],
  ["zombie_bomb_two", ["f674e69ec804a3c54c2cfe64cc3101f5fbdece0a1234ddc2f7a3693b240b1e4b", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"]],
]);
for (const [name, result] of [["m050_control", control], ["zombie_bomb_two", candidate]]) {
  if (result.runs.length !== 50 || result.aggregate.battles !== 2500) throw new Error(`${name} incomplete`);
  for (const run of result.runs) {
    if (run.battles !== 50 || run.inputs[name]?.length !== 2) throw new Error(`bad candidate inputs ${run.runId}`);
    if (run.inputs[name].some((entry, i) => entry.sha256 !== expected.get(name)[i])) throw new Error(`bad hash ${run.runId}`);
    if (Object.keys(run.inputs).length !== 4) throw new Error(`not four teams ${run.runId}`);
  }
}
if (control.engineJar.sha256 !== candidate.engineJar.sha256) throw new Error("engine mismatch");
const controls = new Map(control.runs.map((run) => [run.runId, run]));
const pairs = candidate.runs.map((run) => {
  const old = controls.get(run.runId);
  if (!old || old.cohortId !== run.cohortId || old.seed !== run.seed) throw new Error(`pair mismatch ${run.runId}`);
  return {seed:run.seed, cohort:run.cohortId, delta:run.candidate.teamPerBattle-old.candidate.teamPerBattle};
});
const mean = (values) => values.reduce((a, b) => a+b, 0)/values.length;
const values = pairs.map((p) => p.delta);
const avg = mean(values);
const variance = values.reduce((a, b) => a+(b-avg)**2, 0)/(values.length-1);
const sem = Math.sqrt(variance/values.length);
const summary = {
  engineSha256:control.engineJar.sha256,
  battlesPerCandidate:2500,
  control:control.aggregate.teamPerBattle,
  candidate:candidate.aggregate.teamPerBattle,
  delta:avg,
  relativePercent:100*avg/control.aggregate.teamPerBattle,
  ci95ApproxT49:[avg-2.01*sem,avg+2.01*sem],
  pairSigns:{positive:values.filter((x)=>x>0).length,zero:values.filter((x)=>x===0).length,negative:values.filter((x)=>x<0).length},
  bySeed:Object.fromEntries([...new Set(pairs.map((p)=>p.seed))].map((seed)=>[seed,mean(pairs.filter((p)=>p.seed===seed).map((p)=>p.delta))])),
};
console.log(JSON.stringify(summary,null,2));
