// static scan: which binaries contain the B search pattern EB F9 CC CC (counting trailing arena CC fill)
import fs from "node:fs"; import path from "node:path";
const dirs = process.argv.slice(2);
const pat = [0xEB,0xF9,0xCC,0xCC];
for (const d of dirs) for (const f of fs.readdirSync(d)) { const p = path.join(d,f); if (fs.statSync(p).isDirectory()) continue;
  const b = Buffer.concat([fs.readFileSync(p), Buffer.from([0xCC,0xCC,0xCC,0xCC])]); const hits=[];
  for (let i=0;i+4<=b.length;i++) if (pat.every((v,k)=>b[i+k]===v)) hits.push(i.toString(16)+(i>0&&b[i-1]===0x0F?"*":""));
  if (hits.length) console.log(p, hits.join(" ")); }
