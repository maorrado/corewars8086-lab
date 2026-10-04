import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root='C:/Maor/CodeGuru/corewars8086-lab',session=path.join(root,'.arena/v6-cooperative-20261003'),here=path.join(root,'.arena/claude-kphl-check-20261004');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),names=['Claude_KPHL','V6Guard','Claude_V6nohunt'];
const phaseNames=process.argv.includes('--alpha-only')?['alpha']:['alpha','beta'];
const tq=(z,d)=>z+(z**3+z)/(4*d)+(5*z**5+16*z**3+3*z)/(96*d**2)+(3*z**7+19*z**5+17*z**3-15*z)/(384*d**3)+(79*z**9+776*z**7+1482*z**5-1920*z**3-945*z)/(92160*d**4);
const units=[],allRuns=[],phases=[];
for(const p of phaseNames){
 const f=path.join(session,'results/kphl-20261004-field-'+p+'-persistent.json'),r=JSON.parse(fs.readFileSync(f));
 if(r.runs.length!==225)throw Error('Incomplete field '+f);
 const byUnit=new Map();
 for(const run of r.runs){if(!Number.isFinite(run.team)||run.battles!==20||!names.includes(run.arm))throw Error('Invalid run');
  const k=run.cohort+'|'+run.seed;if(!byUnit.has(k))byUnit.set(k,{});
  if(byUnit.get(k)[run.arm])throw Error('Duplicate paired run');byUnit.get(k)[run.arm]=run;allRuns.push(run);
 }
 for(const u of byUnit.values()){if(names.some(n=>!u[n]))throw Error('Missing paired arm');units.push(u);}
 phases.push({id:r.planId,resultSha256:sha(f),summary:r.summary,elapsedSeconds:r.elapsedSeconds});
}
const summary=Object.fromEntries(names.map(n=>{const rs=allRuns.filter(r=>r.arm===n),b=rs.reduce((s,r)=>s+r.battles,0),points=rs.reduce((s,r)=>s+r.team,0);return[n,{battles:b,points,perBattle:points/b,w1:rs.reduce((s,r)=>s+r.w1,0)/b,w2:rs.reduce((s,r)=>s+r.w2,0)/b}];}));
function contrast(first,second){const ds=units.map(u=>u[first].team/u[first].battles-u[second].team/u[second].battles),m=ds.reduce((s,d)=>s+d,0)/ds.length,se=Math.sqrt(ds.reduce((s,d)=>s+(d-m)**2,0)/(ds.length-1)/ds.length),w=ds.filter(d=>d>1e-9).length,l=ds.filter(d=>d< -1e-9).length;
 return{first,second,pairedUnits:ds.length,diff:m,relativeDiff:m/summary[second].perBattle,se,ci95:[m-tq(1.959963984540054,ds.length-1)*se,m+tq(1.959963984540054,ds.length-1)*se],simultaneous95ForTwo:[m-tq(2.241402727604947,ds.length-1)*se,m+tq(2.241402727604947,ds.length-1)*se],wins:w,ties:ds.length-w-l,losses:l};}
const result={schema:'independent-KPHL-check-v1',generatedAt:new Date().toISOString(),phaseNames,summary,contrasts:[contrast(names[0],names[1]),contrast(names[0],names[2])],secondaryGuardVsNoHunt:contrast(names[1],names[2]),phases,
 scope:'75 published2025 online-stage teams, same3-opponent cohorts and4 liveZombies. Not actualfinals nor universalstrongest.',uncertainty:'Paired Student-t approximations over cohort/seed units. Bonferroni2 primary contrasts; repeated fixed-population sampling, not a test of unknown2026 opponents.',protocol:JSON.parse(fs.readFileSync(path.join(here,'protocol.json'))),sourceReassembly:JSON.parse(fs.readFileSync(path.join(here,'build/manifest.json')))};
const duelFile=path.join(session,'results/kphl-20261004-duels-persistent.json');
if(fs.existsSync(duelFile)){
 const duel=JSON.parse(fs.readFileSync(duelFile));if(duel.runs.length!==4)throw Error('Incomplete duel');
 result.duels=Object.fromEntries(names.slice(1).map(n=>{const rs=duel.runs.filter(r=>r.cohort.startsWith(n+'-')),b=rs.reduce((s,r)=>s+r.battles,0),cand=rs.reduce((s,r)=>s+r.team,0),ref=rs.reduce((s,r)=>s+Object.values(r.opponents).reduce((a,v)=>a+v,0),0);
 return[n,{battles:b,pointsKPHL:cand,pointsReference:ref,perBattleKPHL:cand/b,perBattleReference:ref/b,contexts:rs.map(r=>({cohort:r.cohort,seed:r.seed,pointsKPHL:r.team,pointsReference:Object.values(r.opponents)[0]}))}];}));
}
const coldFile=path.join(here,'cold-verification.json');if(fs.existsSync(coldFile))result.coldVerification=JSON.parse(fs.readFileSync(coldFile));
result.totalExecutedBattleCount=allRuns.reduce((s,r)=>s+r.battles,0)+(result.duels?400:0)+(result.coldVerification?.battles??0);
fs.writeFileSync(path.join(here,phaseNames.length===1?'alpha-analysis.json':'analysis.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({summary,contrasts:result.contrasts,duels:result.duels,totalExecutedBattleCount:result.totalExecutedBattleCount},null,2));
