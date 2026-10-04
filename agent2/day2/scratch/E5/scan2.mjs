// E5: every team in the 2025 field (+2024live, counters, peers): straight-line startup writes to absolute cells and INT87s
// whose replacement contains FF 26 (jmp [cell]) -> foreign zombie hook cells with their write / patch instruction index.
import { execFileSync } from "node:child_process"; import * as F from "../../../tools/fields.mjs";
const pools={f2025:F.field2025(),l2024:F.field2024live(),counters:F.counters(),peers:F.peers()};
const dis=p=>execFileSync("node",["agent2/tools/dis86.mjs",p],{encoding:"utf8"}).split("\n").map(l=>l.match(/^([0-9a-f]{4}):\s+((?:[0-9a-f]{2} )+)\s*(.*)$/i)).filter(Boolean).map(m=>({off:parseInt(m[1],16),txt:m[3].trim()}));
for(const [pool,teams] of Object.entries(pools))for(const t of teams){const out=[];
 for(const w of t.warriors){let ins;try{ins=dis(F.root+"/"+w)}catch{continue}
  const regs={ax:"0000",bx:"0000",cx:"0000",dx:"0000"};
  ins.slice(0,45).forEach((x,k)=>{let m;
   if((m=x.txt.match(/^mov (ax|bx|cx|dx),([0-9A-F]{4})h$/i)))regs[m[1]]=m[2];
   if((m=x.txt.match(/^mov \[([0-9A-F]{4})h\],(\w+)$/i)))out.push(`${w.split("/").pop()} #${k+1} W [${m[1]}] <- ${m[2]}`);
   if(/^int 87h/.test(x.txt)&&(/^26FF$/i.test(regs.bx)||/26FF/i.test(regs.cx)||/^FF/i.test(regs.cx)))out.push(`${w.split("/").pop()} #${k+1} INT87 ${regs.ax}/${regs.dx} -> ${regs.bx}/${regs.cx}`);
  });}
 const s=out.join("\n   ");if(/INT87/.test(s))console.log(`[${pool}] ${t.name}\n   ${s}`);}
