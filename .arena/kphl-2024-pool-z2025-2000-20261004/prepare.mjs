import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root='C:/Maor/CodeGuru/corewars8086-lab',here=path.join(root,'.arena/kphl-2024-pool-z2025-2000-20261004');
const oldPath=path.join(root,'.arena/kphl-joint-2024-2000-20261004/plan-2024.json'),p=JSON.parse(fs.readFileSync(oldPath));
const z=JSON.parse(fs.readFileSync(path.join(root,'.arena/kphl-joint-leagues-20261004/plan-2025.json'))).zombies;
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
for(const t of p.teams)for(const f of t.files)if(sha(f.path)!==f.sha256)throw Error('Frozen survivor differs');
for(const f of z)if(sha(f.path)!==f.sha256)throw Error('Frozen Zombie differs');
if(p.battles!==2000||p.teams.length!==15||p.zombies.length!==6||z.length!==4)throw Error('Unexpected previous protocol');
const out={...p,year:'2025',opponentsYear:'2024',zombieYear:'2025',zombies:z,preparedAt:new Date().toISOString(),previousPlanSha256:sha(oldPath),
 scope:'Same12 archived2024final opponents + KPHL,V6nohunt,Guard; replaced6 final2024 Zombies by4 live2025 Zombies. Currentv6. NOTactual2025finals orhistoricalreplay.',
 comparison:'The only changed gameinput is the Zombiepack. Survivor binaries, teams,2000cohorts,seedstrings and appearancecounts are unchanged. FewerZombies may affect seededinitialization/RNG consumption; same seedstrings do NOTpromise identicalsurvivorplacements.'};
fs.writeFileSync(path.join(here,'plan-2025.json'),JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({battles:out.battles,teams:out.teams.length,zombies:out.zombies.length,counts:out.counts,unchangedJobs:JSON.stringify(out.jobs)===JSON.stringify(p.jobs)}));
