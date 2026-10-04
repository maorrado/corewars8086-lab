// B065: static lattice estimate for call-far replicators. anchor in-page = (SEG*16 + AL) & 0xFF,
// AL = 'mov al,imm' (anchor IP low byte), SEG = segment-like immediate (0F00h-10FFh) used as far segment.
// family: AL%4==2 -> MOVSB trigger (A4 at addr%4==0? same residue as rev0 AL=A2h); AL%4==1/3 -> MOVSW-like.
import fs from "node:fs"; import { execFileSync } from "node:child_process";
import * as F from "../../../tools/fields.mjs";
const pools={f2025:F.field2025(),l2024:F.field2024live(),f2024:F.field2024final(),f2023:F.field2023final()};
const h=(x)=>x.toString(16).toUpperCase().padStart(2,"0");
const rows=[];
for(const [pn,teams] of Object.entries(pools)) for(const t of teams) for(const w of t.warriors){
  let dis; try{dis=execFileSync("node",["agent2/tools/dis86.mjs",F.root+"/"+w],{encoding:"utf8"})}catch{continue}
  const L=dis.split("\n"); const cf=L.filter(l=>/call\s+far/.test(l)).map(l=>l.split(/\s{2,}/).pop().replace("call far ",""));
  if(!cf.length)continue;
  const als=new Set(), segs=new Set();
  for(const l of L){ let m;
    if((m=l.match(/mov\s+al,([0-9A-F]+)h/i))) als.add(parseInt(m[1],16));
    if((m=l.match(/mov\s+(?:word\s+\[bx\+0?2h\]|[abcd]x|bp|si|di),\s*(0?F[0-9A-F]{2}|10[0-9A-F]{2})h\s*$/i))) segs.add(parseInt(m[1],16));
    if((m=l.match(/or\s+[a-d]x,\s*0?(F[0-9A-F]{2})h/i))) segs.add(parseInt(m[1],16));
  }
  const lat=[]; for(const s of segs) for(const a of als) lat.push(`${h(a)}@${s.toString(16)}=>${h(((s*16)+a)&0xff)}${(a&3)===2?"b":"w"}`);
  const dist=lat.map(x=>{const v=parseInt(x.slice(-3,-1),16);return (0x52-v+0x100)&0xff});
  const under=lat.filter((x,i)=>x.endsWith("b")&&dist[i]>=0x10&&dist[i]<=0x60);
  rows.push(`${pn}\t${t.name}\t${w.split("/").pop()}\tcalls=${[...new Set(cf)].join("|")}\tAL=${[...als].map(h).join(",")}\tSEG=${[...segs].map(s=>s.toString(16)).join(",")}\t${lat.join(" ")}${under.length?"\tUNDERCUT(MOVSB 10-60h below 52h): "+under.join(" "):""}`);
}
console.log(rows.join("\n"));
