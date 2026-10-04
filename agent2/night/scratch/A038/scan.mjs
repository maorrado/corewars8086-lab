// A038: prevalence of candidate zom20a INT87 windows in archived pools + zombies.
import fs from "node:fs";
import * as F from "../../../tools/fields.mjs";
const pools={f2025:F.field2025(),l2024:F.field2024live(),f2024:F.field2024final(),f2023:F.field2023final(),counters:F.counters(),peers:F.peers()};
const find=(b,p)=>{const r=[];for(let i=0;i+p.length<=b.length;i++){let ok=true;for(let j=0;j<p.length;j++)if(b[i+j]!==p[j]){ok=false;break}if(ok)r.push(i)}return r};
const pats={E2F281C3:[0xE2,0xF2,0x81,0xC3],F281C3E1:[0xF2,0x81,0xC3,0xE1]};
for(const z of ["zom20a","zom20b","zom20c","zom20d"]){const b=fs.readFileSync(F.root+"/official-2025/zombies-live/"+z);for(const [k,p] of Object.entries(pats))console.log(z,k,find(b,p).map(x=>x.toString(16)).join(","));}
const seen=new Set();
for(const [pn,teams] of Object.entries(pools)){
 for(const t of teams)for(const w of t.warriors){if(seen.has(w))continue;seen.add(w);let b;try{b=fs.readFileSync(F.root+"/"+w)}catch{continue}
  const o=[];for(const [k,p] of Object.entries(pats)){const h=find(b,p);if(h.length)o.push(k+"@"+h.map(x=>x.toString(16)).join(","))}
  // also: tail at end of file followed by CC padding
  const bc=Buffer.concat([b,Buffer.from([0xCC,0xCC,0xCC])]);for(const [k,p] of Object.entries(pats)){const h=find(bc,p).filter(i=>i+4>b.length);if(h.length)o.push(k+"(tailCC)")}
  if(o.length)console.log(pn,w,o.join(" "));}}
