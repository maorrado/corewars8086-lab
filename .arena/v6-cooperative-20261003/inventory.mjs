import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const session=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const results=path.join(session,'results');
const files=fs.readdirSync(results).filter(n=>/-(persistent|original)\.json$/.test(n));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const pairs=new Map();
const batches=[];
for(const file of files) {
 const p=path.join(results,file),r=JSON.parse(fs.readFileSync(p));
 if(r.schema!=='agent2-bench-v1'&&!Array.isArray(r.runs))throw Error('invalid result '+file);
 const plan=JSON.parse(fs.readFileSync(r.planPath));
 if(sha(r.planPath)!==r.planSha256)throw Error('changed plan '+file);
 const byArm={};
 for(const a of plan.arms) {
  const key=a.warriors.map(sha).join(':');
  if(!pairs.has(key))pairs.set(key,{ids:[],warriors:a.warriors,sha256:key.split(':'),plans:[]});
  const pair=pairs.get(key);if(!pair.ids.includes(a.id))pair.ids.push(a.id);
  if(!pair.plans.includes(plan.id))pair.plans.push(plan.id);
  const runs=r.runs.filter(x=>x.arm===a.id);
  byArm[a.id]={battles:runs.reduce((s,x)=>s+x.battles,0),score:runs.reduce((s,x)=>s+x.team,0),runs:runs.length};
  byArm[a.id].perBattle=byArm[a.id].score/byArm[a.id].battles;
 }
 batches.push({file:p,sha256:sha(p),id:r.planId,engine:r.engine,elapsedSeconds:r.elapsedSeconds,battles:r.runs.reduce((s,x)=>s+x.battles,0),byArm});
}
const out={schema:'cooperative-arena-inventory-v1',scope:'Completed centralized benchmarks only; excludes isolated CPU instructions and25 observer replays.',battles:batches.reduce((s,x)=>s+x.battles,0),batches,pairs:[...pairs.values()]};
const dst=path.join(session,'inventory.json');fs.writeFileSync(dst,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({completedBatches:batches.length,battles:out.battles,uniquePairs:pairs.size,includesOriginal:true},null,2));
