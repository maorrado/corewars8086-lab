// A027: which pool warriors contain the little-endian word for a candidate cell address (static, any context)
import fs from "node:fs";
import * as F from "../../../tools/fields.mjs";
const cells=process.argv.slice(2).map(x=>parseInt(x,16));
const pools={f2025:F.field2025(),l2024:F.field2024live(),f2024:F.field2024final(),counters:F.counters(),peers:F.peers()};
for(const [pn,teams] of Object.entries(pools))for(const t of teams)for(const w of t.warriors){let b;try{b=fs.readFileSync(F.root+"/"+w)}catch{continue}
 for(const c of cells){const lo=c&255,hi=c>>8;for(let i=0;i+1<b.length;i++)if(b[i]===lo&&b[i+1]===hi)console.log(pn,w.split("/").pop(),c.toString(16),"@"+i.toString(16),[...b.slice(Math.max(0,i-2),i+4)].map(x=>x.toString(16).padStart(2,"0")).join(" "))}}
