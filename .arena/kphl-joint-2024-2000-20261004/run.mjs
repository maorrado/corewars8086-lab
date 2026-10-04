import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
const root='C:/Maor/CodeGuru/corewars8086-lab',here=path.join(root,'.arena/kphl-joint-2024-2000-20261004'),agent2='C:/Maor/CodeGuru/corewars8086-agent2';
const year=process.argv[2];if(!['2024','2025'].includes(year))throw Error('Specify2024or2025');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const planPath=path.join(here,'plan-'+year+'.json'),p=JSON.parse(fs.readFileSync(planPath)),map=new Map(p.teams.map(t=>[t.name,t]));
const jar=path.join(agent2,'repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar'),java=path.join(agent2,'tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe'),driver=path.join(agent2,'agent2/tools/java/A2Batch.java');
if(sha(jar)!=='31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d')throw Error('Engine differs');
if(sha(driver)!=='32068d0d97e3f649788a40ccada2d5213719aa515c4832b73643e028a5069d8a')throw Error('Driver differs');
for(const t of p.teams)for(const f of t.files)if(sha(f.path)!==f.sha256)throw Error('Team input changed');
for(const z of p.zombies)if(sha(z.path)!==z.sha256)throw Error('Zombie input changed');
const rr=path.join(here,'runs-'+year);if(fs.existsSync(rr))throw Error('Existing runroot; use a newplan to rerun');fs.mkdirSync(rr);
const zd=path.join(rr,'zombies');fs.mkdirSync(zd);for(const z of p.zombies)fs.copyFileSync(z.path,path.join(zd,z.name));
const fields=['CW8086-SERIAL-BATCH-V1',String(p.jobs.length)];
for(const job of p.jobs){
 const dir=path.join(rr,job.id),sv=path.join(dir,'survivors');fs.mkdirSync(sv,{recursive:true});
 for(const name of job.teams){const t=map.get(name);t.files.forEach((f,i)=>fs.copyFileSync(f.path,path.join(sv,name+(t.files.length===1?'':i+1))));}
 const a=['--headless','--parallel=false','--threads','1','--comboSize','4','--battlesPerCombo','1','--seed',job.seed,'--warriorsDir',sv,'--zombiesDir',zd,'--outputFile',path.join(dir,'scores.csv')];
 fields.push(job.id,String(a.length),...a);
}
fields.push('');const manifest=path.join(rr,'jobs.nul');fs.writeFileSync(manifest,fields.join('\u0000'),{flag:'wx'});
const t0=Date.now(),cp=path.join(agent2,'agent2/tools/java/classes')+';'+jar;
await new Promise((resolve,reject)=>{const child=spawn(java,['-cp',cp,'A2Batch',manifest,'2'],{stdio:['ignore','inherit','inherit']});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Batch failed '+code)));});
const groups=Object.fromEntries(p.teams.map(t=>[t.name,{name:t.name,kind:t.kind,appearances:0,points:0,w1:0,w2:0}])),runs=[];
const parse=raw=>{let sec=null;const out={groups:{},warriors:{}};for(const row of raw.split(/\r?\n/)){const s=row.trim();if(s==='Groups:'){sec='groups';continue;}if(s==='Warriors:'){sec='warriors';continue;}if(!s||!sec)continue;const i=s.lastIndexOf(',');if(i<0)throw Error('MalformedCSV');out[sec][s.slice(0,i)]=Number(s.slice(i+1));}return out;};
for(const job of p.jobs){
 const f=path.join(rr,job.id,'scores.csv'),scores=parse(fs.readFileSync(f,'utf8'));
 if(Object.keys(scores.groups).length!==4||Object.keys(scores.groups).some(n=>!job.teams.includes(n)))throw Error('Missing/extra groups');
 let total=0;
 for(const name of job.teams){const t=map.get(name),v=scores.groups[name],w1=scores.warriors[name+(t.files.length===1?'':'1')],w2=t.files.length===1?0:scores.warriors[name+'2'];
  if(!Number.isFinite(v)||v<0||v>1.00001||!Number.isFinite(w1)||!Number.isFinite(w2)||Math.abs(w1+w2-v)>1e-5)throw Error('Invalidscores');
  const g=groups[name];g.appearances++;g.points+=v;g.w1+=w1;g.w2+=w2;total+=v;
 }
 if(total>1.00001)throw Error('Battle total exceeds1');
 runs.push({...job,scores,sha256:sha(f),scoreTotal:total});
}
for(const [name,g] of Object.entries(groups)){if(g.appearances!==p.counts[name])throw Error('Appearance mismatch');g.perAppearance=g.points/g.appearances;}
const ranking=Object.values(groups).sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name)).map((g,i)=>({...g,rank:i+1}));
const out={schema:'balanced-joint-league-result-v1',generatedAt:new Date().toISOString(),year,scope:p.scope,battles:runs.length,teamCount:p.teams.length,archiveTeams:p.teams.filter(t=>t.kind==='archive').length,zombies:p.zombies,engineJarSha256:sha(jar),driverSourceSha256:sha(driver),planSha256:sha(planPath),runnerSha256:sha(new URL(import.meta.url)),elapsedSeconds:(Date.now()-t0)/1000,ranking,runs,totalAwardedPoints:runs.reduce((s,r)=>s+r.scoreTotal,0),interpretation:'Raw graph ranking from one balanced2000battle schedule. All3 candidates have equalappearances. Not2000battles for eachteam, no universal or statisticallyproven superiority claim. Currentv6 for bothyears.'};
fs.writeFileSync(path.join(here,'result-'+year+'.json'),JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({year,battles:out.battles,teamCount:out.teamCount,archiveTeams:out.archiveTeams,elapsedSeconds:out.elapsedSeconds,totalAwardedPoints:out.totalAwardedPoints,candidates:ranking.filter(t=>t.kind==='candidate'),top5:ranking.slice(0,5)},null,2));
