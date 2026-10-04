import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root='C:/Maor/CodeGuru/corewars8086-lab',here=path.join(root,'.arena/kphl-defense-20261004'),session=path.join(root,'.arena/v6-cooperative-20261003'),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const arms=[{id:'base',warriors:['A','B'].map(w=>path.join(here,'build/base'+w))},{id:'KPHLGuard',warriors:['A','B'].map(w=>path.join(here,'sub-build/di_sub'+w))}];
const pool=JSON.parse(fs.readFileSync(path.join(session,'pool.json'))),zombies=pool.zombies.map(z=>({name:z.name,path:z.path})),rank=(arr,salt)=>[...arr].sort((a,b)=>crypto.createHash('sha256').update(salt+'|'+a.name).digest('hex').localeCompare(crypto.createHash('sha256').update(salt+'|'+b.name).digest('hex')));
const write=(file,d)=>fs.writeFileSync(file,JSON.stringify(d,null,2)+'\n',{flag:'wx'});
write(path.join(here,'confirmation-selection.json'),{selectedAt:new Date().toISOString(),variant:'di_sub',name:'KPHLGuard',scope:'Defenseonly, notclaimofgeneralstrengthgain. Replacephoenix_init XOR DI,DI by SUB DI,DI inbothwarriors;onebytechangedperbinary, sameinstructioncount.',reason:'Mechanicallysmallest defense: removesboth old160731FF andsimple reordered31FF1607 signatures; exploratory250fieldbattles exactlysamepoints asbaseline. Secondaryaliases/shifts regress field. Freshconfirmation plans generatedbefore readingtheirresults.',arms:arms.map(a=>({...a,hashes:a.warriors.map(sha)})),decision:'Requirefreshcountergain+no observedmaterialfieldloss. Primaryboot_hunter gain; othercountersreported. Generalfieldnoninferiority margin0.005points/battle with95pairedinterval, no claimofzero lossagainst everypossiblecode.'});
for(const phase of ['alpha','beta']){
 const id='kphldef-20261004-confirm-field-'+phase,cohorts=[];
 for(let p=0;p<3;p++){
  const order=rank(pool.pool,id+'|p'+p);
  for(let i=0;i<order.length;i+=3)cohorts.push({id:`p${p}-c${i/3}`,opponents:order.slice(i,i+3).map(t=>({name:t.name,warriors:t.warriors})),seeds:[id+'|p'+p+'|c'+i/3]});
 }
 write(path.join(session,'plans',id+'.json'),{id,teamName:'CAND',battles:20,telemetry:false,arms,cohorts,zombies});
}
const id='kphldef-20261004-confirm-counters',cohorts=[];
for(const name of ['boot_hunter','boot_adapted','anchor_hunter','lattice52','lattice32','cell_poisoner'])for(let s=0;s<4;s++){
 const d=name==='anchor_hunter'?'counter-recheck':'build',warriors=['A','B'].map(w=>path.join(here,d,name+w));
 cohorts.push({id:name+'-s'+s,opponents:[{name:'Counter_'+name,warriors}],seeds:[id+'|'+name+'|s'+s]});
}
write(path.join(session,'plans',id+'.json'),{id,teamName:'CAND',battles:50,telemetry:true,arms,cohorts,zombies});
const screen=JSON.parse(fs.readFileSync(path.join(session,'plans/kphldef-20261004-threat-screen-corrected.json')));
const mod='kphldef-20261004-confirm-modern';
write(path.join(session,'plans',mod+'.json'),{id:mod,teamName:'CAND',battles:50,telemetry:false,arms,cohorts:screen.cohorts.filter(c=>!c.opponents[0].name.startsWith('Counter_')).map((c,i)=>({...c,seeds:[mod+'|'+i]})),zombies});
const cold=JSON.parse(fs.readFileSync(path.join(session,'plans/kphldef-20261004-confirm-field-alpha.json')));cold.id='kphldef-20261004-confirm-cold';cold.cohorts=cold.cohorts.slice(0,1);
write(path.join(session,'plans',cold.id+'.json'),cold);
console.log('Selectedone minimaldefense. Freshfield3000/arm,counters1200/arm,modern300/arm,cold40excluded.');
