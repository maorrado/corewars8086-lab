// E8: for each battle lost (both CAND dead), print A and B death phase, killer (att2 logic), round.
import fs from 'fs';
const dir = process.argv[2]; const filt = process.argv[3] ? new RegExp(process.argv[3]) : /./;
const isZ = (n) => /^zom20/.test(n); const hex = (v, w = 4) => v.toString(16).padStart(w, '0');
const cat = (by, me) => by === me ? 'self' : by === 'CAND1' ? 'A' : by === 'CAND2' ? 'B' : isZ(by) ? 'zombie' : (by === 'init' || by === 'load') ? by : by.replace(/[12]$/,'');
function classify(r) {
  let phase, k0;
  if (r.cs === 0x1000) { phase = 'startup'; k0 = 3; }
  else { const anc = (r.di - 1) & 0xffff; const d = (r.ip - anc) & 0xffff;
    if (d >= 1 && d <= 4) { phase = 'dwell'; k0 = 4 - d; } else { phase = 'other'; k0 = 3; } }
  const fb = r.bytes.slice(k0, 4).filter(b => !b.oob);
  let killer = 'self'; const foreign = fb.filter(b => b.by !== r.name).sort((a, b) => b.r - a.r);
  if (foreign.length) killer = cat(foreign[0].by, r.name);
  return { phase, killer };
}
const tally = {}; let lost = 0, tot = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl') && filt.test(f))) {
  const L = fs.readFileSync(dir + '/' + f, 'utf8').trim().split('\n').map(JSON.parse);
  const byWar = {};
  for (const r of L) { const w = r.war ?? r.warEnd; (byWar[w] = byWar[w] || []).push(r); }
  for (const [w, rs] of Object.entries(byWar)) {
    tot++;
    const end = rs.find(r => r.warEnd !== undefined);
    const ours = end.winners.split(', ').filter(n => /^CAND/.test(n)).length;
    if (ours) continue; lost++;
    const d = rs.filter(r => r.name === 'CAND1' || r.name === 'CAND2').map(r => { const c = classify(r); return `${r.name === 'CAND1' ? 'A' : 'B'} r${r.round} ${c.phase}<-${c.killer} cs${hex(r.cs)} ip${hex(r.ip)}`; });
    for (const r of rs.filter(r => r.name === 'CAND1' || r.name === 'CAND2')) { const c = classify(r); const k = (r.name==='CAND1'?'A ':'B ')+c.phase+'<-'+c.killer; tally[k]=(tally[k]||0)+1; }
    console.log(f.replace('.jsonl',''), 'w' + w, 'end r' + end.round, end.winners, '|', d.join(' ; '));
  }
}
console.log('lost', lost, 'of', tot);
console.log(Object.entries(tally).sort((a,b)=>b[1]-a[1]).map(([k,v])=>v+' '+k).join('\n'));
