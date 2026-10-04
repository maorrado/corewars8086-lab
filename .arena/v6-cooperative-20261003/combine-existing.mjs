// Reuse already assembled, frozen components; do not edit any warrior source.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const s=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const best=JSON.parse(fs.readFileSync(path.join(s,'shared-best.json')));
if(best.revision<1||best.id!=='a003_pointerguard'||best.status!=='confirmed')throw Error('Wait for confirmed shared pointerguard baseline');
const catalog=JSON.parse(fs.readFileSync(path.join(s,'architectural-candidates.json'))).candidates;
const guard=catalog.find(c=>c.id==='a003_pointerguard');
const candidates=[guard];
for(const [name,bId] of [['guard_burstB','a001_burst_b'],['guard_bgap400','a003_bstackshift']]) {
 const b=catalog.find(c=>c.id===bId);
 const warriors=[guard.warriors[0],b.warriors[1]],sources=[guard.sources[0],b.sources[1]];
 candidates.push({id:name,warriors,sources,sha256:warriors.map(sha),sizes:warriors.map(p=>fs.statSync(p).size),hypothesis:'Exploratory combination of confirmed A guard with previously screened B component; no gain assumed.',provenance:'Original friend V6; guard by Arena a003, B modifications by Arena researchers. Exact frozen source/binary reuse.'});
}
const out=path.join(s,'confirmed-combinations.json');fs.writeFileSync(out,JSON.stringify({candidates},null,2)+'\n',{flag:'wx'});console.log(out);
