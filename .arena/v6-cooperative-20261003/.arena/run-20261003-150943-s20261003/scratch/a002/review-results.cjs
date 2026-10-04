const fs=require('fs'),path=require('path'),crypto=require('crypto');
const base='C:/Maor/CodeGuru/corewars8086-lab/.arena/v6-cooperative-20261003';
const root='C:/Maor/CodeGuru/corewars8086-lab';
const shaCache=new Map();
const sha=p=>{p=path.resolve(p);if(!shaCache.has(p))shaCache.set(p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'));return shaCache.get(p);};
const names=['a001-b1-screen','a002-b1-screen','a003-b1-screen','bstack400-refine'];
const safe=s=>String(s).replace(/[^A-Za-z0-9_-]/g,'_');
const reports=[];
for(const name of names) {
  const file=path.join(base,'results',name+'-persistent.json');
  const r=JSON.parse(fs.readFileSync(file)), planFile=path.resolve(root,r.planPath),p=JSON.parse(fs.readFileSync(planFile));
  const errors=[];const ensure=(ok,msg)=>{if(!ok)errors.push(msg);};
  ensure(sha(planFile)===r.planSha256,'Plan hash differs');
  for(const [arm,warriors]of Object.entries(r.armHashes))for(const w of warriors){ensure(sha(path.resolve(root,w.path))===w.sha256,'Result arm digest differs '+arm);ensure(fs.statSync(path.resolve(root,w.path)).size===w.bytes,'Result arm size differs');}
  for(const [file,digest]of Object.entries(r.opponentHashes))ensure(sha(path.resolve(root,file))===digest,'Result opponent digest differs');
  for(const z of r.zombieHashes)ensure(sha(path.resolve(root,z.path))===z.sha256,'Result Zombie digest differs');
  const frozen=JSON.parse(fs.readFileSync(path.join(base,'runs',name+'-persistent','frozen-inputs.json')));
  ensure(frozen.plan===r.planSha256&&frozen.jar===r.engineJarSha256&&frozen.driver===r.driver.sourceSha256,'Frozen metadata differs');
  for(const [file,digest]of frozen.files)ensure(sha(path.resolve(root,file))===digest,'Frozen input digest differs');
  ensure(p.teamName==='CAND'&&r.teamName==='CAND','Candidate team identity differs');
  ensure(p.cohorts.every(c=>c.opponents.length===3),'Cohort is not four-team');
  const contexts=p.cohorts.flatMap(c=>(c.seeds??p.seeds).map(seed=>({c,seed,key:c.id+'|'+seed})));
  const ctx=new Map(contexts.map(c=>[c.key,c]));
  const runs=new Map();
  let maxTeamWarriorError=0,maxTotalError=0,stageFiles=0;const zeroScoreDeficits=[];
  for(const run of r.runs) {
    const key=run.cohort+'|'+run.seed, full=run.arm+'|'+key;
    ensure(!runs.has(full),'Duplicate run '+full);runs.set(full,run);
    ensure(ctx.has(key),'Unexpected context '+key);ensure(run.battles===p.battles,'Wrong battle count');
    const context=ctx.get(key);if(!context)continue;
    ensure(JSON.stringify(Object.keys(run.opponents))===JSON.stringify(context.c.opponents.map(o=>o.name)),'Opponent identity/order mismatch');
    maxTeamWarriorError=Math.max(maxTeamWarriorError,Math.abs(run.team-run.w1-run.w2));
    const totalScore=run.team+Object.values(run.opponents).reduce((a,b)=>a+b,0), deficit=run.battles-totalScore;
    maxTotalError=Math.max(maxTotalError,Math.abs(deficit));
    if(deficit>1e-5)zeroScoreDeficits.push({arm:run.arm,cohort:run.cohort,seed:run.seed,deficit});
    ensure(totalScore>=-1e-5&&totalScore<=run.battles+1e-5,'Group score outside valid range');
    ensure(Math.abs(deficit-Math.round(deficit))<1e-5,'Group score deficit is not integral');
    const stage=path.join(base,'runs',name+'-persistent',safe(run.arm)+'__'+safe(run.cohort)+'__'+safe(run.seed));
    const arm=p.arms.find(a=>a.id===run.arm);
    for(const team of [{name:p.teamName,warriors:arm.warriors},...context.c.opponents])for(let i=0;i<team.warriors.length;i++) {
      const staged=path.join(stage,'survivors',safe(team.name)+(team.warriors.length===2?i+1:''));
      ensure(sha(staged)===sha(path.resolve(root,team.warriors[i])),'Staged warrior differs '+staged);stageFiles++;
    }
    for(const z of p.zombies){ensure(sha(path.join(stage,'zombies',safe(z.name)))===sha(path.resolve(root,z.path)),'Staged Zombie differs');stageFiles++;}
    ensure(sha(path.join(stage,'scores.csv'))===run.scoresSha256,'Stored score digest differs');
  }
  ensure(r.runs.length===contexts.length*p.arms.length,'Missing run');
  ensure(maxTeamWarriorError<1e-5,'Team score does not equal both survivors within CSV float accumulation tolerance');
  const summary={};
  for(const arm of p.arms) {
    const armRuns=contexts.map(c=>runs.get(arm.id+'|'+c.key));ensure(armRuns.every(Boolean),'Incomplete paired arm '+arm.id);
    const battleCount=armRuns.reduce((s,x)=>s+x.battles,0);
    const m={battles:battleCount};for(const col of ['team','w1','w2'])m[col]=armRuns.reduce((s,x)=>s+x[col],0)/battleCount;
    for(const k of Object.keys(m))ensure(Math.abs(m[k]-r.summary[arm.id][k])<1e-10,'Summary normalization differs');
    if(arm.id!=='original_v6') {
      const ds=contexts.map(c=>(runs.get(arm.id+'|'+c.key).team-runs.get('original_v6|'+c.key).team)/p.battles);
      const mean=ds.reduce((s,x)=>s+x,0)/ds.length, sd=Math.sqrt(ds.reduce((s,x)=>s+(x-mean)**2,0)/(ds.length-1));
      m.diff=mean;m.se=sd/Math.sqrt(ds.length);m.ci95=[mean-2.063899*m.se,mean+2.063899*m.se];
      m.w1Diff=m.w1-r.summary.original_v6.w1;m.w2Diff=m.w2-r.summary.original_v6.w2;
      m.wins=ds.filter(x=>x>1e-8).length;m.losses=ds.filter(x=>x< -1e-8).length;m.ties=ds.length-m.wins-m.losses;
      m.cohortEffects=contexts.map((c,i)=>({cohort:c.c.id,diff:ds[i],opponents:c.c.opponents.map(o=>o.name)})).sort((a,b)=>a.diff-b.diff);
      m.leaveOneOut=[(ds.reduce((s,x)=>s+x,0)-Math.max(...ds))/(ds.length-1),(ds.reduce((s,x)=>s+x,0)-Math.min(...ds))/(ds.length-1)];
    }
    summary[arm.id]=m;
  }
  const opps=p.cohorts.flatMap(c=>c.opponents.map(o=>o.name));
  reports.push({name,resultSha256:sha(file),engine:r.engineJarSha256,driver:r.driver.sourceSha256,contexts:contexts.length,cohorts:p.cohorts.length,uniqueOpponents:new Set(opps).size,opponentAppearances:opps.length,battlesPerContext:p.battles,zombies:p.zombies.map(z=>z.name),stageFilesVerified:stageFiles,maxTeamWarriorError,maxTotalError,zeroScoreDeficits,errors,summary});
}
fs.writeFileSync(path.join(__dirname,'review-results.json'),JSON.stringify(reports,null,2)+'\n');
for(const r of reports){console.log(r.name,JSON.stringify({...r,summary:undefined}));for(const [a,s]of Object.entries(r.summary))console.log(a,JSON.stringify({...s,cohortEffects:undefined}));}
