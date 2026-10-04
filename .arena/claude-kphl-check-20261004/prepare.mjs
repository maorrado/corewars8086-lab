import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root='C:/Maor/CodeGuru/corewars8086-lab',here=path.join(root,'.arena/claude-kphl-check-20261004'),session=path.join(root,'.arena/v6-cooperative-20261003');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const rank=(arr,salt)=>[...arr].sort((a,b)=>crypto.createHash('sha256').update(salt+'|'+a.name).digest('hex').localeCompare(crypto.createHash('sha256').update(salt+'|'+b.name).digest('hex')));
const stage=(source,name,expected)=>{
 if(sha(source)!==expected)throw Error('Input hash mismatch '+source);
 const dest=path.join(here,'frozen',name);fs.mkdirSync(path.dirname(dest),{recursive:true});
 if(fs.existsSync(dest)){if(sha(dest)!==expected)throw Error('Existing copy differs '+dest);}else fs.copyFileSync(source,dest);
 return dest;
};
const kphl=[stage(path.join(here,'build/KPHLA'),'KPHLA','1e9efbcb54cb79f1da0ecaaf41f84418043ff97c93bdef2c1f2eba9a430d262a'),stage(path.join(here,'build/KPHLB'),'KPHLB','dd73fad407df01a6890dbab26b895320bc1a81ff4c3ed35b9a3a584b2daee1c7')];
const guard=[stage(path.join(session,'best/V6GuardA'),'V6GuardA','71164c8d7308766cd14d64ac6d1342cd1631afce98278fe9dca4d4ab14a3b3f3'),stage(path.join(session,'best/V6GuardB'),'V6GuardB','8579e2c2212d72a413a6daacfe3b91ceb72be648bfc085bfeed9430eeaf6657a')];
const noHunt=[stage(path.join(root,'.arena/ppppp-comparison-20261004/frozen/V6nohuntA'),'V6nohuntA','6861894f3c1992cd6c6baa5b2a746178082f5b4b0a1d9969b9a326fe03d86c89'),stage(path.join(root,'.arena/ppppp-comparison-20261004/frozen/V6nohuntB'),'V6nohuntB','8579e2c2212d72a413a6daacfe3b91ceb72be648bfc085bfeed9430eeaf6657a')];
const arms=[{id:'Claude_KPHL',warriors:kphl},{id:'V6Guard',warriors:guard},{id:'Claude_V6nohunt',warriors:noHunt}];
const pool=JSON.parse(fs.readFileSync(path.join(session,'pool.json'))),zombies=pool.zombies.map(z=>({name:z.name,path:z.path}));
const write=(file,data)=>fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n',{flag:'wx'}),plans=path.join(session,'plans');
for(const phase of ['alpha','beta']){
 const id='kphl-20261004-field-'+phase,cohorts=[];
 for(let p=0;p<3;p++){
  const arr=rank(pool.pool,id+'|p'+p);
  for(let i=0;i<arr.length;i+=3)cohorts.push({id:`p${p}-c${i/3}`,opponents:arr.slice(i,i+3).map(t=>({name:t.name,warriors:t.warriors})),seeds:[id+'|p'+p+'|c'+i/3]});
 }
 write(path.join(plans,id+'.json'),{id,teamName:'CAND',battles:20,telemetry:false,arms,cohorts,zombies});
}
const id='kphl-20261004-duels',cohorts=[];
for(const opponent of arms.slice(1))for(const name of ['AAAA_Reference','ZZZZ_Reference'])cohorts.push({id:opponent.id+'-'+name,opponents:[{name,warriors:opponent.warriors}],seeds:['kphl-duel-20261004-fresh|'+name]});
write(path.join(plans,id+'.json'),{id,teamName:'CAND',battles:100,telemetry:false,arms:[arms[0]],cohorts,zombies});
write(path.join(here,'protocol.json'),{frozenAt:new Date().toISOString(),arms:arms.map(a=>({...a,files:a.warriors.map(w=>({path:w,bytes:fs.statSync(w).size,sha256:sha(w)}))})),primary:{phases:['alpha','beta'],battlesPerArm:3000,pairedUnits:150,decision:'Two prespecified contrasts KPHL vs Guard and old noHunt, Student-t over paired cohort/seed means, Bonferroni simultaneous95 intervals. Otherwise unresolved.'},scope:'75 published2025 online-stage teams, three opponents plus candidate, four live2025 Zombies; not actual finals or universal superiority.',identity:'Separated user pasted code reassembled and checked against Claude rev1 KPHL exact SHA256.',duels:'Two name/loadorders, independently seeded,100 battles/context; secondary contextual comparison.',controls:'Same CAND name, cohorts and seeds per arm; unchanged deterministic v6 engine. No final/, commits, pushes, other checkout edits.'});
console.log(JSON.stringify(arms.map(a=>({id:a.id,files:a.warriors.map(w=>({bytes:fs.statSync(w).size,sha256:sha(w)}))})),null,2));
