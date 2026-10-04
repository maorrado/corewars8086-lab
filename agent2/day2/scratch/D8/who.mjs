import fs from 'fs';
const dir = process.argv[2];
const files = fs.readdirSync(dir).filter(f=>f.endsWith('.jsonl') && (process.argv[3]? f.includes(process.argv[3]) : true));
for (const f of files) {
  const rows = fs.readFileSync(dir+'/'+f,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
  const tab = {};
  const wars = new Set(rows.map(r=>r.war));
  for (const r of rows) {
    if (r.name.startsWith('zom')) continue;
    const victim = r.name.startsWith('CAND')? r.name : (r.name.startsWith('T_')? 'T:'+r.name.replace(/^T_/,'') : 'other');
    if (victim==='other') continue;
    // fatal writer: majority of bytes' by among first 2 bytes
    const by = (r.bytes||[]).slice(0,2).map(b=>b.by);
    let w = by[0]||'?';
    w = w.replace(/^T_/,'T:');
    if (!w.startsWith('CAND') && !w.startsWith('T:') && !w.startsWith('zom') && w!=='load') w='other';
    const k = `${victim} <- ${w}`;
    tab[k]=(tab[k]||0)+1;
  }
  // scores
  const sc = fs.readFileSync(dir+'/'+f.replace('.jsonl','.scores.csv'),'utf8');
  console.log('==',f, 'wars', wars.size, sc.split('\n').filter(l=>/CAND|^T_/.test(l)).join(' | '));
  Object.entries(tab).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log('  ',v,k));
}
