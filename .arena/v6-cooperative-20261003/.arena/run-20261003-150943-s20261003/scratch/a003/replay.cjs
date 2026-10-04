const fs=require('fs'),path=require('path'),cp=require('child_process');
const root='C:/Maor/CodeGuru/corewars8086-lab', own=root+'/.arena/v6-cooperative-20261003/.arena/run-20261003-150943-s20261003/scratch/a003';
const plan=JSON.parse(fs.readFileSync(root+'/.arena/v6-cooperative-20261003/plans/bstack400-refine.json','utf8'));
const results=JSON.parse(fs.readFileSync(root+'/.arena/v6-cooperative-20261003/results/bstack400-refine-persistent.json','utf8'));
const chosen=results.runs.filter(x=>x.arm==='original_v6').sort((a,b)=>a.team-b.team).slice(0,5);
const java=root+'/tools/temurin8-jdk/jdk8u504-b01/bin/java.exe',jar=root+'/repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar';
for(const record of chosen){
 const cohort=plan.cohorts.find(x=>x.id===record.cohort),dest=own+'/replays/'+cohort.id,sv=dest+'/survivors',zd=dest+'/zombies';fs.mkdirSync(sv,{recursive:true});fs.mkdirSync(zd,{recursive:true});
 const teams=[{name:'CAND',warriors:plan.arms[0].warriors},...cohort.opponents];
 for(const t of teams)t.warriors.forEach((file,i)=>fs.copyFileSync(file,sv+'/'+t.name+(i+1)));
 for(const z of plan.zombies)fs.copyFileSync(z.path,zd+'/'+z.name);
 const args=[dest+'/observer.txt','--headless','--parallel=false','--threads','1','--comboSize','4','--battlesPerCombo','5','--seed',record.seed,'--warriorsDir',sv,'--zombiesDir',zd,'--outputFile',dest+'/scores.csv'];
 fs.writeFileSync(dest+'/context.json',JSON.stringify({sourcePlan:'bstack400-refine',selection:'five lowest original aggregated cohort scores',cohort,record,replayedBattleIndices:[0,1,2,3,4],args},null,2)+'\n');
 cp.execFileSync(java,['-cp',own+';'+jar,'ReplayObserver',...args],{stdio:'inherit'});
}
