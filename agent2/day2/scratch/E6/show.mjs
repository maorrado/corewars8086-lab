// E6: dump full records of selected deaths: node show.mjs dir file war name
import fs from 'fs';
const [dir, f, war, name] = process.argv.slice(2); const hex = (v, w = 4) => (v >>> 0).toString(16).padStart(w, '0');
for (const line of fs.readFileSync(dir + '/' + f + '.jsonl', 'utf8').split('\n')) {
  if (!line.trim()) continue; const r = JSON.parse(line); if (r.war != war) continue; if (name && !r.name.startsWith(name)) continue;
  console.log(`${r.name} r${r.round} ${r.reason} load ${hex(r.load)} cs ${hex(r.cs)} ip ${hex(r.ip)} ss ${hex(r.ss)} sp ${hex(r.sp)} ds ${hex(r.ds)} es ${hex(r.es)} di ${hex(r.di)} si ${hex(r.si)} bx ${hex(r.bx)} ax ${hex(r.ax)} | ` + r.bytes.map(b => b.oob ? 'oob' : hex(b.v, 2) + ':' + b.by.replace(/^[AY]_[A-Z]+_/, '').slice(0, 9) + '@' + b.r).join(' '));
  if (r.hist && r.hist.length) console.log('   hist', JSON.stringify(r.hist).slice(0, 600));
}
