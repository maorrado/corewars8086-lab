// B067: static prevalence scan for runtime memory scanners (trail / anchor hunters) in the 2023-2025 pools.
// Flags a warrior if a memory-reading compare (cmp with memory operand, scas/cmps, or lods followed by cmp)
// is followed within 3 instructions by a conditional jump, inside a backward loop. Extra tag "SEG" when
// a compared immediate looks like a far-call segment word (0F00h-10FFh) or the check is [x]==[x+4]-style.
import fs from "node:fs"; import path from "node:path";
import { disasm } from "../../../tools/dis86.mjs";
const S = "repos/corewars8086-survivors/";
const roots = ["official-2025/survivors-online","official-2025/survivors-online-young","official-2025/zombies-live",
  S+"cgx2024", S+"cgx2024y", S+"cgx2023", S+"cgx2023y"];
const files=[]; const walk=(d)=>{ if(!fs.existsSync(d))return; for(const f of fs.readdirSync(d)){const p=path.join(d,f); const st=fs.statSync(p);
  if(st.isDirectory()) walk(p); else if(!/\.[a-z0-9]{1,4}$/i.test(f) && st.size<=512 && st.size>0) files.push(p);} };
roots.forEach(walk);
const seen=new Map(); const rows=[];
for (const p of files) { const b=fs.readFileSync(p); const key=b.toString("hex"); const pp=p.replaceAll("\\","/");
  if (seen.has(key)) { seen.get(key).dups.push(pp); continue; }
  const L=disasm(b,0); const hits=[];
  for (let i=0;i<L.length;i++){ const t=L[i].text;
    const memcmp = /^cmp .*\[/.test(t) || /^(rep |repne )?(scas|cmps)/.test(t) || (/^(lods)/.test(t) && L.slice(i+1,i+3).some(x=>/^cmp /.test(x.text)));
    if(!memcmp) continue;
    const j = L.slice(i+1,i+4).find(x=>/^j(?!mp)|^loop|^jcxz/.test(x.text)) || (/^(rep|repne) /.test(t)?L[i]:null);
    if(!j) continue;
    // loop: any backward jump within next 12 instrs to <= this address
    const back = L.slice(i,i+14).some(x=>{const m=x.text.match(/^(j\w+|loop\w*) (?:short )?([0-9A-F]{4})h/); return m && parseInt(m[2],16)<=L[i].at; });
    const imm = t.match(/,([0-9A-F]{4})h$/); const seg = (imm && parseInt(imm[1],16)>=0x0f00 && parseInt(imm[1],16)<=0x10ff) || /\[bx\+04h\]|\[si\+04h\]|\[di\+04h\]/i.test(t);
    hits.push({at:L[i].at, t, back, seg});
  }
  if (hits.length) { const r={p:pp, size:b.length, hits, dups:[]}; rows.push(r); seen.set(key,r);} else seen.set(key,{dups:[]});
}
const loopy = rows.filter(r=>r.hits.some(h=>h.back));
console.log(`files ${files.length}, unique ${seen.size}, with mem-compare+jcc ${rows.length}, in a loop ${loopy.length}`);
for (const r of loopy) console.log(`${r.hits.some(h=>h.seg)?"SEG ":"    "}${r.p} (${r.size}B${r.dups.length?" +"+r.dups.length+" dup":""}) :: ${r.hits.filter(h=>h.back).map(h=>h.at.toString(16)+" "+h.t).join(" | ")}`);
