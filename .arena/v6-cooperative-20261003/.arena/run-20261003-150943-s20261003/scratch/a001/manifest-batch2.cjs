const fs=require('fs'),path=require('path');
const batch=path.join(__dirname,'batch2');
const notes={
 nohop:['Remove A EB00 fall-through jump; label-rebase A worker 88h->86h and zombie entry99h->97h; B unchanged.','Saves one initial opcode and two loaded bytes.','Earlier startup and shifted original code can alter attack signatures and load placements.'],
 shiftattack:['A found_candidate replaces four ADD SI,SI instructions with MOV CL,4; SHL SI,CL. Earlier layout and all fixed offsets unchanged; B unchanged.','Captive zombie computes segment-to-linear conversion in two fewer opcodes.','CL changes on hit, but next candidate scan resets it; increased speed can alter attacker timing.'],
 strideplus100:['A DX4000/BP4400->DX4100/BP4500; B DX2400/BP2C00->DX2500/BP2D00. Length and original offsets unchanged.','Odd 0100h relocation strides visit 256 destination bands instead of64 while preserving low A2 bootstrap and original BP-DX paint spans.','Broader sweep can enter hostile code more often and alter team interference.'],
 strideminus100:['A DX4000/BP4400->DX3F00/BP4300; B DX2400/BP2C00->DX2300/BP2B00. Length and original offsets unchanged.','Contrasting 0100h stride direction visits256 destination bands while preserving bootstrap and original BP-DX paint spans.','Broader sweep can enter hostile code more often and alter team interference.']
};
const candidates=Object.entries(notes).map(([id,[edits,hypothesis,failure_modes]])=>{
 const dir=path.join(batch,id), built=JSON.parse(fs.readFileSync(path.join(dir,'build','manifest.json'),'utf8'));
 return {id:'a001_'+id,sources:built.map(x=>x.input),warriors:built.map(x=>x.output),sha256:built.map(x=>x.binarySha256),sizes:built.map(x=>x.size),edits,hypothesis,failure_modes};
});
fs.writeFileSync(path.join(batch,'candidates.json'),JSON.stringify({schema:'cooperative-arena-candidates-v1',baseline:'original_v6',provenance:'Variants of friend-provided Good_Test V6; originals untouched.',candidates},null,2)+'\n');
