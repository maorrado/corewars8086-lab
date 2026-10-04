// A045 helper: FF A5 (jmp [di+d16]) deaths of our streams: effective address and attacker bytes
const fs=require('fs'),path=require('path');
const hex=(v,w=4)=>(v>>>0).toString(16).toUpperCase().padStart(w,'0');
const disp={},eaHist={},rel={},who={};let n=0;
for(const d of process.argv.slice(2)){for(const f of fs.readdirSync(d).filter(f=>f.endsWith('.jsonl'))){
 for(const line of fs.readFileSync(path.join(d,f),'utf8').split('\n')){ if(!line.trim())continue; const r=JSON.parse(line); if(!r.name)continue;
  const ours=r.name.startsWith('CAND'); const z=!/SURVIVOR/.test(r.type)&&r.ss===4096; if(!ours&&!z) continue;
  if(r.cs!==0x0FFB||r.bytes[0].v!==0xFF||r.bytes[1].v!==0xA5) continue; n++;
  const d16=r.bytes[2].v|(r.bytes[3].v<<8); const ea=(r.di+d16)&0xFFFF;
  disp[hex(r.bytes[3].v,2)]=(disp[hex(r.bytes[3].v,2)]||0)+1;
  const b=ea>>11; eaHist[b]=(eaHist[b]||0)+1;
  const k=hex((r.di-r.ip)&0xFFFF); rel[k]=(rel[k]||0)+1;
  const w=r.bytes[1].by; who[w]=(who[w]||0)+1;
 }}}
console.log('n',n);console.log('disp hi byte',disp);console.log('EA/800h bucket',eaHist);console.log('di-ip',rel);console.log('writer of A5',who);
