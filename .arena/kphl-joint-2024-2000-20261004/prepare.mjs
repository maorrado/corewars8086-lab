import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root='C:/Maor/CodeGuru/corewars8086-lab',here=path.join(root,'.arena/kphl-joint-2024-2000-20261004');
const old=path.join(root,'.arena/kphl-joint-leagues-20261004/plan-2024.json');
const p=JSON.parse(fs.readFileSync(old));
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
for(const t of p.teams)for(const f of t.files)if(sha(f.path)!==f.sha256)throw Error('Changed frozen team '+t.name);
for(const z of p.zombies)if(sha(z.path)!==z.sha256)throw Error('Changed frozen Zombie '+z.name);
const salt='joint-league-kphl-20261004-2024-2000-fresh-beta';
let h=crypto.createHash('sha256').update(salt).digest(),index=0;
const r=()=>{if(index+4>h.length){h=crypto.createHash('sha256').update(h).digest();index=0;}const v=h.readUInt32LE(index);index+=4;return v/2**32;};
const battles=2000,n=p.teams.length,quota=Math.floor(4*battles/n),extra=4*battles%n;
const cand=p.teams.filter(t=>t.kind==='candidate'),rest=p.teams.filter(t=>t.kind!=='candidate').map(t=>({name:t.name,key:r()})).sort((a,b)=>a.key-b.key);
if(cand.length!==3||extra<3)throw Error('Expected3 equal candidates');
const extras=new Set([...cand.map(t=>t.name),...rest.slice(0,extra-3).map(t=>t.name)]);
const counts=Object.fromEntries(p.teams.map(t=>[t.name,quota+(extras.has(t.name)?1:0)])),remaining={...counts},jobs=[];
for(let j=0;j<battles;j++){
 const chosen=p.teams.map(t=>({name:t.name,left:remaining[t.name],key:r()})).filter(t=>t.left>0).sort((a,b)=>b.left-a.left||a.key-b.key).slice(0,4);
 if(chosen.length!==4)throw Error('Incomplete schedule');
 for(const t of chosen)remaining[t.name]--;
 jobs.push({id:'war'+String(j).padStart(4,'0'),teams:chosen.map(t=>t.name),seed:salt+'|'+j});
}
if(Object.values(remaining).some(v=>v!==0))throw Error('Unfilled quotas');
const out={...p,battles,salt,counts,jobs,design:'All3 candidates in same15-team pool;4 teams/battle. Exactly2000 totalwars, candidates534appearances each, archive533or534. Randomties with largest-remaining quota scheduler, NOTiid officialsampling. Fresh seeds, independent of previous1000draw.',previousPlanSha256:sha(old),preparedAt:new Date().toISOString()};
fs.writeFileSync(path.join(here,'plan-2024.json'),JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({battles,teams:n,zombies:out.zombies.length,candidateAppearances:counts[cand[0].name],min:Math.min(...Object.values(counts)),max:Math.max(...Object.values(counts)),salt}));
