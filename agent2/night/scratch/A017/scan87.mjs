// B056: scan INT 87h search signatures in opponent pools against rev0 bytes.
import fs from "node:fs"; import path from "node:path";
const root = process.cwd();
const dirs = ["official-2025/survivors-online","official-2025/survivors-online-young","repos/corewars8086-survivors/cgx2024/03-live","repos/corewars8086-survivors/cgx2024/05-final2","official-2025/zombies-live","agent2/night/refs/V6","agent2/night/refs/V4","agent2/night/refs/V6Guard","agent2/night/refs/zchain4","agent2/night/scratch/B056"];
const tA=Buffer.alloc(0),tB=Buffer.alloc(0);
// arena images: worker (from 'worker' label) after anchor FF 1F; trail words A4 xx FB 0F
const targets = [{n:"rev0A",b:tA},{n:"rev0B",b:tB}];
function lastImm(b,end,op){for(let i=end-3;i>=Math.max(0,end-64);i--){if(b[i]===op)return {o:i,v:b[i+1]|(b[i+2]<<8)};}return null;}
const out=[];
for(const d of dirs){ if(!fs.existsSync(d))continue;
 for(const f of fs.readdirSync(d)){const p=path.join(d,f); if(!fs.statSync(p).isFile()||/\.(asm|lst|json|mjs|zip|md)$/.test(f))continue;
  const b=fs.readFileSync(p); if(b.length>512)continue;
  for(let i=0;i+1<b.length;i++){ if(b[i]!==0xcd||b[i+1]!==0x87)continue;
   const ax=lastImm(b,i,0xb8), dx=lastImm(b,i,0xba), bx=lastImm(b,i,0xbb), cx=lastImm(b,i,0xb9);
   const sig = ax&&dx? Buffer.from([ax.v&255,ax.v>>8,dx.v&255,dx.v>>8]):null;
   const hits=[]; if(sig) for(const t of targets){let k=-1; while((k=t.b.indexOf(sig,k+1))>=0) hits.push(t.n+"@"+k.toString(16));}
   // trail pattern A4 ?? FB 0F
   let trail=false; if(sig){for(let s=0;s<4;s++){let ok=true;const pat=[0xa4,null,0xfb,0x0f];for(let j=0;j<4;j++){const e=pat[(s+j)%4]; if(e!==null&&e!==sig[j])ok=false;} if(ok)trail=true;}}
   out.push({file:p.replaceAll("\\","/"),at:i,sig:sig?sig.toString("hex"):"?",repl:bx&&cx?[bx.v&255,bx.v>>8,cx.v&255,cx.v>>8].map(x=>x.toString(16).padStart(2,"0")).join(""):"?",std:b.subarray(Math.max(0,i-3),i).includes(0xfd),hits,trail});
  }}}
for(const r of out) console.log(`${r.hits.length||r.trail?"**":"  "} ${r.file.padEnd(62)} @${r.at.toString(16).padStart(3)} sig ${r.sig} -> ${r.repl} ${r.std?"STD":"   "} ${r.hits.join(",")} ${r.trail?"TRAIL":""}`);
