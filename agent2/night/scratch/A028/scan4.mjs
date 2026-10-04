import fs from "node:fs";
import * as F from "../../../tools/fields.mjs";
const groups={y25:F.field2025(),f24:F.field2024final(),l24:F.field2024live()};
const own=["agent2/night/revisions/rev0/A","agent2/night/revisions/rev0/B"];
const zom=F.zombies.z2025.map(z=>z.path);
const read=p=>{try{return fs.readFileSync(F.root+"/"+p)}catch{return null}};
const key=(b,i)=>((b[i]<<24)|(b[i+1]<<16)|(b[i+2]<<8)|b[i+3])>>>0;
const ownSet=new Set();for(const p of [...own,...zom]){const b=read(p);for(let i=0;i+3<b.length;i++)ownSet.add(key(b,i));}
// also worker+anchor arena image: FF 1F + worker bytes; trail words A4 xx FB 0F
const cnt=new Map();
for(const [g,teams] of Object.entries(groups))for(const t of teams){const s=new Set();for(const w of t.warriors){const b=read(w);if(!b)continue;for(let i=0;i+3<b.length;i++)s.add(key(b,i));}
 for(const k of s){if(!cnt.has(k))cnt.set(k,{y25:[],f24:[],l24:[]});cnt.get(k)[g].push(t.name);}}
const arr=[...cnt].map(([k,v])=>({k,v,n:v.y25.length+v.f24.length+v.l24.length})).filter(x=>x.n>=4).sort((a,b)=>b.v.y25.length-a.v.y25.length||b.n-a.n);
for(const x of arr.slice(0,+process.argv[2]||80))console.log(x.k.toString(16).padStart(8,"0"),ownSet.has(x.k)?"OWN":"   ",x.v.y25.length,x.v.f24.length,x.v.l24.length, x.v.y25.slice(0,12).join(","));
