const fs=require('fs'),path=require('path'),cp=require('child_process');
const root='C:/Maor/CodeGuru/corewars8086-lab';
const own=root+'/.arena/v6-cooperative-20261003/.arena/run-20261003-150943-s20261003/scratch/a003';
const base=JSON.parse(fs.readFileSync(root+'/.arena/v6-cooperative-20261003/shared-best.json','utf8'));
if(base.status!=='confirmed'||base.id!=='original_v6')throw Error('Rebase required');
const a=fs.readFileSync(root+'/study-notes/good-test-v6/source/V6_1.asm','utf8');
const b=fs.readFileSync(root+'/study-notes/good-test-v6/source/V6_2.asm','utf8');
const variants=[['excludeffb',a.replace('cmp si, 0FFCh','cmp si, 0FFBh')],['excludeffbffc',a.replace('cmp si, 0FFCh','cmp si, 0FFBh\n    je short next_candidate\n    cmp si, 0FFCh')]];
const src=own+'/batch3/src',bin=own+'/batch3/bin';fs.mkdirSync(src,{recursive:true});
for(const[id,x]of variants){fs.writeFileSync(src+'/'+id+'_A.asm',x);fs.writeFileSync(src+'/'+id+'_B.asm',b);}
cp.execFileSync('node',['C:/Maor/CodeGuru/corewars8086-agent2/agent2/tools/nasm-node.cjs',bin,...variants.flatMap(([id])=>[src+'/'+id+'_A.asm',src+'/'+id+'_B.asm'])],{stdio:'inherit'});
const builds=JSON.parse(fs.readFileSync(bin+'/manifest.json','utf8'));
const candidates=variants.map(([id])=>({id:'a003_'+id,baseline:base.id,hypothesis:'Captured A Zombie ignores own-team CS0FFB return frames, avoiding inferred live-seed friendly hits.',edits:id==='excludeffb'?'Only CMP SI immediate changes0FFC to0FFB.':'Add FFB exclusion before existing FFC exclusion; six extra bytes affect only scanner tail, preserving every internal source dependency.',failureModes:'Same-segment opponent workers are also ignored; exact-only FFB variant begins attacking FFC rivals previously ignored. Detection frequency depends on scanner sampling alignment and Zombie AX history.',warriors:['_A','_B'].map(s=>{const m=builds.find(x=>path.basename(x.output)===id+s);return {source:m.input,binary:m.output,size:m.size,sha256:m.binarySha256};})}));
fs.writeFileSync(own+'/batch3/candidates.json',JSON.stringify({schema:'cooperative-v6-candidates-v1',baseline:base.id,candidates},null,2)+'\n');
