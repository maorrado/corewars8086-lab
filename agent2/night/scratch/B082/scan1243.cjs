// B082: byte-aligned scan for references to arena word [1243h] (zom20a's first write cell) in warrior pools.
const fs=require('fs'),path=require('path');
for(const d of process.argv.slice(2)){for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(fs.statSync(p).isDirectory())continue;
 const b=fs.readFileSync(p);for(let i=1;i<b.length-1;i++){if(b[i]===0x43&&b[i+1]===0x12){
  const ctx=[...b.slice(Math.max(0,i-3),i+2)].map(x=>x.toString(16).padStart(2,'0')).join(' ');console.log(p,'+'+(i).toString(16),ctx);}}}}
