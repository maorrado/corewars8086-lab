// E8: early (round < R) deaths of CAND1/CAND2 by cause class, per trace dir; outcome of the battle.
import fs from 'fs';
const R = +process.argv[2]; const dirs = process.argv.slice(3);
for (const dir of dirs) {
  let nb = 0; const t = {}; const lostBy = {};
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".jsonl") && new RegExp(process.env.FRE||".").test(f))) {
    const L = fs.readFileSync(dir + '/' + f, 'utf8').trim().split('\n').map(JSON.parse);
    const byWar = {}; for (const r of L) { const w = r.war ?? r.warEnd; (byWar[w] = byWar[w] || []).push(r); }
    for (const rs of Object.values(byWar)) { nb++;
      const end = rs.find(r => r.warEnd !== undefined); const won = end.winners.split(', ').some(x => /^CAND/.test(x));
      for (const r of rs.filter(r => /^CAND/.test(r.name) && r.round < R)) {
        const bs = r.bytes.filter(b => !b.oob && b.r >= 0);
        const z = bs.filter(b => /^zom20/.test(b.by));
        let c;
        if (z.some(b => b.r >= 30 && /^zom20[abd]/.test(b.by))) c = 'captZtrail';
        else if (z.some(b => /^zom20[bd]/.test(b.by) && b.r < 30)) c = 'bdFixed';
        else if (z.length) c = 'zomOther';
        else if (bs.some(b => /^CAND/.test(b.by) && b.by !== r.name)) c = 'partner';
        else if (bs.some(b => b.by !== r.name && b.by !== 'load' && b.by !== 'init')) c = 'opponent';
        else c = 'unknown(' + (r.cs === 0x1000 ? 'startup' : 'run') + ')';
        const k = (r.name === 'CAND1' ? 'A ' : 'B ') + c; t[k] = (t[k] || 0) + 1; if (!won) lostBy[k] = (lostBy[k] || 0) + 1;
      }
    }
  }
  console.log(dir.split('/').pop(), 'battles', nb, Object.entries(t).sort().map(([k, v]) => k + '=' + v + '(L' + (lostBy[k] || 0) + ')').join(' '));
}
