// B063: prevalence scan of fixed hook cells (INT 87h replacement BX=xxFFh with jmp/call [cell]) and of writes to
// the base's cells 4A17h / 5D13h / 9769h, with the straight-line instruction index of each write/INT87 (timing).
import fs from "node:fs"; import { execFileSync } from "node:child_process";
import * as F from "../../../tools/fields.mjs";
const pools={f2025:F.field2025(),l2024:F.field2024live(),f2024:F.field2024final(),f2023:F.field2023final(),counters:F.counters(),peers:F.peers(),
 refs:["V6","V4","V6Guard","zchain4"].map(n=>({name:"ref_"+n,warriors:[`agent2/night/refs/${n}/A`,`agent2/night/refs/${n}/B`]})),
 base:[{name:"rev0",warriors:["agent2/night/revisions/rev0/A","agent2/night/revisions/rev0/B"]}]};
const dis=p=>execFileSync("node",["agent2/tools/dis86.mjs",p],{encoding:"utf8"}).split("\n").map(l=>l.match(/^([0-9a-f]{4}):\s+((?:[0-9a-f]{2} )+)\s*(.*)$/i)).filter(Boolean).map(m=>({off:parseInt(m[1],16),bytes:m[2].trim(),txt:m[3].trim()}));
const our=/\[(4A17h|5D13h|9769h)\]/i;
const summary={};
for(const [pool,teams] of Object.entries(pools))for(const t of teams){const lines=[];
 for(const w of t.warriors){let ins;try{ins=dis(F.root+"/"+w)}catch{continue}
  let bx=null,cx=null,ax=null,dx=null;
  ins.forEach((x,k)=>{const n=k+1;
   let m;
   if((m=x.txt.match(/^mov (bx|cx|ax|dx),([0-9A-F]{4})h$/))){({bx:()=>bx=m[2],cx:()=>cx=m[2],ax:()=>ax=m[2],dx:()=>dx=m[2]})[m[1]]();}
   if(/^int 87h/.test(x.txt)&&bx&&/FF$/.test(bx)) lines.push(`${w.split("/").pop()} #${n}@${x.off.toString(16)} INT87 ${ax}/${dx} -> ${bx.slice(2)}FF ${bx.slice(0,2)}? cell=${cx}`);
   if(our.test(x.txt)&&/^mov \[/.test(x.txt)) lines.push(`${w.split("/").pop()} #${n}@${x.off.toString(16)} WRITE ${x.txt}`);
   if(our.test(x.txt)&&!/^mov \[/.test(x.txt)) lines.push(`${w.split("/").pop()} #${n}@${x.off.toString(16)} use ${x.txt}`);
  });}
 if(lines.length){console.log(`[${pool}] ${t.name}\n   `+lines.join("\n   "));}
}
