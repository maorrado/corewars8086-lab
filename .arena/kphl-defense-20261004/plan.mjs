import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root='C:/Maor/CodeGuru/corewars8086-lab',here=path.join(root,'.arena/kphl-defense-20261004'),session=path.join(root,'.arena/v6-cooperative-20261003');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n',{flag:'wx'});
const pool=JSON.parse(fs.readFileSync(path.join(session,'pool.json'))),zombies=pool.zombies.map(z=>({name:z.name,path:z.path}));
const rank=(arr,salt)=>[...arr].sort((a,b)=>crypto.createHash('sha256').update(salt+'|'+a.name).digest('hex').localeCompare(crypto.createHash('sha256').update(salt+'|'+b.name).digest('hex')));
const ids=['base','alias_both','alias_A','alias_B','shift_ffa','shift_ff9','shift_ff8','shift_ffc','alias_ffa','alias_ff9','alias_ff8','boot_order','boot_alias','boot_ff9','boot_alias_ff9','cells','boot_cells','boot_cells_alias'];
const arms=ids.map(id=>({id,warriors:['A','B'].map(w=>path.join(here,'build',id+w))}));
if(sha(arms[0].warriors[0])!=='1e9efbcb54cb79f1da0ecaaf41f84418043ff97c93bdef2c1f2eba9a430d262a'||sha(arms[0].warriors[1])!=='dd73fad407df01a6890dbab26b895320bc1a81ff4c3ed35b9a3a584b2daee1c7')throw Error('Baseline notKPHL');
for(const a of arms)for(const f of a.warriors)if(fs.statSync(f).size>256)throw Error('Oversize');
const spec=[['boot_hunter','160731ff'],['boot_adapted','31ff1607'],['anchor_hunter','ff1fcccc']];
for(const [name,patt]of spec)for(const w of ['A','B'])if(fs.readFileSync(path.join(here,'build',name+w)).includes(Buffer.from(patt,'hex')))throw Error('Synthetichunter selfmatches '+name);
const fieldId='kphldef-20261004-field-screen',ordered=rank(pool.pool,fieldId),field=[];
for(let i=0;i<ordered.length;i+=3)field.push({id:'c'+i/3,opponents:ordered.slice(i,i+3).map(t=>({name:t.name,warriors:t.warriors})),seeds:[fieldId+'|c'+i/3]});
write(path.join(session,'plans',fieldId+'.json'),{id:fieldId,teamName:'CAND',battles:10,telemetry:false,arms,cohorts:field,zombies});
const synthetic=['boot_hunter','boot_adapted','anchor_hunter','lattice52','lattice32','cell_poisoner'].map(name=>({name:'Counter_'+name,warriors:['A','B'].map(w=>path.join(here,'build',name+w))}));
const refs=[{name:'Reference_Guard',warriors:[path.join(session,'best/V6GuardA'),path.join(session,'best/V6GuardB')]},...['A_HRZ_BinaryBandits','A_IND_BRA'].map(n=>pool.pool.find(t=>t.name===n))];
const threatId='kphldef-20261004-threat-screen',cohorts=[];
for(const t of [...synthetic,...refs])for(let j=0;j<2;j++)cohorts.push({id:t.name+'-s'+j,opponents:[{name:t.name,warriors:t.warriors}],seeds:[threatId+'|'+t.name+'|s'+j]});
write(path.join(session,'plans',threatId+'.json'),{id:threatId,teamName:'CAND',battles:20,telemetry:false,arms,cohorts,zombies});
write(path.join(here,'protocol.json'),{baseline:'FrozenClaudeKPHL214/222, exactSHA checked',preparedAt:new Date().toISOString(),arms:arms.map(a=>({...a,files:a.warriors.map(f=>({path:f,sha256:sha(f),bytes:fs.statSync(f).size}))})),syntheticCounters:synthetic.map(t=>({...t,hashes:t.warriors.map(sha)})),
 scope:'Defenseimplementation.18 totalarms includebaseline17variants. Onlyexploratoryscreen250fieldbattles/arm+360duelbattles/arm. Notconfirmation, no finalpromotion.',
 next:'Selectone defensivecandidate afterscreens. Require freshfieldcontrols and freshprimarycountertests before improveddefense claim. Broadfieldregressions quantified; equality/neutrality is allowed for a measured defense gain, not claimed as generalstrength increase. Adaptivecounternegativecontrols included; no immunityclaim.',
 provenance:'V6 friendbase, ClaudeKPHL, Codexdefense changes. Syntheticcounters are new simulation programs, not realcompetition submissions.'});
console.log(JSON.stringify({arms:arms.length,fieldBattlesPerArm:250,threatBattlesPerArm:360,fieldId,threatId}));
