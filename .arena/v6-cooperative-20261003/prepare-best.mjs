// Validate the predeclared score gate and copy exact existing artifacts only.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const s=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const read=p=>JSON.parse(fs.readFileSync(path.join(s,p)));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const alpha=read('results/pointerguard-alpha-comparison.json');
const beta=read('results/pointerguard-beta-comparison.json');
const pooled=read('results/pointerguard-confirmation-pooled.json');
const id='a003_pointerguard';
if(alpha.arms[id].diff<=0||beta.arms[id].diff<=0||pooled.arms[id].ci95[0]<=0)throw Error('Confirmation gate failed');
const cold=read('pointerguard-cold-alpha-verification.json');if(cold.status!=='PASS'||cold.scoreFiles!==6)throw Error('Cold CLI check missing');
const stress={};
for(const mode of ['modern','2024','nozombies']){
 const r=read('results/pointerguard-'+mode+'-persistent.json');
 stress[mode]={battlesPerArm:r.summary.original_v6.battles,original:r.summary.original_v6.team,candidate:r.summary[id].team,diff:r.summary[id].team-r.summary.original_v6.team};
}
const c=read('wave5-candidates.json').candidates.find(c=>c.id===id);
const expected=read('confirmation-selection.json');
for(let i=0;i<2;i++)if(sha(c.warriors[i])!==expected.sha256[i]||fs.statSync(c.warriors[i]).size!==expected.sizes[i])throw Error('Chosen binary identity changed');
for(const file of ['pointerguard-confirm-alpha','pointerguard-confirm-beta']){
 const r=read('results/'+file+'-persistent.json');
 if(r.summary[id].battles!==3000||r.summary.original_v6.battles!==3000||r.engineJarSha256!=='31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d')throw Error('Holdout protocol changed');
 for(let i=0;i<2;i++)if(r.armHashes[id][i].sha256!==expected.sha256[i])throw Error('Wrong holdout warrior');
}
const dir=path.join(s,'best');fs.mkdirSync(dir,{recursive:true});
const binaries=[],sources=[];
for(let i=0;i<2;i++){
 const name='V6Guard'+(i?'B':'A'),bin=path.join(dir,name),src=path.join(dir,name+'.asm');
 for(const [from,to] of [[c.warriors[i],bin],[c.sources[i],src]]){
  if(fs.existsSync(to)){if(sha(from)!==sha(to))throw Error('Refusing overwrite '+to);}
  else fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);
 }
 binaries.push(bin);sources.push(src);
}
const manifest={schema:'cooperative-arena-validated-artifact-v1',id,name:'V6 Guard',provenance:'Original V6 by the user\'s friend; six-byte pointer guard and label rebasing by Arena researcher a003. B unchanged.',warriors:binaries,sources,sha256:expected.sha256,sizes:expected.sizes,primary:{scope:'Frozen75 published2025 teams, four2025 Zombies, paired four-team battles; not a guarantee for unknown competition.',alpha:alpha.arms[id],beta:beta.arms[id],pooled:pooled.arms[id],baseline:pooled.arms.original_v6,relativeGain:pooled.arms[id].diff/pooled.arms.original_v6.mean},cold,stress};
fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
