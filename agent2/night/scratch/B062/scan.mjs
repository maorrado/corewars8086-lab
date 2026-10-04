// B062: prevalence scan of zombie mimics / zombie competitors in archived pools.
import fs from "node:fs";
import * as F from "../../../tools/fields.mjs";
const pools={f2025:F.field2025(),l2024:F.field2024live(),f2024:F.field2024final(),f2023:F.field2023final(),counters:F.counters(),peers:F.peers()};
const zom20a=fs.readFileSync(F.root+"/official-2025/zombies-live/zom20a");
const zom20b=fs.readFileSync(F.root+"/official-2025/zombies-live/zom20b");
const hex=a=>[...a].map(x=>x.toString(16).padStart(2,"0")).join(" ");
const find=(b,p)=>{const r=[];for(let i=0;i+p.length<=b.length;i++){let ok=true;for(let j=0;j<p.length;j++)if(b[i+j]!==p[j]){ok=false;break}if(ok)r.push(i)}return r};
const pats={
 decoyA:[0xE2,0xF2,0x81,0xC3],        // rev0 A's INT87 pattern
 z20a_6:[0x41,0x93,0xE2,0xF2],        // other live-loop window
 z20a_body:[0x81,0xC3,0xE1,0x10,0xF7,0xE3], // zom20a body copy
 tailBD:[0xEB,0xF9,0xCC,0xCC],        // zom20b/d tail (rev0 B's INT87 pattern)
 int87:[0xCD,0x87], int86:[0xCD,0x86],
 // immediates that would be needed to INT87-search zom20a / zom20b/d
 imm_E2F2:[0xE2,0xF2], imm_F9EB:[0xEB,0xF9], imm_C381:[0x81,0xC3], imm_9341:[0x41,0x93],
};
const summary={};
for(const [pn,teams] of Object.entries(pools)){summary[pn]={teams:teams.length,hits:{}};
 for(const t of teams){const out=[];
  for(const w of t.warriors){let b;try{b=fs.readFileSync(F.root+"/"+w)}catch{continue}
   const nm=w.split("/").pop();
   const has87=find(b,pats.int87).length>0;
   for(const k of ["decoyA","z20a_6","z20a_body","tailBD"]){const h=find(b,pats[k]);if(h.length)out.push(`${nm}:${k}@${h.map(x=>x.toString(16)).join(",")}`)}
   // INT87 immediates: mov r16,imm (B8-BF) with zombie bytes
   for(const [k,p] of Object.entries({imm_E2F2:pats.imm_E2F2,imm_F9EB:pats.imm_F9EB,imm_C381:pats.imm_C381,imm_9341:pats.imm_9341}))for(const i of find(b,p))if(i>0&&b[i-1]>=0xB8&&b[i-1]<=0xBF&&has87)out.push(`${nm}:${k}(mov ${b[i-1].toString(16)})@${(i-1).toString(16)}`);
   if(has87)out.push(`${nm}:int87@${find(b,pats.int87).map(x=>x.toString(16)).join(",")}`);
  }
  if(out.some(s=>!/:int87@/.test(s))){summary[pn].hits[t.name]=out}
 }}
for(const [pn,s] of Object.entries(summary)){console.log(`== ${pn} (${s.teams} teams)`);for(const [t,o] of Object.entries(s.hits))console.log(" ",t,o.join("  "));}
