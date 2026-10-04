// A023: rebuild-window deaths: ip offset from anchor, fatal byte writers & values
const fs=require("fs"),path=require("path");
const dirs=process.argv.slice(2);
const byOff={},byWriter={},byPat={};let n=0,nw=0;
for(const dir of dirs)for(const f of fs.readdirSync(dir).filter(f=>f.endsWith(".jsonl"))){
 for(const line of fs.readFileSync(path.join(dir,f),"utf8").split("\n")){ if(!line.trim())continue;
  const d=JSON.parse(line); if(!/^CAND/.test(d.name))continue; n++;
  if(d.cs!==0x0FFB) continue;
  const lo=d.ip&0xff; const b=(d.bytes||[]);
  if(b[0]&&b[0].v===0xff&&b[1]&&b[1].v===0xa5) continue;
  if(!(lo>=0xa3&&lo<=0xb8)) continue;
  nw++;
  const off=lo-0xa2; byOff[off]=(byOff[off]||0)+1;
  const fat=b.slice(0,4).map(x=>x.v.toString(16).padStart(2,'0')+":"+(x.by==="init"?"init":x.by.replace(/^.*?_.*?_/,""))+"@"+(x.r));
  const w=b[0]?b[0].by:"?"; byWriter[w]=(byWriter[w]||0)+1;
  console.log(f.padEnd(28),d.name,"r",d.round,"off+"+off,"sp-anc",((d.sp-(d.ip&0xff00|0xa2))&0xffff).toString(16),fat.join(" "));
 }
}
console.log("deaths",n,"window",nw,JSON.stringify(byOff));
console.log(JSON.stringify(byWriter));
