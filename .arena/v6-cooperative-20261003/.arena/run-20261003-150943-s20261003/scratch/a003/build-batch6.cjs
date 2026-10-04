const fs=require('fs'),path=require('path'),cp=require('child_process');
const root='C:/Maor/CodeGuru/corewars8086-lab';
const own=root+'/.arena/v6-cooperative-20261003/.arena/run-20261003-150943-s20261003/scratch/a003';
const base=JSON.parse(fs.readFileSync(root+'/.arena/v6-cooperative-20261003/shared-best.json','utf8'));
if(base.status!=='confirmed'||base.id!=='original_v6')throw Error('Rebase required');
const a=fs.readFileSync(root+'/study-notes/good-test-v6/source/V6_1.asm','utf8');
const b=fs.readFileSync(root+'/study-notes/good-test-v6/source/V6_2.asm','utf8');
const nearA=a.replace('mov dx, 04000h','mov dx, 043F8h'),nearB=b.replace('mov dx, 02400h','mov dx, 02BF8h');
const variants=[['recurring_near_a',nearA,b],['recurring_near_b',a,nearB],['recurring_near_ab',nearA,nearB]];
const src=own+'/batch6/src',bin=own+'/batch6/bin';fs.mkdirSync(src,{recursive:true});
for(const[id,x,y]of variants){fs.writeFileSync(src+'/'+id+'_A.asm',x);fs.writeFileSync(src+'/'+id+'_B.asm',y);}
cp.execFileSync('node',['C:/Maor/CodeGuru/corewars8086-agent2/agent2/tools/nasm-node.cjs',bin,...variants.flatMap(([id])=>[src+'/'+id+'_A.asm',src+'/'+id+'_B.asm'])],{stdio:'inherit'});
const builds=JSON.parse(fs.readFileSync(bin+'/manifest.json','utf8'));
const candidates=variants.map(([id])=>({id:'a003_'+id,baseline:base.id,hypothesis:'Reduce recurring call barrier to8 bytes while retaining original first-launch paint and destination BP orbit. Old generation CALL pushes one frame beyond new seed, then one fresh recursive CALL yields lowA4 MOVSB bootstrap.',edits:'Affected A DX4000->43F8 and/or affected B DX2400->2BF8. No startup or worker byte-layout change; BP4400/2C00 retained.',failureModes:'Tiny recurrent return-frame paint blocks reduce offense drastically; roughly940 relocations per20k opcodes can expose many destination cells. Own scanner segment/phase tradeoff remains unchanged.',warriors:['_A','_B'].map(s=>{const m=builds.find(x=>path.basename(x.output)===id+s);return {source:m.input,binary:m.output,size:m.size,sha256:m.binarySha256};})}));
fs.writeFileSync(own+'/batch6/candidates.json',JSON.stringify({schema:'cooperative-v6-candidates-v1',baseline:base.id,candidates},null,2)+'\n');
