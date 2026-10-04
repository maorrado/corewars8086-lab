// E8: count startup deaths (cs=1000h) of CAND1/CAND2 and the battle outcome
import fs from 'fs';
const dirs = process.argv.slice(2); let n = 0; const t = {};
for (const dir of dirs) for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) {
  const L = fs.readFileSync(dir + '/' + f, 'utf8').trim().split('\n').map(JSON.parse);
  const byWar = {}; for (const r of L) { const w = r.war ?? r.warEnd; (byWar[w] = byWar[w] || []).push(r); }
  for (const [w, rs] of Object.entries(byWar)) { n++;
    const end = rs.find(r => r.warEnd !== undefined); const won = end.winners.split(', ').filter(x => /^CAND/.test(x)).length > 0;
    const others = end.winners.split(', ').filter(x => !/^zom/.test(x)).length;
    for (const r of rs.filter(r => /^CAND/.test(r.name) && r.cs === 0x1000)) {
      const k = (r.name === 'CAND1' ? 'A' : 'B') + (won ? ' won' : ' lost'); t[k] = (t[k] || 0) + 1;
      console.log(dir.split('/').slice(-2)[0].slice(0, 16), f, 'w' + w, r.name, 'r' + r.round, r.reason, 'ip', r.ip.toString(16), 'load', r.load.toString(16), 'off', ((r.ip - r.load) & 0xffff).toString(16), won ? 'WON' : 'LOST', end.round);
    }
  }
}
console.log('battles', n, t);
