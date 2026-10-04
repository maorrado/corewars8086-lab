// B065: static scan of archived pools for call-far replicators; prints call-far sites and segment-like immediates.
import fs from "node:fs"; import { execFileSync } from "node:child_process";
import * as F from "../../../tools/fields.mjs";
const pools={f2025:F.field2025(),l2024:F.field2024live(),f2024:F.field2024final(),f2023:F.field2023final(),counters:F.counters(),peers:F.peers()};
const only=process.argv[2];
for(const [pn,teams] of Object.entries(pools)){ if(only&&pn!==only)continue;
 for(const t of teams) for(const w of t.warriors){
  let dis; try{dis=execFileSync("node",["agent2/tools/dis86.mjs",F.root+"/"+w],{encoding:"utf8"})}catch(e){continue}
  const L=dis.split("\n");
  const cf=L.filter(l=>/call\s+far|jmp\s+far/.test(l));
  if(!cf.length)continue;
  const seg=L.filter(l=>/\b(0F[0-9A-F]{2}h|10[0-9A-F]{2}h)\b/i.test(l)&&!/\[/.test(l.split(/\s{2,}/).pop()||"")||/mov\s+(al|ah|[re]?s[sp]?),|add\s+sp|sub\s+sp|mov\s+word/.test(l));
  console.log(`== ${pn} ${t.name} ${w.split("/").pop()}`);
  for(const l of cf) console.log("  CF "+l.trim());
  for(const l of seg.slice(0,14)) console.log("     "+l.trim());
 }}
