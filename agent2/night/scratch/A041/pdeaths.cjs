// Count CAND1/CAND2 deaths whose bytes at the faulting IP were written by the partner.
const fs=require('fs'),path=require('path');
const root='agent2/night/scratch/_trace';
for(const d of fs.readdirSync(root)){
  const dir=path.join(root,d); let tot={A:0,B:0},part={A:0,B:0},partAny={A:0,B:0},ex=[];
  let battles=new Set();
  for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.jsonl'))){
    for(const line of fs.readFileSync(path.join(dir,f),'utf8').split('\n')){
      if(!line.trim())continue; const r=JSON.parse(line); battles.add(f+r.war);
      if(r.name!=='CAND1'&&r.name!=='CAND2')continue;
      const me=r.name==='CAND1'?'A':'B', pn=r.name==='CAND1'?'CAND2':'CAND1';
      tot[me]++;
      const b0=r.bytes.slice(0,2).map(x=>x.by);
      if(b0[0]===pn){part[me]++; ex.push(`${f} w${r.war} r${r.round} ${r.name} ${r.reason} cs=${r.cs.toString(16)} ip=${r.ip.toString(16)} sp=${r.sp.toString(16)} ` + r.bytes.slice(0,6).map(x=>x.v.toString(16)+'/'+x.by+'@'+x.r).join(' '));}
      else if(r.bytes.slice(0,4).some(x=>x.by===pn)){partAny[me]++; ex.push(`  (any) ${f} w${r.war} r${r.round} ${r.name} ${r.reason} ip=${r.ip.toString(16)} `+ r.bytes.slice(0,6).map(x=>x.v.toString(16)+'/'+x.by+'@'+x.r).join(' '));}
    }
  }
  console.log(d,'battles',battles.size,'deaths',JSON.stringify(tot),'partner-first-byte',JSON.stringify(part),'partner-in-4',JSON.stringify(partAny));
  ex.forEach(e=>console.log('   ',e));
}
