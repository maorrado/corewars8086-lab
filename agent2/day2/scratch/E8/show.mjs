// E8: dump death records of CAND1/CAND2 (or name regex) for file+war
import fs from 'fs';
const [dir, file, war, nameRe] = process.argv.slice(2);
const re = new RegExp(nameRe || '^CAND');
const hex = (v, w = 4) => v.toString(16).padStart(w, '0');
for (const line of fs.readFileSync(dir + '/' + file + '.jsonl', 'utf8').trim().split('\n')) {
  const r = JSON.parse(line); if ((r.war ?? r.warEnd) != war) continue;
  if (r.warEnd !== undefined) { console.log('END', r.round, r.winners, JSON.stringify(r.writes)); continue; }
  if (!re.test(r.name)) continue;
  console.log(`${r.name} r${r.round} ${r.reason} load ${hex(r.load)} cs ${hex(r.cs)} ip ${hex(r.ip)} sp ${hex(r.sp)} ss ${hex(r.ss)} ds ${hex(r.ds)} es ${hex(r.es)} di ${hex(r.di)} si ${hex(r.si)} bx ${hex(r.bx)} ax ${hex(r.ax)}`);
  console.log('  bytes', r.bytes.map((b, i) => (i === 4 ? '|' : '') + (b.oob ? 'oob' : hex(b.v, 2) + ':' + b.by + '@' + b.r)).join(' '));
  for (const h of r.hist || []) console.log('   ', JSON.stringify(h));
}
