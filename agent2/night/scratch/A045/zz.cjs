// A045 helper: list our deaths whose fatal bytes start with 00 00 or 00 10 / 10 A5
const fs=require('fs'),path=require('path');
const hex=(v,w=4)=>(v>>>0).toString(16).toUpperCase().padStart(w,'0');
const want=process.argv[2].split(',');
for(const d of process.argv.slice(3)){for(const f of fs.readdirSync(d).filter(f=>f.endsWith('.jsonl'))){
 for(const line of fs.readFileSync(path.join(d,f),'utf8').split('\n')){ if(!line.trim())continue; const r=JSON.parse(line); if(!r.name)continue;
  const ours=r.name.startsWith('CAND'); const z=!/SURVIVOR/.test(r.type)&&r.ss===4096; if(!ours&&!z) continue;
  if(r.cs!==0x0FFB) continue; const k=hex(r.bytes[0].v,2)+' '+hex(r.bytes[1].v,2); if(!want.includes(k)) continue;
  console.log(f.replace('.jsonl',''),r.war,r.round,r.name,r.reason.split(' ')[0],'ip',hex(r.ip),'di',hex(r.di),'si',hex(r.si),'bx',hex(r.bx),'sp',hex(r.sp),'ax',hex(r.ax),
   r.bytes.slice(0,8).map(b=>hex(b.v,2)+'/'+(b.by||'').slice(0,10)+'@'+b.r).join(' '), 'hist',JSON.stringify(r.hist).slice(0,200));
 }}}
