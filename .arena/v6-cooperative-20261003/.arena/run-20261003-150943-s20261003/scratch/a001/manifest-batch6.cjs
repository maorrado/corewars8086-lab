const fs=require('fs'),path=require('path');
const batch=path.join(__dirname,'batch6');
const candidates=[300,500].map(gap=>{
 const dir=path.join(batch,'bgap'+gap),m=JSON.parse(fs.readFileSync(path.join(dir,'build/manifest.json'),'utf8'));
 return{id:'a001_bgap'+gap,sources:m.map(x=>x.input),warriors:m.map(x=>x.output),sizes:m.map(x=>x.size),sha256:m.map(x=>x.binarySha256),edits:'B initial ADD SP,0600h -> ADD SP,0'+gap+'h only; A exact original. Identical source positions, steady BP/DX, copy counts and opcodes.',hypothesis:'Test startup latency versus early return-paint offense around exploratory gap400. Initial paint span'+(gap===300?'848':'1360')+' bytes; first MOVSB predicted'+(gap===300?'271':'399')+' opcodes versus original463.',failure_modes:'May remove useful early paint or delay first relocation. No new shared baseline adopted; longer-run improvement must be independently confirmed.'};
});
const out=path.join(batch,'candidates.json');if(fs.existsSync(out))throw Error('immutable exists');fs.writeFileSync(out,JSON.stringify({schema:'cooperative-arena-candidates-v1',baseline:'original_v6',provenance:'Variants of friend-provided Good_Test V6.',candidates},null,2)+'\n');
