import fs from 'fs';
const dir = process.argv[2];
const files = fs.readdirSync(dir).filter(f=>f.endsWith('.jsonl') && /^L/.test(f));
const tab={};
for (const f of files) {
  for (const l of fs.readFileSync(dir+'/'+f,'utf8').trim().split('\n')) {
    const r = JSON.parse(l); if (!r.name || !r.name.startsWith('T_')) continue;
    const ipby = String((r.bytes&&r.bytes[0]&&r.bytes[0].by)||'?');
    const k = `${r.reason} di=${r.di===0||r.di===2?'0/2':'x'} ipBy=${ipby.startsWith('CAND')?'CAND':ipby.startsWith('T_')?'self/T':ipby}`;
    tab[k]=(tab[k]||0)+1;
  }
}
Object.entries(tab).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(v,k));
