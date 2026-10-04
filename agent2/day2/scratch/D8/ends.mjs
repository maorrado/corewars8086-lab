import fs from 'fs';
const dir = process.argv[2];
const files = fs.readdirSync(dir).filter(f=>f.endsWith('.jsonl') && (process.argv[3]? f.includes(process.argv[3]) : true));
for (const f of files) {
  const rows = fs.readFileSync(dir+'/'+f,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter(r=>r.warEnd!==undefined);
  const tab={};
  for (const r of rows) {
    const alive = Object.entries(r.writes).filter(([n,v])=>v[1]&&!n.startsWith('zom')).map(([n,v])=>{
      const s = n.replace(/^T_/,'T').replace(/^[AY]_\w+?_/,'o:');
      const by = v[2].replace(/^T_/,'T').replace(/^[AY]_\w+?_/,'o:');
      return by===n.replace(/^T_/,'T').replace(/^[AY]_\w+?_/,'o:')? s : s+'('+by+')';
    }).sort();
    const k = (r.round>=200000?'FULL ':'end  ')+alive.join(' ');
    tab[k]=(tab[k]||0)+1;
  }
  console.log('==',f, rows.length);
  Object.entries(tab).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log('  ',v,k));
}
