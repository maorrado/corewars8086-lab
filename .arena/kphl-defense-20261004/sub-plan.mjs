import fs from 'node:fs';
import path from 'node:path';
const root='C:/Maor/CodeGuru/corewars8086-lab',here=path.join(root,'.arena/kphl-defense-20261004'),session=path.join(root,'.arena/v6-cooperative-20261003');
for(const [oldId,newId]of[['kphldef-20261004-field-screen','kphldef-20261004-sub-field-screen'],['kphldef-20261004-threat-screen-corrected','kphldef-20261004-sub-threat-screen']]){
 const p=JSON.parse(fs.readFileSync(path.join(session,'plans',oldId+'.json')));p.id=newId;p.arms=p.arms.filter(a=>a.id==='base');
 for(const id of ['di_sub','di_sub_alias','di_sub_ff9','di_sub_alias_ff9'])p.arms.push({id,warriors:['A','B'].map(w=>path.join(here,'sub-build',id+w))});
 fs.writeFileSync(path.join(session,'plans',newId+'.json'),JSON.stringify(p,null,2)+'\n',{flag:'wx'});
}console.log('Prepared additional same-seed exploration only, NOTfreshholdout.');
