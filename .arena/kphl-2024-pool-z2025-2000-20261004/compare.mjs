import fs from 'node:fs';
import path from 'node:path';
const root='C:/Maor/CodeGuru/corewars8086-lab',here=path.join(root,'.arena/kphl-2024-pool-z2025-2000-20261004');
const old=JSON.parse(fs.readFileSync(path.join(root,'.arena/kphl-joint-2024-2000-20261004/result-2024.json'))),now=JSON.parse(fs.readFileSync(path.join(here,'result-2025.json')));
if(old.battles!==2000||now.battles!==2000||old.teamCount!==15||now.teamCount!==15||old.engineJarSha256!==now.engineJarSha256)throw Error('Notmatchedengine/counts');
if(old.runs.length!==now.runs.length||old.runs.some((r,i)=>r.seed!==now.runs[i].seed||JSON.stringify(r.teams)!==JSON.stringify(now.runs[i].teams)))throw Error('Cohorts/seeds differ');
const table=now.ranking.map(g=>{const o=old.ranking.find(t=>t.name===g.name);if(!o||o.appearances!==g.appearances)throw Error('Appearance mismatch');return{name:g.name,kind:g.kind,appearances:g.appearances,rank2024Zombies:o.rank,points2024Zombies:o.points,rank2025Zombies:g.rank,points2025Zombies:g.points,diff:g.points-o.points,perAppearance2024:o.perAppearance,perAppearance2025:g.perAppearance};});
const out={schema:'same15-Zombiepack-comparison-v1',battlesPerPack:2000,engine:'Sameunmodifieddeterministicv6',sameCohortsSeeds:true,scope:'OnlygameinputchangedisZombiepack, including numberofZombies6->4. This can affect seededinitialization and is NOTa claimofidenticalplacements or2025rulesreplay.',winner:table[0],candidates:table.filter(g=>g.kind==='candidate'),table};
fs.writeFileSync(path.join(here,'comparison.json'),JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(out,null,2));
