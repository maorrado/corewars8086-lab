import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const session=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const poolData=JSON.parse(fs.readFileSync(path.join(session,'pool.json')));
const [id,manifest,battlesArg='8',partitionsArg='1',mode='normal',selection='*']=process.argv.slice(2);
if(!id||!manifest||!/^[A-Za-z0-9_-]+$/.test(id))throw Error('usage make-plan id manifest battles partitions [normal|nozombies|modern|duel|2024]');
if(!['normal','nozombies','modern','duel','2024'].includes(mode))throw Error('unknown mode '+mode);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const manifestData=JSON.parse(fs.readFileSync(manifest));
const rawCandidates=Array.isArray(manifestData)?manifestData:manifestData.candidates;
const candidates=selection==='*'?rawCandidates:rawCandidates.filter(c=>selection.split(',').includes(c.id));
if(!Array.isArray(candidates))throw Error('manifest must be array or {candidates:[{id,warriors:[absoluteA,absoluteB]}]}');
const baseline={id:'original_v6',warriors:poolData.baseline.map(f=>f.path)};
const arms=[baseline,...candidates.map(c=>({id:c.id,warriors:(c.warriors??c.binaries??[c.a,c.b]).map(w=>{
 if(typeof w==='string')return w;
 if(w.sha256&&sha(w.binary)!==w.sha256)throw Error('Manifest binary mismatch '+w.binary);
 return w.binary;
})}))];
const seen=new Set();
for(const a of arms) {
 if(!a.id||!a.warriors||a.warriors.length!==2||seen.has(a.id))throw Error('invalid/duplicate arm');
 seen.add(a.id);
 for(const w of a.warriors)if(!path.isAbsolute(w)||fs.statSync(w).size>256||fs.statSync(w).size<1)throw Error('invalid binary '+w);
}
const salt=`v6-cooperative-20261003-${id}`;
const rank=(arr,k)=>[...arr].sort((a,b)=>shaText(k+'|'+a.name).localeCompare(shaText(k+'|'+b.name)));
function shaText(s){return crypto.createHash('sha256').update(s).digest('hex');}
const cohorts=[];
const stressRoot=path.join(session,'.arena/run-20261003-150943-s20261003/scratch/a002/frozen-stress-pools');
const pool=(mode==='2024'?JSON.parse(fs.readFileSync(path.join(stressRoot,'2024-pool.json'))).pool:poolData.pool).map(t=>({name:t.name,warriors:t.warriors}));
if(mode==='modern'||mode==='duel') {
 const modern=JSON.parse(fs.readFileSync(path.join(stressRoot,'modern-pool.json'))).pool;
 for(let p=0;p<Number(partitionsArg);p++) {
  const arr=rank(modern,salt+'|p'+p);
  if(mode==='duel')for(let i=0;i<arr.length;i++)cohorts.push({id:`p${p}-m${i}`,opponents:[arr[i]],seeds:[`${salt}|p${p}|m${i}`]});
  else for(let i=0;i<arr.length;i++)cohorts.push({id:`p${p}-m${i}`,opponents:[arr[i],pool[(i*7+p*11)%pool.length],pool[(i*7+p*11+19)%pool.length]],seeds:[`${salt}|p${p}|m${i}`]});
 }
} else {
 for(let p=0;p<Number(partitionsArg);p++) {
  const arr=rank(pool,salt+'|p'+p);
  for(let i=0;i<arr.length;i+=3)cohorts.push({id:`p${p}-c${i/3}`,opponents:arr.slice(i,i+3),seeds:[`${salt}|p${p}|c${i/3}`]});
 }
}
const plan={id,salt,teamName:'CAND',battles:Number(battlesArg),telemetry:false,zombies:mode==='nozombies'?[]:poolData.zombies.map(z=>({name:z.name,path:z.path})),arms,cohorts};
const planPath=path.join(session,'plans',id+'.json');fs.mkdirSync(path.dirname(planPath),{recursive:true});fs.writeFileSync(planPath,JSON.stringify(plan,null,1)+'\n',{flag:'wx'});
const identities=arms.map(a=>({...a,files:a.warriors.map(w=>({path:w,bytes:fs.statSync(w).size,sha256:sha(w)}))}));
fs.writeFileSync(planPath+'.inputs.json',JSON.stringify(identities,null,2)+'\n',{flag:'wx'});
console.log(`${planPath}: ${arms.length} arms, ${cohorts.length} cohorts, ${plan.battles*cohorts.length} battles/arm`);
