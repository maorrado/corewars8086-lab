// A031: which opponent INT 87h search signatures match bytes of rev0's abandoned
// initializers (A/B arena images padded with CC on both sides)?
import fs from "node:fs"; import path from "node:path";
const dirs = ["official-2025/survivors-online","official-2025/survivors-online-young","official-2025/zombies-live","repos/corewars8086-survivors/cgx2024/03-live","repos/corewars8086-survivors/cgx2024/05-final2","repos/corewars8086-survivors/cgx2023"];
const pad = (b)=>Buffer.concat([Buffer.alloc(4,0xcc),b,Buffer.alloc(4,0xcc)]);
const T = {A:pad(fs.readFileSync("agent2/night/revisions/rev0/A")),B:pad(fs.readFileSync("agent2/night/revisions/rev0/B"))};
function lastImm(b,end,op){for(let i=end-3;i>=Math.max(0,end-64);i--){if(b[i]===op)return {o:i,v:b[i+1]|(b[i+2]<<8)};}return null;}
function walk(d,acc){ if(!fs.existsSync(d))return; for(const f of fs.readdirSync(d)){const p=path.join(d,f); const st=fs.statSync(p); if(st.isDirectory()){walk(p,acc);continue;} if(/\.(asm|lst|json|mjs|zip|md|txt)$/.test(f)||st.size>512)continue; acc.push(p);} }
const files=[]; for(const d of dirs) walk(d,files);
let n=0;
for(const p of files){ const b=fs.readFileSync(p);
  for(let i=0;i+1<b.length;i++){ if(b[i]!==0xcd||b[i+1]!==0x87)continue; n++;
    const ax=lastImm(b,i,0xb8), dx=lastImm(b,i,0xba); if(!ax||!dx)continue;
    const sig=Buffer.from([ax.v&255,ax.v>>8,dx.v&255,dx.v>>8]);
    const hits=[]; for(const [k,t] of Object.entries(T)){let j=-1; while((j=t.indexOf(sig,j+1))>=0) hits.push(k+"@"+(j-4).toString(16));}
    if(hits.length) console.log(p.replaceAll("\\","/").padEnd(70), sig.toString("hex"), hits.join(","));
  }}
console.log("files",files.length,"int87 sites",n);
