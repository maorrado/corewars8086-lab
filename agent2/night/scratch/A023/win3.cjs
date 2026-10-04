const fs=require("fs"),path=require("path");
const dir=process.argv[2];
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith(".jsonl"))){
 for(const line of fs.readFileSync(path.join(dir,f),"utf8").split("\n")){ if(!line.trim())continue;
  const d=JSON.parse(line); if(!/^CAND/.test(d.name))continue;
  if(d.cs!==0x0FFB) continue;
  const anc=((d.ip&0xff00)|0xa2)-0x50; const rel=(d.sp-anc)&0xffff;
  const ok=[0,0x10000-0x4000,0x10000-0x2400].includes(rel);
  const lo=(d.ip&0xff)-0xa2; if(!ok||lo<1||lo>22) continue;
  const h=x=>x.toString(16);
  console.log(f.slice(0,22).padEnd(22),d.name,"r"+d.round,"+"+lo,"rel",h(rel),"ip",h(d.ip),"cx",h(d.cx??-1),"si",h(d.si),"di",h(d.di),"bx",h(d.bx),d.reason,
   (d.bytes||[]).slice(0,8).map(x=>h(x.v)+":"+(x.by==="init"?"i":x.by.slice(-6))+"@"+x.r).join(" "));
 }}
