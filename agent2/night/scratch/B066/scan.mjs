// B066: INT 87h signature exposure of rev0 in ARENA CONTEXT (binary padded with CCh, as loaded).
// B056's scan matched only inside the binary; B's file ends with FF 1F (worker call far [bx]) so in the
// arena its tail reads FF 1F CC CC. Also matches runtime images: dwell anchor FF 1F CC CC, trail A4 xx FB 0F.
import fs from "node:fs"; import path from "node:path";
const base = "repos/corewars8086-survivors/";
const dirs = ["official-2025/survivors-online","official-2025/survivors-online-young","official-2025/zombies-live",
 ...fs.readdirSync(base).filter(d=>/^cgx20(1[5-9]|2)/.test(d)).flatMap(d=>{const p=base+d; const subs=fs.readdirSync(p).filter(s=>fs.statSync(p+"/"+s).isDirectory()); return subs.length?subs.map(s=>p+"/"+s):[p];}),
 "agent2/night/refs/V6","agent2/night/refs/V4","agent2/night/refs/V6Guard","agent2/night/refs/zchain4",
 "agent2/frontier-20261003/arms/combo_zrl03","agent2/frontier-20261003/arms/combo_ah02"];
const pad = (b)=>Buffer.concat([Buffer.alloc(4,0xcc),b,Buffer.alloc(4,0xcc)]);
const tA = pad(fs.readFileSync("agent2/night/revisions/rev0/A")), tB = pad(fs.readFileSync("agent2/night/revisions/rev0/B"));
const targets=[{n:"A",b:tA},{n:"B",b:tB},{n:"anchorDwell",b:Buffer.from([0xcc,0xcc,0xff,0x1f,0xcc,0xcc,0xcc])},{n:"trail",b:Buffer.from([0xa4,0x52,0xfb,0x0f,0xa4,0x4e,0xfb,0x0f])}];
// backward resolve of a 16-bit register value: imm16 mov, or 8-bit halves
function resolve(b,end,r16,rl,rh){let lo=null,hi=null;for(let i=end-2;i>=Math.max(0,end-48);i--){
  if(b[i]===r16&&i+3<=end&&lo===null&&hi===null)return (b[i+1]|(b[i+2]<<8));
  if(b[i]===rl&&lo===null&&i+2<=end)lo=b[i+1]; if(b[i]===rh&&hi===null&&i+2<=end)hi=b[i+1];
  if(lo!==null&&hi!==null)return lo|(hi<<8);}
 return null;}
const seen=new Set(); const out=[];
for(const d of dirs){ if(!fs.existsSync(d))continue;
 for(const f of fs.readdirSync(d)){const p=path.join(d,f); if(!fs.statSync(p).isFile()||/\.(asm|lst|json|mjs|zip|md|txt|s|c|py)$/i.test(f))continue;
  const b=fs.readFileSync(p); if(b.length>512||b.length<2)continue;
  for(let i=0;i+1<b.length;i++){ if(b[i]!==0xcd||b[i+1]!==0x87)continue;
   const ax=resolve(b,i,0xb8,0xb0,0xb4), dx=resolve(b,i,0xba,0xb2,0xb6), bx=resolve(b,i,0xbb,0xb3,0xb7), cx=resolve(b,i,0xb9,0xb1,0xb5);
   const sig=(ax!==null&&dx!==null)?Buffer.from([ax&255,ax>>8,dx&255,dx>>8]):null;
   const hits=[]; if(sig) for(const t of targets){let k=-1; while((k=t.b.indexOf(sig,k+1))>=0) hits.push(t.n+(t.n.length===1?"@"+(k-4).toString(16):""));}
   const std=b.subarray(Math.max(0,i-24),i).includes(0xfd);
   out.push({p:p.replaceAll("\\","/"),at:i,sig:sig?sig.toString("hex"):"?",repl:bx!==null&&cx!==null?Buffer.from([bx&255,bx>>8,cx&255,cx>>8]).toString("hex"):"?",std,hits});
 }}}
const only=process.argv.includes("--hits");
for(const r of out){ if(only&&!r.hits.length&&r.sig!=="?")continue; console.log(`${r.hits.length?"**":r.sig==="?"?"??":"  "} ${r.p.padEnd(70)} @${r.at.toString(16).padStart(3)} sig ${r.sig} -> ${r.repl} ${r.std?"STD":"   "} ${r.hits.join(",")}`);}
console.error("sites",out.length,"hits",out.filter(r=>r.hits.length).length,"unresolved",out.filter(r=>r.sig==="?").length);
