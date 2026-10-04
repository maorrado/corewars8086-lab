// E8: for each startup death (cs=1000h) of CAND1/CAND2: offsets of zom20b/zom20d hazard words (x612h, x226h) inside the body
import fs from 'fs';
const dirs = process.argv.slice(2); const size = { CAND1: 214, CAND2: 233 }; let n = 0, nh = 0;
const haz = []; for (let x = 0; x < 16; x++) { haz.push([(x << 12) | 0x612, 'b']); haz.push([(x << 12) | 0x226, 'd']); }
for (const dir of dirs) for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) {
  for (const line of fs.readFileSync(dir + '/' + f, 'utf8').trim().split('\n')) { const r = JSON.parse(line);
    if (!/^CAND/.test(r.name) || r.cs !== 0x1000 || r.round > 200) continue; n++;
    const offs = haz.map(([h, z]) => [((h - r.load) & 0xffff), z]).filter(([o]) => o < size[r.name] + 1).map(([o, z]) => z + o.toString(16));
    if (offs.length) nh++;
    const zb = r.bytes.filter(b => !b.oob && /^zom20/.test(b.by)).map(b => b.by + '@' + b.r);
    console.log(r.name, 'r' + r.round, 'off', ((r.ip - r.load) & 0xffff).toString(16), 'haz', offs.join(',') || '-', 'zbytes', zb.join(',') || '-', f);
  } }
console.log('startup deaths', n, 'with hazard in body', nh);
