const fs=require('fs'),path=require('path'),cp=require('child_process');
const root='C:/Maor/CodeGuru/corewars8086-lab';
const own=root+'/.arena/v6-cooperative-20261003/.arena/run-20261003-150943-s20261003/scratch/a003';
const base=JSON.parse(fs.readFileSync(root+'/.arena/v6-cooperative-20261003/shared-best.json','utf8'));
if(base.status!=='confirmed'||base.id!=='original_v6')throw Error('Rebase required');
const a=fs.readFileSync(root+'/study-notes/good-test-v6/source/V6_1.asm','utf8');
const b=fs.readFileSync(root+'/study-notes/good-test-v6/source/V6_2.asm','utf8');
const ha=a.replace('mov dx, 04000h','mov dx, 04200h'),hb=b.replace('mov dx, 02400h','mov dx, 02800h');
const variants=[['recurring_half_a',ha,b,'A DX4000->4200: recurring gap400->200, destination BP4400 retained.'],['recurring_half_b',a,hb,'B DX2400->2800: recurring gap800->400, destination BP2C00 retained.'],['recurring_half_ab',ha,hb,'Both half-gap edits together.'],['recurring_double_a',a.replace('mov dx, 04000h','mov dx, 03C00h'),b,'A DX4000->3C00: recurring gap400->800 doubles paint barrier; destination BP4400 retained.']];
const src=own+'/batch5/src',bin=own+'/batch5/bin';fs.mkdirSync(src,{recursive:true});
for(const[id,x,y]of variants){fs.writeFileSync(src+'/'+id+'_A.asm',x);fs.writeFileSync(src+'/'+id+'_B.asm',y);}
cp.execFileSync('node',['C:/Maor/CodeGuru/corewars8086-agent2/agent2/tools/nasm-node.cjs',bin,...variants.flatMap(([id])=>[src+'/'+id+'_A.asm',src+'/'+id+'_B.asm'])],{stdio:'inherit'});
const builds=JSON.parse(fs.readFileSync(bin+'/manifest.json','utf8'));
const candidates=variants.map(([id,x,y,edits])=>({id:'a003_'+id,baseline:base.id,hypothesis:'Preserve destination orbit and alter recurring far-call barrier length (BP-DX)/4; shorter barriers relocate more frequently, reducing a live stationary loop exposure.',edits,failureModes:'Shorter paint blocks may sharply reduce killing coverage; rapid generations can meet enemy future code more often. Near gap8 deliberately removes almost all recurring painting and may survive poorly against fast opponents.',warriors:['_A','_B'].map(s=>{const m=builds.find(x=>path.basename(x.output)===id+s);return {source:m.input,binary:m.output,size:m.size,sha256:m.binarySha256};})}));
fs.writeFileSync(own+'/batch5/candidates.json',JSON.stringify({schema:'cooperative-v6-candidates-v1',baseline:base.id,candidates},null,2)+'\n');
