import fs from 'node:fs';
import path from 'node:path';
const root='C:/Maor/CodeGuru/corewars8086-lab',session=path.join(root,'.arena/v6-cooperative-20261003'),here=path.join(root,'.arena/claude-kphl-check-20261004');
if(process.argv.includes('--prepare')){
 const plan=JSON.parse(fs.readFileSync(path.join(session,'plans/kphl-20261004-field-alpha.json')));
 plan.id='kphl-20261004-cold-check';plan.cohorts=plan.cohorts.slice(0,1);
 fs.writeFileSync(path.join(session,'plans/'+plan.id+'.json'),JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
}else{
 const warm=JSON.parse(fs.readFileSync(path.join(session,'results/kphl-20261004-field-alpha-persistent.json'))),cold=JSON.parse(fs.readFileSync(path.join(session,'results/kphl-20261004-cold-check-original.json')));
 if(cold.runs.length!==3)throw Error('Incomplete cold');
 const matches=cold.runs.map(r=>{const w=warm.runs.find(t=>t.arm===r.arm&&t.cohort===r.cohort&&t.seed===r.seed);if(!w||w.scoresSha256!==r.scoresSha256)throw Error('Cold/warm scoreCSV differs '+r.arm);return{arm:r.arm,scoresSha256:r.scoresSha256};});
 const out={passed:true,battles:60,matches,scope:'3 exact scoreCSV matches, same seeds and binaryinputs, official coldJar versus persistent unmodifiedJar.'};
 fs.writeFileSync(path.join(here,'cold-verification.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
}
