import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root='C:/Maor/CodeGuru/corewars8086-lab';
const here=path.join(root,'.arena/ppppp-comparison-20261004');
const session=path.join(root,'.arena/v6-cooperative-20261003');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const rank=(arr,salt)=>[...arr].sort((a,b)=>crypto.createHash('sha256').update(salt+'|'+a.name).digest('hex').localeCompare(crypto.createHash('sha256').update(salt+'|'+b.name).digest('hex')));
const stage=(source,name,expected)=>{
 if(sha(source)!==expected)throw Error('Input hash mismatch '+source);
 const dest=path.join(here,'frozen',name);fs.mkdirSync(path.dirname(dest),{recursive:true});
 if(fs.existsSync(dest)){if(sha(dest)!==expected)throw Error('Existing copy differs '+dest);}
 else fs.copyFileSync(source,dest);
 return dest;
};
const newPair=[stage('C:/Users/ronyr/Downloads/PPPPPPlayer_P1','PPPPPPlayer_P1','605880ba552c3d43c5cd175693b1942cf401c60c2135f62ab76a97dc20d1b051'),stage('C:/Users/ronyr/Downloads/PPPPPPlayer_P2','PPPPPPlayer_P2','011720f6ae95c4b225ee92acfcbe4e373e6c56d78fadde3b11268a162529f334')];
const guard=[stage(path.join(session,'best/V6GuardA'),'V6GuardA','71164c8d7308766cd14d64ac6d1342cd1631afce98278fe9dca4d4ab14a3b3f3'),stage(path.join(session,'best/V6GuardB'),'V6GuardB','8579e2c2212d72a413a6daacfe3b91ceb72be648bfc085bfeed9430eeaf6657a')];
const noHunt=[stage(path.join(here,'build/V6nohuntA'),'V6nohuntA','6861894f3c1992cd6c6baa5b2a746178082f5b4b0a1d9969b9a326fe03d86c89'),stage(path.join(root,'study-notes/good-test-v6/original-binaries/Good_Test_V6_2'),'V6nohuntB','8579e2c2212d72a413a6daacfe3b91ceb72be648bfc085bfeed9430eeaf6657a')];
const arms=[{id:'PPPPP_combo_zrl03',warriors:newPair},{id:'V6Guard',warriors:guard},{id:'Claude_V6nohunt',warriors:noHunt}];
const pool=JSON.parse(fs.readFileSync(path.join(session,'pool.json')));
const zombies=pool.zombies.map(z=>({name:z.name,path:z.path}));
const write=(file,data)=>fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
const plans=path.join(session,'plans');
for(const phase of ['alpha','beta']) {
 const id='ppppp-20261004-field-'+phase;
 const cohorts=[];
 for(let p=0;p<3;p++) {
  const arr=rank(pool.pool,id+'|p'+p);
  for(let i=0;i<arr.length;i+=3)cohorts.push({id:`p${p}-c${i/3}`,opponents:arr.slice(i,i+3).map(t=>({name:t.name,warriors:t.warriors})),seeds:[id+'|p'+p+'|c'+i/3]});
 }
 write(path.join(plans,id+'.json'),{id,teamName:'CAND',battles:20,telemetry:false,arms,cohorts,zombies});
}
const id='ppppp-20261004-duels',cohorts=[];
for(const opponent of arms.slice(1))for(let p=0;p<2;p++)for(const name of ['AAAA_Reference','ZZZZ_Reference'])cohorts.push({id:opponent.id+'-p'+p+'-'+name,opponents:[{name,warriors:opponent.warriors}],seeds:['ppppp-duel-20261004|p'+p]});
write(path.join(plans,id+'.json'),{id,teamName:'CAND',battles:100,telemetry:false,arms:[arms[0]],cohorts,zombies});
write(path.join(here,'protocol.json'),{
 frozenAt:new Date().toISOString(),scope:'75 published 2025 online-stage teams, not actual finals or universal superiority',
 userInputsIdenticalTo:'combo_zrl03, both exact SHA256 matches with archived comparison',
 arms:arms.map(a=>({...a,files:a.warriors.map(w=>({path:w,bytes:fs.statSync(w).size,sha256:sha(w)}))})),
 primary:{phases:['alpha','beta'],battlesPerArmPerPhase:1500,totalBattlesPerArm:3000,pairedUnitsPerPhase:75,
 statistic:'paired cohort/seed mean differences; nominal95CI and Bonferroni-adjusted simultaneous95CI for2 planned PPPPP contrasts',
 decision:'Clear winner vs both references only if simultaneous intervals exclude0 in the same direction. Otherwise report unresolved differences; no candidate optimization.'},
 duels:{battlesPerOpponent:400,independentSeedStrings:2,loadOrderChecks:2,zombies:4,scope:'Exact chosen seeds; contextual, not general-field superiority.'},
 controls:'Frozen binaries, same CAND name and opponents/seeds across field arms, unmodified deterministic v6 engine. No final/, commit, push or game-rule edits.'
});
console.log(JSON.stringify(arms.map(a=>({id:a.id,files:a.warriors.map(w=>({bytes:fs.statSync(w).size,sha256:sha(w)}))})),null,2));
