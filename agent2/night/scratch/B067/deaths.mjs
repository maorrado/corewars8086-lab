// B067: classify rev0 (CAND) deaths in existing trace dirs by the shape of the fatal bytes.
// bytes window = [ip-3 .. ip+6]; fatal byte = bytes[3] (at IP).
// trail  : the writer of the fatal byte wrote a 4-periodic pattern in the window (push trail / replicator copy)
// spot   : writer wrote <=4 bytes around IP, not periodic (bomb / anchor-hunter hit / targeted overwrite)
import fs from "node:fs";
const dirs = process.argv.slice(2).filter(a=>!a.startsWith("--")); const verbose=process.argv.includes("--v");
const agg = {}; const perWriter={};
for (const d of dirs) for (const f of fs.readdirSync(d).filter(f=>f.endsWith(".jsonl"))) {
  for (const line of fs.readFileSync(d+"/"+f,"utf8").split("\n")) { if(!line.trim())continue;
    const e = JSON.parse(line); if (!/^CAND/.test(e.name)) continue;
    const b = e.bytes||[]; if (!b.length || b[0].oob) { (agg["oob/jump"] ??= []).push(e); continue; }
    const fb=b[3]; const W=fb.by;
    const hex = b.map(x=>x.v.toString(16).padStart(2,"0")).join(" ");
    const wb = b.map((x,i)=>x.by===W?i:-1).filter(i=>i>=0);
    let per4=false; for(let s=0;s+8<=b.length;s++){ let ok=true; for(let k=0;k<4;k++){ if(b[s+k].by!==W||b[s+k+4].by!==W) ok=false; if(k!==1&&b[s+k].v!==b[s+k+4].v) ok=false;} if(ok) per4=true; }
    const hist=e.hist||[]; const last=hist.slice(-4).map(h=>h.split(" ").pop());
    const dwell = hist.length>3 && hist.slice(-4,-1).every(h=>/ ff1f/.test(h)&&!/^r\d+ 1000:/.test(h));
    const phase = /^r\d+ 1000:/.test(hist.at(-1)||"")||e.cs===4096 ? "startup" : dwell ? "dwell" : "other";
    let cls;
    if (W==="init") cls="cc-untouched"; else if (W===e.name) cls="self"; else if (W.startsWith("CAND")) cls="partner";
    else if (/^zom/.test(W)) cls=per4?"zombie-trail":"zombie-spot";
    else cls = per4 ? "opp-trail" : (wb.length<=4 ? "opp-spot" : "opp-block");
    const k=cls+"|"+phase; (agg[k] ??= []).push({f, W, hex, round:e.round, n:wb.length});
    if (cls.startsWith("opp")) { perWriter[W]??={}; perWriter[W][cls+"|"+phase]=(perWriter[W][cls+"|"+phase]||0)+1; }
  }}
let total=0; for (const v of Object.values(agg)) total+=v.length; console.log("CAND deaths",total);
for (const [k,v] of Object.entries(agg).sort()) { console.log(`== ${k} ${v.length}`);
  if (verbose && /spot|block/.test(k)) for (const x of v) console.log(`   ${x.f.padEnd(34)} ${String(x.W).padEnd(26)} r${x.round} [${x.hex}] n${x.n}`); }
console.log("\nper opponent writer:"); for (const [w,c] of Object.entries(perWriter).sort()) console.log("  ",w.padEnd(28),JSON.stringify(c));
