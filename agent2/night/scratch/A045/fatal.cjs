// A045 helper: tally the first fatal bytes at the death IP for our streams (CAND1/2 and Zombies running our code, SS=1000h)
const fs=require('fs'),path=require('path');
const hex=v=>(v>>>0).toString(16).toUpperCase().padStart(2,'0');
const cat={};let n=0;
for(const d of process.argv.slice(2)){for(const f of fs.readdirSync(d).filter(f=>f.endsWith('.jsonl'))){
 for(const line of fs.readFileSync(path.join(d,f),'utf8').split('\n')){ if(!line.trim())continue; const r=JSON.parse(line); if(!r.name)continue;
  const ours=r.name.startsWith('CAND'); const z=!/SURVIVOR/.test(r.type)&&r.ss===4096; if(!ours&&!z) continue;
  if(r.cs!==0x0FFB) continue; n++;
  const k=r.reason.split(' ')[0]+' '+r.bytes.slice(0,2).map(b=>hex(b.v)).join(' ')+(r.ds!==4096?' ds=priv':' ds=arena');
  cat[k]=(cat[k]||0)+1;}}}
console.log(n);console.log(Object.entries(cat).sort((a,b)=>b[1]-a[1]).slice(0,30));
