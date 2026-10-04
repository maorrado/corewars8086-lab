// E6: per battle final survivors in trace cohorts; decompose our lost share.
import fs from 'fs';
const dirs = process.argv.slice(2); const agg = {}; const perOpp = {};
let tot = 0, nb = 0, lostOwn = 0, lostShare = 0;
for (const dir of dirs) for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) {
  const sc = fs.readFileSync(dir + '/' + f.replace('.jsonl', '.scores.csv'), 'utf8').split('Warriors:')[1].trim().split('\n').map(l => l.split(',')[0]);
  const deaths = {};
  for (const line of fs.readFileSync(dir + '/' + f, 'utf8').split('\n')) { if (!line.trim()) continue; const r = JSON.parse(line); if (/^zom20/.test(r.name)) continue; (deaths[r.war] ||= {})[r.name] = r.round; }
  const nw = 20; // battles per cohort
  for (let w = 0; w < nw; w++) {
    const d = deaths[w] || {}; const alive = sc.filter(n => !(n in d));
    const ours = alive.filter(n => n.startsWith('CAND')).length; const share = alive.length ? ours / alive.length : 0;
    tot += share; nb++;
    // decomposition: share if all others same but both ours alive
    const others = alive.filter(n => !n.startsWith('CAND'));
    const ideal = 2 / (2 + others.length); lostOwn += ideal - share; lostShare += 1 - ideal;
    for (const o of new Set(others.map(n => n.replace(/[12]$/, '')))) perOpp[o] = (perOpp[o] || 0) + (1 - ideal);
    const k = `oursAlive=${ours} othersAlive=${others.length}`; agg[k] = (agg[k] || 0) + 1;
  }
}
console.log('battles', nb, 'mean share', (tot / nb).toFixed(3), 'lost to own deaths', (lostOwn / nb).toFixed(3), 'lost to surviving opponents (if ours both alive)', (lostShare / nb).toFixed(3));
console.log(Object.entries(agg).sort().map(([k, v]) => v + ' ' + k).join('\n'));
console.log(Object.entries(perOpp).sort((a, b) => b[1] - a[1]).map(([k, v]) => v.toFixed(2) + ' ' + k).join('\n'));
