// A020: histogram of our deaths by IP offset within the generation (cs=0FFBh => anchor IP xxA2)
const fs=require("fs"),path=require("path");
const dir=process.argv[2];
const h={};const ex={};
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith(".jsonl"))){
 for(const line of fs.readFileSync(path.join(dir,f),"utf8").split("\n")){ if(!line.trim())continue;
  const d=JSON.parse(line); if(!/^CAND/.test(d.name))continue;
  const key=d.cs===0x0FFB? "ffb ip&ff="+(d.ip&0xff).toString(16) : "cs="+d.cs.toString(16)+" ip&ff="+(d.ip&0xff).toString(16);
  const k=key+" "+d.name+" "+d.reason; h[k]=(h[k]||0)+1;
  (ex[k]=ex[k]||[]).push(d.bytes.slice(0,4).map(b=>(b.v??"?").toString(16)+"/"+b.by+"@"+b.r).join(" ")+" rnd"+d.round);
 }}
for(const k of Object.keys(h).sort((a,b)=>h[b]-h[a])){console.log(h[k],k);for(const e of ex[k].slice(0,3))console.log("    ",e);}
