import fs from 'node:fs';
import path from 'node:path';
const s=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const [parentId,id,mode]=process.argv.slice(2);
if(!/^[a-zA-Z0-9_-]+$/.test(parentId??'')||!/^[a-zA-Z0-9_-]+$/.test(id??''))throw Error('usage: cold-subset parentId subsetId [check]');
const parentFile=path.join(s,'plans',parentId+'.json'),outFile=path.join(s,'plans',id+'.json');
if(mode==='check') {
 const parent=JSON.parse(fs.readFileSync(path.join(s,'results',parentId+'-persistent.json')));
 const cold=JSON.parse(fs.readFileSync(path.join(s,'results',id+'-original.json')));
 const keys=r=>`${r.arm}|${r.cohort}|${r.seed}`;
 const indexed=new Map(parent.runs.map(r=>[keys(r),r]));
 for(const c of cold.runs){const p=indexed.get(keys(c));if(!p||p.battles!==c.battles||p.scoresSha256!==c.scoresSha256)throw Error('cold CLI differs at '+keys(c));}
 const evidence={schema:'cooperative-arena-cold-verification-v1',parent:parentId,subset:id,scoreFiles:cold.runs.length,battles:cold.runs.reduce((n,r)=>n+r.battles,0),status:'PASS',scope:'Subset of same frozen holdout contexts. Exact full score CSV hash equality, not a second independent performance sample.'};
 fs.writeFileSync(path.join(s,id+'-verification.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
} else {
 const parent=JSON.parse(fs.readFileSync(parentFile));
 const chosen=parent.cohorts.filter(c=>/-c0$/.test(c.id));
 if(chosen.length!==3)throw Error('expected3 independent partitions');
 const plan={...parent,id,cohorts:chosen};
 fs.writeFileSync(outFile,JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
 console.log(outFile+' '+chosen.length+' same seeded contexts; '+plan.battles*chosen.length*plan.arms.length+' cold battles');
}
