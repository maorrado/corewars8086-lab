// E5: static scan of startup writes to absolute cells and INT86/87 (straight-line index) for every team in field L2 + leaders.
import fs from "node:fs"; import { execFileSync } from "node:child_process";
const root=process.cwd();
const f=JSON.parse(fs.readFileSync("agent2/day2/q/fields/S.json","utf8"));
const teams=new Map();
for(const c of f.cohorts)for(const o of c.opponents){const k=o.name;const e=teams.get(k)||{w:o.warriors,coh:new Set()};e.coh.add(c.id);teams.set(k,e);}
for(const [k,v] of Object.entries(f.leaders)) if(!teams.has(v.name)) teams.set(v.name,{w:v.warriors,coh:new Set(["leader"])});
const dis=p=>execFileSync("node",["agent2/tools/dis86.mjs",p],{encoding:"utf8"}).split("\n").map(l=>l.match(/^([0-9a-f]{4}):\s+((?:[0-9a-f]{2} )+)\s*(.*)$/i)).filter(Boolean).map(m=>({off:parseInt(m[1],16),txt:m[3].trim()}));
const N=+process.argv[2]||20; const filt=process.argv[3]?new RegExp(process.argv[3],"i"):null;
for(const [name,t] of teams){const out=[];
 for(const w of t.w){let ins;try{ins=dis(w)}catch(e){out.push(w+" ERR");continue}
  const regs={};
  ins.slice(0,N).forEach((x,k)=>{let m;
   if((m=x.txt.match(/^mov (ax|bx|cx|dx|di),([0-9A-F]{4})h$/i)))regs[m[1]]=m[2];
   if(/^(mov|add|sub|xchg|and|or|xor|inc|dec|stosw|movsw)\b.*\[[0-9A-F]{4}h\]/i.test(x.txt)&&/^\w+ (word |byte )?\[[0-9A-F]{4}h\]/i.test(x.txt)) out.push(`${w.split("/").pop()} #${k+1} W ${x.txt}`);
   else if(/\[[0-9A-F]{4}h\]/i.test(x.txt)) out.push(`${w.split("/").pop()} #${k+1} R ${x.txt}`);
   if(/^int 8[67]h/.test(x.txt)) out.push(`${w.split("/").pop()} #${k+1} ${x.txt} ax=${regs.ax} dx=${regs.dx} bx=${regs.bx} cx=${regs.cx} di=${regs.di}`);
  });}
 const s=out.join("\n   "); if(out.length&&(!filt||filt.test(s)||filt.test(name))) console.log(`${name} [${t.coh.size} coh]\n   ${s}`);}
