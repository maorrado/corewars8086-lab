// B067: find compares against far-call trail/anchor tags anywhere in pool binaries:
// 1FFFh (FF 1F call far [bx]), segment-like words 0FF0h-1000h, A4xx/A5xx IP words not needed.
import fs from "node:fs"; import path from "node:path";
import { disasm } from "../../../tools/dis86.mjs";
const S = "repos/corewars8086-survivors/";
const roots = ["official-2025/survivors-online","official-2025/survivors-online-young","official-2025/zombies-live",S+"cgx2024",S+"cgx2024y",S+"cgx2023",S+"cgx2023y",S+"cgx2022",S+"cgx2022y"];
const files=[]; const walk=(d)=>{ if(!fs.existsSync(d))return; for(const f of fs.readdirSync(d)){const p=path.join(d,f); const st=fs.statSync(p);
  if(st.isDirectory()) walk(p); else if(!/\.[a-z0-9]{1,4}$/i.test(f) && st.size<=512 && st.size>0) files.push(p);} };
roots.forEach(walk);
const re=/^cmp .*,(1FFFh|0FF[0-9A-F]h|1000h|FF1Fh|1EFFh|0F[0-9A-F]{2}h)$/;
for (const p of files){ const b=fs.readFileSync(p); const L=disasm(b,0);
  const h=L.filter(x=>re.test(x.text)||/^cmp (ax|bx|cx|dx|si|di|bp),(1FFFh|1000h)$/.test(x.text));
  // also: mov reg,1FFFh followed (within 4) by cmp reg/mem
  const h2=[]; L.forEach((x,i)=>{ if(/^mov (ax|bx|cx|dx|si|di|bp),1FFFh$/.test(x.text) && L.slice(i+1,i+5).some(y=>/^(cmp|repne scas|rep scas|scas)/.test(y.text))) h2.push(x); });
  if(h.length||h2.length) console.log(p.replaceAll("\\","/").padEnd(70), [...h,...h2].map(x=>x.at.toString(16)+" "+x.text).join(" | "));
}
