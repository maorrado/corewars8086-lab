import fs from 'fs';
const dirs = process.argv.slice(2); const hex = (v, w = 4) => (v >>> 0).toString(16).padStart(w, '0');
for (const dir of dirs) for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) for (const line of fs.readFileSync(dir + '/' + f, 'utf8').split('\n')) {
  if (!line.trim()) continue; const r = JSON.parse(line);
  if (!(r.name === 'CAND1' || r.name === 'CAND2')) continue;
  if ((r.hist || []).some(h => / 0ff[ab]:/.test(h))) continue;
  const off = (r.ip - r.load) & 0xffff;
  console.log(`${dir.split('/').pop().slice(0,10)} ${f.replace('.jsonl','')} w${r.war} ${r.name} r${r.round} load ${hex(r.load)} ip ${hex(r.ip)} off ${hex(off,3)} ${r.reason.slice(0,10)} | ` + r.bytes.map(b => b.oob ? 'oob' : hex(b.v, 2) + ':' + b.by.replace(/^[AY]_[A-Z]+_/, '').replace('CAND1','A').replace('CAND2','B').slice(0, 8) + '@' + b.r).join(' ') + ' || ' + (r.hist||[]).slice(-3).join(' ; '));
}
