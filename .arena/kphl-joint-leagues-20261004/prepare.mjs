import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root='C:/Maor/CodeGuru/corewars8086-lab',here=path.join(root,'.arena/kphl-joint-leagues-20261004');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const write=(p,obj)=>fs.writeFileSync(p,JSON.stringify(obj,null,2)+'\n',{flag:'wx'});
const rng=s=>{let h=crypto.createHash('sha256').update(s).digest(),i=0;return()=>{if(i+4>h.length){h=crypto.createHash('sha256').update(h).digest();i=0;}const v=h.readUInt32LE(i);i+=4;return v/2**32;};};
const safe=n=>n.replace(/[^A-Za-z0-9_-]/g,'_').replace(/[12]$/,d=>d+'_');
function stage(source,subdir,name,expected){
 const actual=sha(source);if(expected&&actual!==expected)throw Error('Input hash mismatch '+source);
 const dest=path.join(here,'frozen',subdir,name);fs.mkdirSync(path.dirname(dest),{recursive:true});
 if(fs.existsSync(dest)){if(sha(dest)!==actual)throw Error('Frozen copy differs '+dest);}else fs.copyFileSync(source,dest);
 return{path:dest,source,bytes:fs.statSync(dest).size,sha256:actual};
}
const prior=JSON.parse(fs.readFileSync(path.join(root,'.arena/claude-kphl-check-20261004/protocol.json')));
const candidates=prior.arms.map(a=>({name:safe(a.id),kind:'candidate',files:a.files.map((f,i)=>stage(f.path,'candidates',a.id+'_'+(i+1),f.sha256))}));
const p25=JSON.parse(fs.readFileSync(path.join(root,'.arena/v6-cooperative-20261003/pool.json')));
const teams25=p25.pool.map(t=>({name:safe(t.name),kind:'archive',files:t.files.map((f,i)=>stage(f.path,'2025',t.name+'_'+(i+1),f.sha256))}));
const z25=p25.zombies.map(z=>({name:z.name,...stage(z.path,'zombies2025',z.name,z.sha256)}));
const dir24=path.join(root,'repos/corewars8086-survivors/cgx2024/05-final2'),pairs=new Map();
for(const name of fs.readdirSync(dir24).sort()){
 if(!fs.statSync(path.join(dir24,name)).isFile())continue;
 const m=name.match(/^(.*)([12])$/);if(!m)throw Error('Unparsed archive file '+name);
 if(!pairs.has(m[1]))pairs.set(m[1],{});pairs.get(m[1])[m[2]]=path.join(dir24,name);
}
const teams24=[...pairs].map(([n,w])=>({name:safe('F24_'+n),kind:'archive',files:[w[1],w[2]].filter(Boolean).map((f,i)=>stage(f,'2024',n+'_'+(i+1)))}));
const zdir24=path.join(root,'repos/corewars8086-survivors/cgx2024/zombies/final');
const z24=fs.readdirSync(zdir24).sort().map(n=>({name:n,...stage(path.join(zdir24,n),'zombies2024',n)}));
for(const [year,archive,zombies,scope] of [
 ['2025',teams25,z25,'75 published online-stage2025 teams, NOT2025 finals; user explicitly approved substitution. Both junior/senior archived pools combined.'],
 ['2024',teams24,z24,'Senior2024 archived05-final2 submission set with2024 finalZombies, all12 teams. Currentv6 engine, NOThistoricalengine replay.']
]){
 const teams=[...candidates,...archive],battles=1000,salt='joint-league-kphl-20261004-'+year+'-fresh-alpha',r=rng(salt),n=teams.length;
 if(new Set(teams.map(t=>t.name)).size!==n)throw Error('Duplicate league name');
 const quota=Math.floor(4*battles/n),extra=4*battles%n;
 if(extra<3)throw Error('Cannot give3 candidates same extra appearance under this design');
 const rest=teams.slice(3).map(t=>({name:t.name,key:r()})).sort((a,b)=>a.key-b.key);
 const extras=new Set([...candidates.map(t=>t.name),...rest.slice(0,extra-3).map(t=>t.name)]);
 const counts=Object.fromEntries(teams.map(t=>[t.name,quota+(extras.has(t.name)?1:0)])),remaining={...counts},jobs=[];
 for(let j=0;j<battles;j++){
  // Largest-remaining quotas guarantee no repeated team within a4-team battle,
  // and exact, near-equal appearances. Random ties give a reproducible schedule.
  const chosen=teams.map(t=>({name:t.name,left:remaining[t.name],key:r()})).filter(t=>t.left>0).sort((a,b)=>b.left-a.left||a.key-b.key).slice(0,4);
  if(chosen.length!==4)throw Error('Incomplete scheduled battle');
  for(const t of chosen)remaining[t.name]--;
  jobs.push({id:'war'+String(j).padStart(4,'0'),teams:chosen.map(t=>t.name),seed:salt+'|'+j});
 }
 if(Object.values(remaining).some(v=>v!==0))throw Error('Unfilled league quotas');
 write(path.join(here,'plan-'+year+'.json'),{schema:'balanced-joint-league-v1',year,scope,battles,comboSize:4,salt,teams,zombies,counts,jobs,
  design:'Three candidates in the same league pool, NOTforced into every battle. Exact1000 totalwars. Three candidates have identical appearancecounts; allteams differ by atmost1. Randomized ties in largest-remaining quota scheduler, NOTiid native competition sampling. Fixed explicitcohorts make seeds replayable.',
  source:year==='2024'?'https://github.com/codeguru-il/corewars8086-survivors/tree/master/cgx2024/05-final2':'Repository frozen pool.json, official2025 onlinearchives',
  constraints:'No final/, game-rule, active-worktree, commit, push or otheragent edits. Rankings descriptive of this one1000battle draw.'});
 console.log(JSON.stringify({year,scope,archiveTeams:archive.length,totalTeams:n,zombies:zombies.length,battles,candidateAppearances:counts[candidates[0].name],min:Math.min(...Object.values(counts)),max:Math.max(...Object.values(counts))}));
}
