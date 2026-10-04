// E2: who kills the leader-team (T_*) processes and ours, per cohort file, from a trace dir.
// usage: node tk.mjs <traceDir> [filePrefix]
import fs from 'fs';
const dir = process.argv[2], pre = process.argv[3] || '';
const cat = (by) => !by ? '?' : by.startsWith('CAND') ? 'CAND' : by.startsWith('T_') ? 'T' : by.startsWith('zom') ? 'zom' : (by === 'init' || by === 'load') ? by : 'opp';
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl') && f.startsWith(pre))) {
  const rows = fs.readFileSync(dir + '/' + f, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
  const wars = new Set(rows.map(r => r.war)).size;
  const tab = {};
  for (const r of rows) {
    if (!r.name) continue;
    if (!(r.name.startsWith('T_') || r.name.startsWith('CAND'))) continue;
    // writer of the most recent non-self byte among [IP-4, IP+2)
    const bs = (r.bytes || []).slice(0, 6).filter(b => !b.oob);
    const f2 = bs.filter(b => b.by !== r.name).sort((a, b) => b.r - a.r)[0];
    const k = `${r.name.startsWith('T_') ? 'T' : r.name} cs=${r.cs.toString(16)} ${r.reason.split(' ')[0]} <- ${f2 ? cat(f2.by) + (f2.by.startsWith('CAND') ? f2.by.slice(4) : '') : 'self'}`;
    tab[k] = (tab[k] || 0) + 1;
  }
  const sc = fs.readFileSync(dir + '/' + f.replace('.jsonl', '.scores.csv'), 'utf8').split('\n').filter(l => /^(CAND|T_)/.test(l)).join(' ');
  console.log('==', f, 'wars', wars, sc);
  Object.entries(tab).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('   ', v, k));
}
