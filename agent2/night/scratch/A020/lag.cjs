// A020: for rebuild-window deaths, age (rounds) of the newest opponent-written byte among the first 4 fault bytes
const fs=require("fs"),path=require("path");
const dir=process.argv[2]; const h={}; let n=0;
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith(".jsonl")))
 for(const line of fs.readFileSync(path.join(dir,f),"utf8").split("\n")){ if(!line.trim())continue;
  const d=JSON.parse(line); if(!/^CAND/.test(d.name)||d.cs!==0x0FFB)continue;
  const b=(d.bytes||[]); const lo=d.ip&0xff;
  if(b[0]?.v===0xff&&b[1]?.v===0xa5) continue; if(!(lo>=0xa3&&lo<=0xb6)) continue;
  const foreign=b.slice(0,4).filter(x=>x.by&&!/^CAND|init|load/.test(x.by));
  let k; if(!foreign.length) k="no foreign byte (self/init)"; else { const age=d.round-Math.max(...foreign.map(x=>x.r)); k= age<=2?"age<=2":age<=9?"age3-9":age<=20?"age10-20":"age>20"; }
  h[k]=(h[k]||0)+1; n++;
 }
console.log(n,JSON.stringify(h));
