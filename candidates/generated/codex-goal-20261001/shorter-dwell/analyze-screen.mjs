import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const here=import.meta.dirname,root=path.resolve(here,'../../../..');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const folder=path.join(root,'experiments/codex-goal-20261001/accelerated-shorter-dwell');
const output=path.join(folder,'analysis.json'),manifestFile=path.join(here,'screen/manifest.json');
check(!fs.existsSync(output),'Refusing prior analysis');
check(hash(manifestFile)==='4a6ed9ce480098cf78e812d6e42659a232e86472fc03379e99eba08e0bf3eabd','Frozen screen identity');
const manifest=read(manifestFile),commands=[];
function run(args){const r=spawnSync(process.execPath,args,{encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});
 commands.push({args,exitCode:r.status,stdout:r.stdout,stderr:r.stderr});check(r.status===0&&!r.error,'Audit command failed');return JSON.parse(r.stdout);}
run([path.join(here,'generate-screen.mjs'),'--verify']);
const scores={};
for(const item of manifest.configs){
 const result=read(path.join(folder,item.arm,'result.json'));
 check(result.configSha256===item.sha256&&hash(item.path)===item.sha256,'Result differs from frozen arm config');
 check(result.aggregate.battles===500&&result.runs.length===25,'Incomplete arm');
 scores[item.arm]=result.aggregate;
}
const comparisons=manifest.protocol.arms.slice(1).map(arm=>({arm,...run([
 path.join(root,'tools/engine-acceleration-20261001/audit-derived.mjs'),'pair',path.join(folder,arm),path.join(folder,'m050')])}));
const result={recordedAt:new Date().toISOString(),status:'AUDITED_COMPLETE',manifestSha256:hash(manifestFile),
 battles:2500,scores,comparisons,selectedForFreshHoldout:comparisons.filter(c=>c.meanDelta>0).map(c=>c.arm),
 interpretation:'Exploratory complete paired screen only. A positive arm needs new matched holdout against BOTH exact m049 and m050; no screen promotion.',
 commands,files:[manifestFile,import.meta.filename,...manifest.protocol.arms.map(a=>path.join(folder,a,'result.json'))].map(p=>({path:p,sha256:hash(p)}))};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,sha256:hash(output),scores,comparisons,selectedForFreshHoldout:result.selectedForFreshHoldout}));
