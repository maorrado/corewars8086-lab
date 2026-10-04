const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const root = 'C:/Maor/CodeGuru/corewars8086-lab';
const nasm = 'C:/Maor/CodeGuru/corewars8086-agent2/agent2/tools/nasm-node.cjs';
const original = [1,2].map(i=>fs.readFileSync(path.join(root,'study-notes/good-test-v6/source',`V6_${i}.asm`),'utf8'));
function once(src,a,b) {if(src.split(a).length!==2) throw new Error('Expected unique site '+a); return src.replace(a,b);}
function direct(src,i) {
  if(i===0) {
    src=once(src,'add di, 0099h','add di, zombie_entry - start');
    src=once(src,'add si, 0088h','add si, worker - start');
    src=once(src,'add sp, 00100h','add sp, 0FFB0h ; target linear offset in SS=1000h is pointer minus 50h');
  } else {
    src=once(src,'db 08Dh, 09Ch, 039h, 000h ; lea bx,[si+39h], preserve original disp16 encoding','db 08Dh, 09Ch ; LEA BX,[SI+disp16]\n    dw zombie_entry - start');
    src=once(src,'db 081h, 0EEh, 062h, 000h ; sub si,62h, preserve original imm16 encoding','db 081h, 0EEh ; SUB SI,imm16\n    dw get_ip - start');
    src=src.replaceAll('add si, 00B9h','add si, worker - start');
    src=once(src,'add sp, 00600h','add sp, 0FFB0h ; match SP at natural bootstrap handoff');
  }
  src=once(src,'mov ax, 01FFFh\n    stosw\n    dec di\n    call far [bx]','mov ax, 01FA4h ; MOVSB seeds the private worker immediately\n    stosw\n    mov al, 0FFh ; later relocations keep the original FF1F paint marker\n    dec di\n    jmp far [bx] ; avoid pushing the original return IP over the MOVSB seed');
  return src;
}
const directPair=original.map(direct);
const specs=[{id:'a002_direct_boot_b', sourcesText:[original[0],directPair[1]], changed:['B']},{id:'a002_direct_boot_a', sourcesText:[directPair[0],original[1]], changed:['A']},{id:'a002_direct_boot_both', sourcesText:directPair,changed:['A','B']}];
const batch=path.join(__dirname,'batch2'); fs.mkdirSync(batch,{recursive:true});
const manifest={schema:'v6-candidate-batch-v1',baseline:'original_v6',provenance:"Modified derivatives of the user's friend-provided V6.", candidates:[]};
for(const spec of specs) {
  const dir=path.join(batch,spec.id); fs.mkdirSync(dir,{recursive:true});
  const sources=['A.asm','B.asm'].map(n=>path.join(dir,n)); sources.forEach((p,i)=>fs.writeFileSync(p,spec.sourcesText[i]));
  cp.execFileSync(process.execPath,[nasm,path.join(dir,'build'),...sources],{stdio:'inherit'});
  const binaries=JSON.parse(fs.readFileSync(path.join(dir,'build/manifest.json'),'utf8'));
  manifest.candidates.push({id:spec.id, sources,binaries:binaries.map(m=>m.output),sizes:binaries.map(m=>m.size),sha256:binaries.map(m=>m.binarySha256),hypothesis:'Treat recursive startup as an exposed bootstrap barrier. Enter MOVSB directly, copying A5 then F3A5 from private memory. Preserve original AX=1FFF and SP at natural handoff for subsequent relocations.',edits:spec.changed.map(w=>`${w}: initial marker 1FFF->1FA4, restore AL=FF after STOSW; SP displacement ->FFB0; initial CALL FAR -> JMP FAR; rebase fixed source/zombie offsets using labels.`),failureModes:['Initial stack paint is removed, reducing offense and changing what other scanners see.','Starting the first worker earlier shifts collisions and captured-zombie coordination.','Untested architectural transformation; compilation is not CPU or battle evidence.'],verification:'NASM <=256-byte bound passed. Original unaffected teammate binary hash matched baseline. Worker code remains original; modified source offsets use labels.'});
}
const target=path.join(batch,'candidates.json'); if(fs.existsSync(target))throw new Error('Immutable manifest exists');fs.writeFileSync(target,JSON.stringify(manifest,null,2)+'\n'); console.log(target);
