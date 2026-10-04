const fs=require('fs'), path=require('path'), cp=require('child_process');
const root='C:/Maor/CodeGuru/corewars8086-lab';
const own=root+'/.arena/v6-cooperative-20261003/.arena/run-20261003-150943-s20261003/scratch/a003';
const baseline=JSON.parse(fs.readFileSync(root+'/.arena/v6-cooperative-20261003/shared-best.json','utf8'));
if(baseline.status!=='confirmed'||baseline.id!=='original_v6')throw Error('Rebase required against '+baseline.id);
const a=fs.readFileSync(root+'/study-notes/good-test-v6/source/V6_1.asm','utf8');
const b=fs.readFileSync(root+'/study-notes/good-test-v6/source/V6_2.asm','utf8');
function energize(src,isA){
  src=src.replace('mov al, 0A2h','mov al, 0A0h').replaceAll('mov al, 0A2h','mov al, 0A0h');
  if(isA)src=src.replace('add di, 0099h','add di, zombie_entry').replace('add si, 0088h','add si, worker');
  else src=src.replaceAll('add si, 00B9h','add si, worker');
  src=src.replaceAll('mov cx, 9','mov cx, (worker_end-worker+1)/2').replace('mov cx, 8','mov cx, (worker_end-worker+1)/2').replace('mov cl, 9','mov cl, (worker_end-worker+1)/2');
  src=src.replace('mov ax, 01FFFh\n    stosw\n    dec di', 'mov ax, 09B9Bh\n    stosw\n    mov ax, 01FFFh\n    stosw\n    sub di, 3');
  src=src.replace('xor si, si\n    stosw\n    dec di','xor si, si\n    mov ax, 09B9Bh\n    stosw\n    mov ax, 01FFFh\n    stosw\n    sub di, 3');
  if(isA)src=src.replace('zombie_entry:', 'worker_end:\nzombie_entry:');
  else src+='\nworker_end:\n';
  return src;
}
const ea=energize(a,true),eb=energize(b,false);
const variants=[['energypaintA',ea,b],['energypaintB',a,eb],['energypaintAB',ea,eb]];
const src=own+'/batch2/src',bin=own+'/batch2/bin';fs.mkdirSync(src,{recursive:true});
for(const[id,x,y]of variants){fs.writeFileSync(src+'/'+id+'_A.asm',x);fs.writeFileSync(src+'/'+id+'_B.asm',y);}
cp.execFileSync('node',['C:/Maor/CodeGuru/corewars8086-agent2/agent2/tools/nasm-node.cjs',bin,...variants.flatMap(([id])=>[src+'/'+id+'_A.asm',src+'/'+id+'_B.asm'])],{stdio:'inherit'});
const builds=JSON.parse(fs.readFileSync(bin+'/manifest.json','utf8'));
const candidates=variants.map(([id])=>({id:'a003_'+id,baseline:baseline.id,hypothesis:'Generate NRG;CALL FAR[bx] as the paint loop. Earning energy every two mandatory instructions can compensate its extra instruction and speed both paint/copy phases.',edits:'Affected warrior sets destination low byte A0, seeds 9B9B FF1F, resets AX around two STOSW, changes DI adjustment to SUB3, copies 13 words; all moved worker and A zombie offsets rebased by labels. Unaffected warrior remains exact original.',failureModes:'NRG-seeded cells are weaker lethal paint; bonuses change teammate/Zombie turn relation; larger worker is exposed two extra rounds and code overwrites become less regular.',warriors:['_A','_B'].map(s=>{const m=builds.find(x=>path.basename(x.output)===id+s);return {source:m.input,binary:m.output,size:m.size,sha256:m.binarySha256};})}));
fs.writeFileSync(own+'/batch2/candidates.json',JSON.stringify({schema:'cooperative-v6-candidates-v1',baseline:baseline.id,candidates},null,2)+'\n');
