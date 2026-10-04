const fs=require('fs'),path=require('path'),cp=require('child_process');
const root='C:/Maor/CodeGuru/corewars8086-lab';
const own=root+'/.arena/v6-cooperative-20261003/.arena/run-20261003-150943-s20261003/scratch/a003';
const base=JSON.parse(fs.readFileSync(root+'/.arena/v6-cooperative-20261003/shared-best.json','utf8'));
if(base.status!=='confirmed'||base.id!=='original_v6')throw Error('Rebase required');
const a=fs.readFileSync(root+'/study-notes/good-test-v6/source/V6_1.asm','utf8');
const b=fs.readFileSync(root+'/study-notes/good-test-v6/source/V6_2.asm','utf8');
const shiftedA=a.replace('or dx, 0FFBh','or dx, 0FFCh').replace('add sp, 00100h','add sp, 00110h');
const shiftedB=b.replace('or dx, 0FFBh','or dx, 0FFCh').replace('add sp, 00600h','add sp, 00610h');
const variants=[['segmentffc_a',shiftedA,b],['segmentffc_b',a,shiftedB],['segmentffc_ab',shiftedA,shiftedB]];
const src=own+'/batch7/src',bin=own+'/batch7/bin';fs.mkdirSync(src,{recursive:true});
for(const[id,x,y]of variants){fs.writeFileSync(src+'/'+id+'_A.asm',x);fs.writeFileSync(src+'/'+id+'_B.asm',y);}
cp.execFileSync('node',['C:/Maor/CodeGuru/corewars8086-agent2/agent2/tools/nasm-node.cjs',bin,...variants.flatMap(([id])=>[src+'/'+id+'_A.asm',src+'/'+id+'_B.asm'])],{stdio:'inherit'});
const builds=JSON.parse(fs.readFileSync(bin+'/manifest.json','utf8'));
const candidates=variants.map(([id])=>({id:'a003_'+id,baseline:base.id,hypothesis:'Replica CS/ES0FFC matches the original scanner exclusion and changes exposed far-call segment signature. Shift startup SP+10h so code and paint physical positions translate together with identical barrier/copy timing.',edits:'Affected warrior OR DX immediate0FFB->0FFC; A startup SP+100->+110 and/or B+600->+610. Original byte layout, worker IP, AX lowA2, DX/BP stride, word counts retained.',failureModes:'Physical phase translates+10h and can favor opponent bombs; FFC-specific enemies might recognize the new signature. Own captured A scanner ignores affected teammate frames but also any rivalFFC.',warriors:['_A','_B'].map(s=>{const m=builds.find(x=>path.basename(x.output)===id+s);return {source:m.input,binary:m.output,size:m.size,sha256:m.binarySha256};})}));
fs.writeFileSync(own+'/batch7/candidates.json',JSON.stringify({schema:'cooperative-v6-candidates-v1',baseline:base.id,candidates},null,2)+'\n');
