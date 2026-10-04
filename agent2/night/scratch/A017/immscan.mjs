// A017: find mov r16,imm with FF 1x anchor bytes (possible INT87/INT86 anchor searches) in pool binaries
import fs from "node:fs"; import path from "node:path";
const dirs=["official-2025/survivors-online","official-2025/survivors-online-young","repos/corewars8086-survivors/cgx2024/03-live","repos/corewars8086-survivors/cgx2024/05-final2","official-2025/zombies-live"];
for(const d of dirs){ if(!fs.existsSync(d))continue; for(const f of fs.readdirSync(d)){const p=path.join(d,f); if(!fs.statSync(p).isFile()||/\.(asm|lst|json|mjs|zip|md|txt)$/.test(f))continue; const b=fs.readFileSync(p); if(b.length>512)continue;
 const hits=[]; for(let i=0;i+2<b.length;i++){ if(b[i]>=0xb8&&b[i]<=0xbf&&b[i+1]===0xff&&(b[i+2]&0xf8)===0x18) hits.push(i.toString(16)+":"+["ax","cx","dx","bx","sp","bp","si","di"][b[i]-0xb8]+"=FF"+b[i+2].toString(16)); if(b[i]>=0xb8&&b[i]<=0xbf&&b[i+2]===0xff&&b[i+1]===0xcc) hits.push(i.toString(16)+":"+["ax","cx","dx","bx","sp","bp","si","di"][b[i]-0xb8]+"=CCFF?"); }
 const n87=[...b].filter((x,i)=>x===0xcd&&b[i+1]===0x87).length;
 if(hits.length) console.log(p.replaceAll("\\","/").padEnd(70), "int87x"+n87, hits.join(" "));}}
