import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root='C:/Maor/CodeGuru/corewars8086-lab';
const here=path.join(root,'.arena/kphl-defense-20261004');
const session=path.join(root,'.arena/v6-cooperative-20261003');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const get=(suffix,engine='persistent')=>JSON.parse(fs.readFileSync(path.join(session,'results/kphldef-20261004-confirm-'+suffix+'-'+engine+'.json')));
const critical=df=>{const t=[0,12.706205,4.302653,3.182446,2.776445,2.570582,2.446912,2.364624,2.306004,2.262157,2.228139,2.200985,2.178813,2.160369,2.144787,2.131450,2.119905,2.109816,2.100922,2.093024,2.085963,2.079614,2.073873,2.068658,2.063899,2.059539,2.055529,2.051831,2.048407,2.045230,2.042272];if(df<=30)return t[df];const z=1.959963985;return z+(z**3+z)/(4*df)+(5*z**5+16*z**3+3*z)/(96*df**2)+(3*z**7+19*z**5+17*z**3-15*z)/(384*df**3);};
function compare(runs){
 const base=new Map(runs.filter(r=>r.arm==='base').map(r=>[r.cohort+'|'+r.seed,r]));
 const fresh=runs.filter(r=>r.arm==='KPHLGuard'),diffs=fresh.map(r=>{const b=base.get(r.cohort+'|'+r.seed);if(!b||b.battles!==r.battles)throw Error('Unpaired run');return r.team/r.battles-b.team/b.battles;});
 const n=diffs.length,mean=diffs.reduce((a,b)=>a+b,0)/n,variance=n>1?diffs.reduce((a,b)=>a+(b-mean)**2,0)/(n-1):null,se=n>1?Math.sqrt(variance/n):null,margin=n>1?critical(n-1)*se:null;
 const totals=arm=>{const xs=runs.filter(r=>r.arm===arm),battles=xs.reduce((a,b)=>a+b.battles,0),points=xs.reduce((a,b)=>a+b.team,0);return{battles,points,pointsPerBattle:points/battles};};
 return{base:totals('base'),KPHLGuard:totals('KPHLGuard'),pairedUnits:n,meanPairedDifference:mean,pairedT95:margin===null?null:[mean-margin,mean+margin],identicalFullScores:fresh.filter(r=>r.scoresSha256===base.get(r.cohort+'|'+r.seed).scoresSha256).length,wins:diffs.filter(d=>d>0).length,ties:diffs.filter(d=>d===0).length,losses:diffs.filter(d=>d<0).length};
}
const alpha=get('field-alpha'),beta=get('field-beta'),counters=get('counters'),modern=get('modern'),cold=get('cold','original');
const field=compare([...alpha.runs,...beta.runs]);
const perCounter={};
for(const name of [...new Set(counters.runs.map(r=>Object.keys(r.opponents)[0]))])perCounter[name]=compare(counters.runs.filter(r=>Object.keys(r.opponents)[0]===name));
const perModern={};
for(const name of [...new Set(modern.runs.map(r=>Object.keys(r.opponents)[0]))])perModern[name]=compare(modern.runs.filter(r=>Object.keys(r.opponents)[0]===name));
const coldChecks=cold.runs.map(r=>{const original=alpha.runs.find(a=>a.arm===r.arm&&a.cohort===r.cohort&&a.seed===r.seed);return{arm:r.arm,cohort:r.cohort,seed:r.seed,fullCSVMatch:r.scoresSha256===original?.scoresSha256};});
if(coldChecks.some(r=>!r.fullCSVMatch))throw Error('Cold JVM control does not match persistent runner');
const byteAudit=['A','B'].map(w=>{const a=fs.readFileSync(path.join(here,'build/base'+w)),b=fs.readFileSync(path.join(here,'sub-build/di_sub'+w));const differences=[];if(a.length!==b.length)throw Error('Length changed');for(let i=0;i<a.length;i++)if(a[i]!==b[i])differences.push({offset:i,base:a[i].toString(16).padStart(2,'0'),guard:b[i].toString(16).padStart(2,'0')});if(differences.length!==1||differences[0].base!=='31'||differences[0].guard!=='29')throw Error('Unexpected binary difference');return{warrior:w,bytes:b.length,sha256:sha(path.join(here,'sub-build/di_sub'+w)),differences,oldBootstrapSignature:b.indexOf(Buffer.from('160731ff','hex')),newBootstrapSignature:b.indexOf(Buffer.from('160729ff','hex'))};});
const passed=field.pairedT95[0]>-0.005&&perCounter.Counter_boot_hunter.meanPairedDifference>0;
const report={schema:'KPHLGuard-defense-confirmation-v1',generatedAt:new Date().toISOString(),decision:passed?'PASS_TARGETED_DEFENSE_NO_MATERIAL_FIELD_LOSS':'FAIL',scope:'Bootstrap byte-signature camouflage only; NOT universal immunity, NOT a claim of general score gain.',change:'In phoenix_init of each warrior replace XOR DI,DI by SUB DI,DI. One byte per binary; same instruction count, size, registers and hot-loop code. Flags are overwritten before their next conditional use.',provenance:'Friend V6 -> Claude KPHL -> Codex KPHLGuard defense change.',fieldDescription:'Frozen 75 published 2025 online-stage teams, NOT verified 2025 finals; each battle uses candidate plus three opponents and all four 2025 zombies.',field,fieldAlpha:compare(alpha.runs),fieldBeta:compare(beta.runs),perCounter,perModern,coldChecks,byteAudit,noninferiorityMargin:0.005,statisticalUnit:'Paired cohort+seed result of 20 field battles or 50 counter battles, NOT individual survivors. Zero intervals when all sampled paired differences are exactly zero do not establish universal equivalence.',remainingWeaknesses:['An adapted hunter can target the new 160729FF signature; this removes known old-pattern matches, not all future attacks.','FF 1F far-call anchors and fixed lattice offsets remain unchanged.','Public zombie cells 4A17h/CC13h can still be poisoned or stolen.','Zombie competition, dense bombing and adversarial timing remain possible.'],artifacts:[alpha,beta,counters,modern,cold].map(r=>({plan:r.planPath,planSha256:r.planSha256,result:path.relative(root,path.join(session,'results',r.planId+'-'+r.engine+'.json')),engineJarSha256:r.engineJarSha256,armHashes:r.armHashes})),excludedFromFreshCounts:'40 battles in cold JVM replay, all exploratory screens, no selection changes based on fresh data.'};
fs.writeFileSync(path.join(here,'confirmation-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({decision:report.decision,field,perCounter,perModern,coldChecks,byteAudit},null,2));
