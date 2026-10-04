const fs=require('fs'),path=require('path'),crypto=require('crypto');
const foreign='C:/Maor/CodeGuru/corewars8086-agent2';
const frontier=path.join(foreign,'agent2/frontier-20261003');
const out=path.join(__dirname,'frozen-stress-pools');
const modernPlanFile=path.join(frontier,'frontier-v4-v6-screen.json');
const historicPlanFile=path.join(frontier,'frontier-v4-v6-2024live.json');
const expectedFile=path.join(frontier,'expected-hashes.json');
const modernPlan=JSON.parse(fs.readFileSync(modernPlanFile)),historicPlan=JSON.parse(fs.readFileSync(historicPlanFile)),expected=JSON.parse(fs.readFileSync(expectedFile));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const wanted=['m049','m050','e1p3','e1p4','b01d','combo_zrl03','combo_ah02','Good_Test_V4','zchain3','zchain4'];
if(fs.existsSync(out))throw new Error('Frozen output already exists; do not mutate it');
fs.mkdirSync(out,{recursive:true});
function freeze(poolName,teams,sourcePlanFile,description) {
  const pool=[],identities=[];const names=new Set();
  for(const team of teams) {
    if(names.has(team.name))throw Error('Duplicate team name '+team.name);names.add(team.name);
    if(team.warriors.length!==2)throw Error('Expected complete pair '+team.name);
    const dir=path.join(out,poolName,team.name);fs.mkdirSync(dir,{recursive:true});
    const records=team.warriors.map((relative,i)=>{
      const source=path.resolve(foreign,relative),bytes=fs.readFileSync(source),sha256=hash(bytes);
      if(team.name in expected){const e=expected[team.name][i===0?'A':'B'];if(e[0]!==bytes.length||e[1]!==sha256)throw Error('Expected frontier binary identity differs '+source);}
      const target=path.join(dir,i===0?'A':'B');fs.copyFileSync(source,target,fs.constants.COPYFILE_EXCL);
      if(hash(fs.readFileSync(target))!==sha256)throw Error('Frozen copy differs '+target);
      return {source,path:target,bytes:bytes.length,sha256};
    });
    pool.push({name:team.name,warriors:records.map(r=>r.path)});
    identities.push({name:team.name,warriors:records});
  }
  const manifest={schema:'v6-frozen-stress-pool-v1',description,sourcePlan:{path:sourcePlanFile,sha256:hash(fs.readFileSync(sourcePlanFile))},pool,identities};
  const target=path.join(out,poolName+'-pool.json');fs.writeFileSync(target,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  fs.copyFileSync(sourcePlanFile,path.join(out,poolName+'-source-plan.json'),fs.constants.COPYFILE_EXCL);
  console.log(JSON.stringify({manifest:target,manifestSha256:hash(fs.readFileSync(target)),teams:teams.length,maxWarriorBytes:Math.max(...identities.flatMap(t=>t.warriors.map(w=>w.bytes)))}));
}
const modern=wanted.map(name=>{const a=modernPlan.arms.find(a=>a.id===name);if(!a)throw Error('Missing modern arm '+name);return {name,warriors:a.warriors};});
freeze('modern',modern,modernPlanFile,'Exact copies of ten requested frontier reference pairs. Good_Test_V4 retains its source label/provenance; no performance claim or code modification.');
const historical=new Map();
for(const c of historicPlan.cohorts)for(const o of c.opponents){if(historical.has(o.name)&&JSON.stringify(historical.get(o.name).warriors)!==JSON.stringify(o.warriors))throw Error('Historical team changes between cohorts');historical.set(o.name,o);}
freeze('2024',[...historical.values()].sort((a,b)=>a.name.localeCompare(b.name)),historicPlanFile,'Unique historical 2024 live survivor pairs extracted from the two-partition frontier-v4-v6-2024live plan. That source plan uses the 2025 Zombie pack; this pool contains survivor binaries only and does not prescribe a Zombie pack.');
fs.copyFileSync(expectedFile,path.join(out,'modern-source-expected-hashes.json'),fs.constants.COPYFILE_EXCL);
