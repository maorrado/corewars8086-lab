import fs from "node:fs";
const d=process.argv[2]; const seen={};
for (const f of fs.readdirSync(d).filter(f=>f.endsWith(".jsonl"))) for (const line of fs.readFileSync(d+"/"+f,"utf8").split("\n")) { if(!line.trim())continue;
 const e=JSON.parse(line); if(!/^CAND/.test(e.name)||!e.bytes?.[3]||e.bytes[0].oob) continue; const W=e.bytes[3].by; if(W==="init"||/^CAND|^zom/.test(W)) continue;
 (seen[W]??=[]).push(e.bytes.map(x=>x.v.toString(16).padStart(2,"0")).join(" ")); }
for (const [w,a] of Object.entries(seen)) console.log(w.padEnd(26), a.length, a.slice(0,2).join(" | "));
