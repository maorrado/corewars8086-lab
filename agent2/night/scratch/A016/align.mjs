// A016: alignment audit of trace deaths (our streams: CAND1=A, CAND2=B, zombies running at CS 0FFBh)
import fs from 'fs';
const dir = process.argv[2];
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'));
const hex = (v, n = 4) => (v >>> 0).toString(16).toUpperCase().padStart(n, '0');
const rows = [];
for (const f of files) {
  for (const line of fs.readFileSync(dir + '/' + f, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);
    const ours = r.name === 'CAND1' || r.name === 'CAND2';
    const zOurs = r.type === 'ZOMBIE' && r.cs === 0x0FFB;
    if (!ours && !zOurs) continue;
    const phys = r.cs * 16 + r.ip - 0x10000;
    const stream = r.name === 'CAND1' ? 'A' : r.name === 'CAND2' ? 'B' : 'Z:' + r.name;
    let phase = 'other';
    let rel = null;
    if (r.cs === 0x0FFB) {
      // anchor = di-1 (dwell: DI = T+1); arena anchor = T-50h
      const inpage = phys & 0xff;
      rel = (inpage - 0x52 + 0x100) & 0xff;
      phase = rel === 0 ? 'anchor' : rel <= 0x11 ? 'worker+' + rel.toString(16) : 'off-lattice(' + hex(inpage, 2) + ')';
    } else if (r.cs === 0x1000) phase = 'cs1000';
    const spRes = r.ss === 0x1000 ? (r.sp & 3) : 'ss' + hex(r.ss);
    const writers = [...new Set(r.bytes.slice(0, 4).map(b => b.by))].join('+');
    const b4 = r.bytes.slice(0, 4).map(b => hex(b.v, 2)).join(' ');
    // expected anchor from pointer: arena anchor in-page 52h; SP - anchor distance
    const anchorGuess = r.cs === 0x0FFB ? ((phys - rel) & 0xffff) : null;
    const dist = anchorGuess != null && r.ss === 0x1000 ? ((r.sp - anchorGuess) & 0xffff) : null;
    rows.push({ f, round: r.round, stream, reason: r.reason, phase, spRes, dist: dist == null ? '-' : hex(dist), di: hex(r.di), si: hex(r.si), ds: hex(r.ds), es: hex(r.es), b4, writers });
  }
}
const cnt = {};
for (const x of rows) { const k = x.stream.startsWith('Z') ? 'Z' : x.stream; const key = `${k} ${x.phase} sp%4=${x.spRes}`; cnt[key] = (cnt[key] || 0) + 1; }
console.log(Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([k, v]) => v + '  ' + k).join('\n'));
if (process.argv[3] === '-v') for (const x of rows) console.log(JSON.stringify(x));
