// A023: true rebuild deaths (SP at anchor or anchor-DX), fatal byte writer class
const fs=require("fs"),path=require("path");
for(const dir of process.argv.slice(2)){ let n=0,rb=0; const cls={},off={};
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith(".jsonl"))){
 for(const line of fs.readFileSync(path.join(dir,f),"utf8").split("\n")){ if(!line.trim())continue;
  const d=JSON.parse(line); if(!/^CAND/.test(d.name))continue; n++;
  if(d.cs!==0x0FFB) continue;
  const anc=((d.ip&0xff00)|0xa2)-0x50; const rel=(d.sp-anc)&0xffff;
  const ok=[0,0x10000-0x4000,0x10000-0x2400,0xfffc,0x10000-0x4004,0x10000-0x2404].includes(rel);
  const lo=(d.ip&0xff)-0xa2; if(!ok||lo<1||lo>22) continue;
  rb++; off[lo]=(off[lo]||0)+1;
  const ws=new Set((d.bytes||[]).slice(0,4).filter(x=>x.by!=="init").map(x=>x.by===d.name?"self":(/^CAND/.test(x.by)?"partner":(/^zom/.test(x.by)?"zombie":"opp"))));
  const k=[...ws].sort().join("+")||"init"; cls[k]=(cls[k]||0)+1;
 }}
 console.log(path.basename(dir),"deaths",n,"rebuild",rb,JSON.stringify(cls),JSON.stringify(off));
}
