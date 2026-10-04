// A016: classify our-stream deaths by fatal-byte writer and register alignment
import fs from 'fs';
const dir = process.argv[2], verbose = process.argv[3] === '-v';
const hex = (v, n = 4) => (v >>> 0).toString(16).toUpperCase().padStart(n, '0');
const cnt = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) {
  for (const line of fs.readFileSync(dir + '/' + f, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);
    const self = r.name === 'CAND1' ? 'CAND1' : r.name === 'CAND2' ? 'CAND2' : (r.type === 'ZOMBIE' && r.cs === 0x0FFB ? r.name : null);
    if (!self) continue;
    const st = r.name === 'CAND1' ? 'A' : r.name === 'CAND2' ? 'B' : 'Z';
    const w0 = r.bytes[0]?.by;
    const who = w0 === 'init' ? 'init' : w0 === self ? 'self' : w0 === (self === 'CAND1' ? 'CAND2' : 'CAND1') ? 'partner' : /^zom/.test(w0) ? 'zombie' : 'opp';
    const dwell = (r.di & 0xff) === 0xA3 && r.si === 0;
    const state = r.cs === 0x1000 ? 'cs1000' : r.cs !== 0x0FFB ? 'cs' + hex(r.cs) : dwell ? 'dwell' : 'nondwell';
    const spOk = r.ss !== 0x1000 ? 'ss-priv' : (r.sp & 3) === 2 ? 'sp2' : 'SP' + (r.sp & 3);
    const k = `${st} ${state} ${spOk} fatal=${who}`;
    cnt[k] = (cnt[k] || 0) + 1;
    if (verbose && (who === 'init' || who === 'self' || spOk.startsWith('SP')) && r.cs === 0x0FFB)
      console.log(f, r.war, 'r' + r.round, st, r.name, r.reason, 'ip', hex(r.ip), 'sp', hex(r.sp), 'di', hex(r.di), 'si', hex(r.si), 'bx', hex(r.bx), 'ax', hex(r.ax), 'load', hex(r.load), '|', r.bytes.slice(0, 8).map(b => hex(b.v, 2) + '/' + b.by + '@' + b.r).join(' '));
  }
}
console.log(Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([k, v]) => String(v).padStart(4) + '  ' + k).join('\n'));
