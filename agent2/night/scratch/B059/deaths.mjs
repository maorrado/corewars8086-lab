// B059: list CAND deaths from a trace dir with attribution detail
import fs from 'fs'; import path from 'path';
const dir = process.argv[2]; const filt = process.argv[3]||'';
for (const f of fs.readdirSync(dir).filter(f=>f.endsWith('.jsonl'))) {
  for (const line of fs.readFileSync(path.join(dir,f),'utf8').split('\n')) {
    if (!line.trim()) continue; const d = JSON.parse(line);
    if (!d.name || !d.name.startsWith('CAND')) continue;
    const by = [...new Set(d.bytes.map(b=>b.by))].join(',');
    const s = `${f} w${d.war} r${d.round} ${d.name} ${d.reason} cs=${d.cs.toString(16)} ip=${d.ip.toString(16)} lin=${((d.cs*16+d.ip)&0xffff).toString(16)} sp=${d.sp.toString(16)} load=${d.load.toString(16)} bytes=${d.bytes.map(b=>(b.v===undefined?'??':b.v.toString(16).padStart(2,'0'))+'/'+b.by+'@'+b.r).join(' ')} hist=${JSON.stringify(d.hist).slice(0,300)}`;
    if (!filt || s.includes(filt)) console.log(s);
  }
}
