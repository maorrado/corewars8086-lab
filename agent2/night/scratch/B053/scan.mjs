import fs from "node:fs";
import * as F from "../../../tools/fields.mjs";
const teams=[...F.field2025(),...F.field2024final(),...F.field2024live(),...F.counters(),...F.peers(),
 {name:"ref_V6",warriors:["agent2/night/refs/V6/A","agent2/night/refs/V6/B"]},{name:"ref_V4",warriors:["agent2/night/refs/V4/A","agent2/night/refs/V4/B"]},
 {name:"ref_V6Guard",warriors:["agent2/night/refs/V6Guard/A","agent2/night/refs/V6Guard/B"]},{name:"ref_zchain4",warriors:["agent2/night/refs/zchain4/A","agent2/night/refs/zchain4/B"]}];
const pats={c4A17:[0x17,0x4A],c5D13:[0x13,0x5D],c9769:[0x69,0x97]};
for(const t of teams){const hits=[];for(const w of t.warriors){let b;try{b=fs.readFileSync(F.root+"/"+w)}catch{continue}
 for(const [k,p] of Object.entries(pats))for(let i=0;i+1<b.length;i++)if(b[i]===p[0]&&b[i+1]===p[1])hits.push(`${w.split("/").pop()}:${k}@${i.toString(16)}[${[...b.slice(Math.max(0,i-3),i+4)].map(x=>x.toString(16).padStart(2,"0")).join(" ")}]`);}
 if(hits.length)console.log(t.name,hits.join("  "));}
