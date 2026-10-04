// A020: classify our (CAND1/CAND2) deaths by phase within the generation.
// cs=0FFBh, anchor IP xxA2, worker A3..B3; trace ip is reported after decode.
const fs=require("fs"),path=require("path");
const dir=process.argv[2]; const tot={}; let n=0;
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith(".jsonl"))){
 const per={};
 for(const line of fs.readFileSync(path.join(dir,f),"utf8").split("\n")){ if(!line.trim())continue;
  const d=JSON.parse(line); if(!/^CAND/.test(d.name))continue; n++;
  const b=(d.bytes||[]).map(x=>x.v); const lo=d.ip&0xff;
  let k;
  if(d.cs!==0x0FFB) k="startup/other-cs";
  else if(b[0]===0xff&&b[1]===0xa5) k="anchor FF A5 (dwell)";
  else if(lo===0xa3&&b[0]===0xcc) k="new anchor = CC";
  else if(lo>=0xa3&&lo<=0xb6) k="rebuild window";
  else k="other ip";
  per[k]=(per[k]||0)+1; tot[k]=(tot[k]||0)+1;
 }
 console.log(f.padEnd(34),JSON.stringify(per));
}
console.log("TOTAL deaths",n,JSON.stringify(tot));
