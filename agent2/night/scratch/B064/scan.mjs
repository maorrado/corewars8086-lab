// B064: prevalence of INT87-search decoys / tail consumers for rev0 B (EB F9 CC CC) and A (E2 F2 81 C3) in archived pools.
import fs from "node:fs";
import * as F from "../../../tools/fields.mjs";
const pools={f2025:F.field2025(),l2024:F.field2024live(),f2024:F.field2024final(),f2023:F.field2023final(),counters:F.counters(),peers:F.peers()};
const find=(b,p)=>{const r=[];for(let i=0;i+p.length<=b.length;i++){let ok=true;for(let j=0;j<p.length;j++)if(p[j]!==null&&b[i+j]!==p[j]){ok=false;break}if(ok)r.push(i)}return r};
const h=x=>x.toString(16);
const pats={
 staticBD:[0xEB,0xF9,0xCC,0xCC],          // static decoy for B (with arena CC fill appended)
 staticA:[0xE2,0xF2,0x81,0xC3],           // static decoy for A
 immF9EB:[0xEB,0xF9],                     // F9EBh as immediate (planter or searcher)
 immE2F2:[0xE2,0xF2],
 immCCCC:[0xCC,0xCC],
 int87:[0xCD,0x87], int86:[0xCD,0x86],
};
const rows=[];
for(const [pn,teams] of Object.entries(pools)){
 for(const t of teams){
  for(const w of t.warriors){let b;try{b=fs.readFileSync(F.root+"/"+w)}catch{continue}
   const bb=Buffer.concat([b,Buffer.alloc(4,0xCC)]);
   const nm=w.split("/").pop(); const o=[];
   const sBD=find(bb,pats.staticBD).filter(i=>i<b.length); if(sBD.length)o.push("staticBD@"+sBD.map(i=>h(i)+(i>0&&b[i-1]===0x0F?"(0F)":"")).join(","));
   const sA=find(bb,pats.staticA).filter(i=>i<b.length); if(sA.length)o.push("staticA@"+sA.map(h).join(","));
   // immediates F9EB: preceded by mov r16 (B8-BF), C7 xx [disp] (mov word mem), or 3D/81 (cmp)
   for(const i of find(b,pats.immF9EB)){ if(sBD.includes(i))continue; const ctx=[...b.slice(Math.max(0,i-4),i+2)].map(x=>x.toString(16).padStart(2,"0")).join(" "); o.push("immF9EB@"+h(i)+"["+ctx+"]"); }
   for(const i of find(b,pats.immE2F2)){ if(sA.includes(i))continue; if(i>0&&b[i-1]>=0xB8&&b[i-1]<=0xBF)o.push("movE2F2@"+h(i-1)); }
   const i87=find(b,pats.int87), i86=find(b,pats.int86);
   if(i87.length)o.push("int87@"+i87.map(h).join(",")); if(i86.length)o.push("int86@"+i86.map(h).join(","));
   if(o.some(s=>/^(static|imm|mov)/.test(s)))rows.push(`${pn}\t${t.name}\t${nm}(${b.length})\t${o.join("  ")}`);
  }}
 console.error(pn,teams.length,"teams");
}
console.log(rows.join("\n"));
