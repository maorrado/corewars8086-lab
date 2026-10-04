const fs=require('fs'),path=require('path');
const dirs=process.argv.slice(2);
const hex=v=>(v>>>0).toString(16).toUpperCase();
let n=0,cat={};
for(const d of dirs){for(const f of fs.readdirSync(d).filter(f=>f.endsWith('.jsonl'))){
 for(const line of fs.readFileSync(path.join(d,f),'utf8').split('\n')){ if(!line.trim())continue; const r=JSON.parse(line);
  if(!r.name) continue; const ours = r.name.startsWith('CAND'); 
  // captured zombie running our code: zombie with ss==4096 (arena) after phoenix
  const zcap = r.type!=='SURVIVOR_1'&&r.type!=='SURVIVOR_2'&& r.ss===4096;
  if(!ours && !zcap) continue; n++;
  const allInit = r.bytes.every(b=>b.by==='init');
  const k=[ours?r.name:'zomb', hex(r.cs), 'ss'+hex(r.ss), 'bx'+hex(r.bx), allInit?'UNTOUCHED':''].join(' ');
  cat[k]=(cat[k]||0)+1;
  if(allInit || (r.cs===4091 && ![0x2C0,0x280].includes(r.bx)) ) console.log(f, r.war, r.round, r.name, r.reason, 'cs',hex(r.cs),'ip',hex(r.ip),'ss',hex(r.ss),'sp',hex(r.sp),'ds',hex(r.ds),'es',hex(r.es),'bx',hex(r.bx),'di',hex(r.di),'si',hex(r.si),'ax',hex(r.ax),'load',hex(r.load), r.bytes.slice(0,4).map(b=>hex(b.v)+'/'+b.by).join(' '));
 }}}
console.log(n); console.log(Object.entries(cat).sort((a,b)=>b[1]-a[1]).slice(0,40));
