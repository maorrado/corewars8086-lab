import fs from 'fs';
const d = process.argv[2], pat = new RegExp(process.argv[3] || '.');
for (const f of fs.readdirSync(d).filter(f => f.endsWith('.jsonl') && pat.test(f))) {
  const all = fs.readFileSync(d + '/' + f, 'utf8').trim().split('\n').map(JSON.parse); const rows = all.filter(r => r.name); const ends = all.filter(r => r.warEnd !== undefined);
  const our = rows.filter(r => r.name.startsWith('CAND'));
  const wars = new Set(rows.map(r => r.war)).size;
  console.log('==', f, 'wars', ends.length, 'ourDeaths', our.length, 'capRounds', ends.filter(e=>e.round>=200000).length, 'ourScore', ends.map(e=>{const w=e.winners.split(', ').filter(x=>!x.startsWith('zom'));const c=w.filter(x=>x.startsWith('CAND')).length;return w.length?c/w.length:0}).reduce((a,b)=>a+b,0).toFixed(1));
  const agg = {};
  for (const r of our) {
    const by = r.bytes.slice(0, 2).map(b => b.by).join('/');
    const phase = r.round < 200 ? 'early' : r.round < 5000 ? 'mid' : 'late';
    const k = `${r.name} ${phase} cs=${r.cs.toString(16)} by=${by}`;
    agg[k] = (agg[k] || 0) + 1;
  }
  for (const [k, v] of Object.entries(agg).sort((a, b) => b[1] - a[1])) console.log('  ', v, k);
}
