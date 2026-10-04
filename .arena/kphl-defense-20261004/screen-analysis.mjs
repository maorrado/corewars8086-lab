import fs from 'node:fs';
import path from 'node:path';
const root='C:/Maor/CodeGuru/corewars8086-lab',here=path.join(root,'.arena/kphl-defense-20261004'),session=path.join(root,'.arena/v6-cooperative-20261003');
const out={schema:'exploratory-KPHL-defense-screen-v1',phase:'exploration_only_not_confirmation'};
for(const [key,id]of[['field','kphldef-20261004-field-screen'],['threat','kphldef-20261004-threat-screen-corrected']]){
 const f=path.join(session,'results/'+id+'-persistent.json');if(!fs.existsSync(f))continue;
 const r=JSON.parse(fs.readFileSync(f)),base=new Map(r.runs.filter(x=>x.arm==='base').map(x=>[x.cohort+'|'+x.seed,x]));
 const rows=Object.entries(r.summary).map(([id,s])=>{const rs=r.runs.filter(x=>x.arm===id),diff=rs.map(x=>x.team/x.battles-base.get(x.cohort+'|'+x.seed).team/x.battles);
  const row={id,mean:s.team,diff:diff.reduce((s,d)=>s+d,0)/diff.length,identicalFullCSV:rs.filter(x=>x.scoresSha256===base.get(x.cohort+'|'+x.seed).scoresSha256).length,units:rs.length};
  if(key==='threat'){
   const groups=[...new Set(rs.map(x=>x.cohort.replace(/-s\d+$/,'')))];row.counterScores=Object.fromEntries(groups.map(g=>{const xs=rs.filter(x=>x.cohort.startsWith(g+'-s')),bs=xs.reduce((s,x)=>s+x.battles,0);return[g,{battles:bs,mean:xs.reduce((s,x)=>s+x.team,0)/bs,baseMean:xs.reduce((s,x)=>s+base.get(x.cohort+'|'+x.seed).team,0)/bs}];}));
  }return row;
 });out[key]={id,rows:rows.sort((a,b)=>b.mean-a.mean)};
}
fs.writeFileSync(path.join(here,'screen-analysis.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out,null,2));
