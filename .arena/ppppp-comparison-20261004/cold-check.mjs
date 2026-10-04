import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const session='C:/Maor/CodeGuru/corewars8086-lab/.arena/v6-cooperative-20261003';
const parent='ppppp-20261004-field-alpha',id='ppppp-20261004-cold-check';
const planFile=path.join(session,'plans',id+'.json');
if(process.argv.includes('--check')){
 const warm=JSON.parse(fs.readFileSync(path.join(session,'results',parent+'-persistent.json')));
 const cold=JSON.parse(fs.readFileSync(path.join(session,'results',id+'-original.json')));
 for(const c of cold.runs){const w=warm.runs.find(w=>w.arm===c.arm&&w.cohort===c.cohort&&w.seed===c.seed);
  if(!w||w.battles!==c.battles||w.scoresSha256!==c.scoresSha256)throw Error('Mismatch '+c.arm);}
 if(cold.runs.length!==3)throw Error('Expected3 cold score files');
 const evidence={status:'PASS',scoreFiles:3,battles:60,scope:'Full scores CSV SHA256 equality with persistent runs on same3 paired arm contexts, not additional independent performance sample.'};
 fs.writeFileSync('C:/Maor/CodeGuru/corewars8086-lab/.arena/ppppp-comparison-20261004/cold-verification.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
}else{
 const parentPlan=JSON.parse(fs.readFileSync(path.join(session,'plans',parent+'.json')));
 const plan={...parentPlan,id,cohorts:[parentPlan.cohorts[0]]};
 fs.writeFileSync(planFile,JSON.stringify(plan,null,2)+'\n',{flag:'wx'});console.log(planFile);
}
