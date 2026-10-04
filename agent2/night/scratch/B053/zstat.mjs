import fs from "node:fs";
const dir=process.argv[2];const out={};
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith(".jsonl"))){
 for(const l of fs.readFileSync(dir+"/"+f,"utf8").split("\n")){if(!l)continue;const o=JSON.parse(l);
  if(o.warEnd!==undefined){for(const [n,v] of Object.entries(o.writes)){if(!/^zom/.test(n))continue;const k=`end ${n} alive=${v[1]} writesBucket=${v[0]>1000?">1000":v[0]>50?"51-1000":v[0]}`;out[k]=(out[k]||0)+1;}continue;}
  if(o.type==="ZOMBIE"||/^zom/.test(o.name)){const k=`death ${o.name} cs=${o.cs.toString(16)} r${o.round<50?"<50":o.round<1000?"<1000":">=1000"}`;out[k]=(out[k]||0)+1;}
 }}
for(const k of Object.keys(out).sort())console.log(out[k],k);
