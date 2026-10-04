// A018: tabulate CAND deaths by fault offset relative to the 52h anchor lattice
const fs=require('fs'),path=require('path');
const dirs=process.argv.slice(2);
const tab={};const ex={};
for(const d of dirs){for(const f of fs.readdirSync(d).filter(x=>x.endsWith('.jsonl'))){
 for(const line of fs.readFileSync(path.join(d,f),'utf8').split('\n')){ if(!line.trim())continue;
  const e=JSON.parse(line); if(!/^CAND/.test(e.name))continue;
  const lin=(e.cs*16+e.ip); const off=(lin-0x10000)&0xffff;
  const rel=((off-0x52)&0x3ff); // relative to lattice anchor (mod 400h)
  const b=e.bytes.map(x=>(x.v==null?"??":x.v.toString(16)).padStart(2,'0')).join(' ');
  const by=[...new Set(e.bytes.slice(0,4).map(x=>x.by))].join(',');
  const key=(e.cs===0x1000?'cs1000 ':'')+'rel '+rel.toString(16)+' '+e.reason;
  tab[key]=(tab[key]||0)+1; (ex[key]=ex[key]||[]).push(e.name+' '+f+' r'+e.round+' ['+b+'] by '+by);
 }}}
for(const k of Object.keys(tab).sort((a,b)=>tab[b]-tab[a])){console.log(tab[k],k);for(const s of ex[k].slice(0,4))console.log('    ',s);}
