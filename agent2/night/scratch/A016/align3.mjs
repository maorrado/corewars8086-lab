// A016: per-stream death audit using anchor-relative bytes (bytes[] start at IP-4)
import fs from 'fs';
const dir = process.argv[2], show = process.argv[3];
const hex = (v, n = 4) => (v >>> 0).toString(16).toUpperCase().padStart(n, '0');
const cnt = {};
let total = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) {
  for (const line of fs.readFileSync(dir + '/' + f, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);
    const isZ = r.type === 'ZOMBIE' && r.cs === 0x0FFB;
    if (!(r.name === 'CAND1' || r.name === 'CAND2' || isZ)) continue;
    const st = r.name === 'CAND1' ? 'A' : r.name === 'CAND2' ? 'B' : 'Z';
    const me = r.name;
    total++;
    let cls;
    if (r.cs !== 0x0FFB) cls = r.cs === 0x1000 ? 'startup/cs1000' : 'cs' + hex(r.cs);
    else {
      const dwell = (r.di & 0xff) === 0xA3 && r.si === 0;
      const base = (r.ip - 4) & 0xffff;
      const T = dwell ? (r.di - 1) & 0xffff : null;
      const k = dwell ? (T - base) & 0xffff : null;
      const spres = (r.sp & 3) === 2 ? '' : ' SP%4=' + (r.sp & 3);
      if (dwell && k <= 7) {
        const b0 = r.bytes[k], b1 = r.bytes[k + 1];
        let w;
        if (b0.v === 0xFF && b0.by === me && b1 && b1.v === 0x1F && b1.by === me) w = 'anchor-intact?';
        else if (b0.v === 0xCC && b0.by === 'init') w = 'anchor-never-written';
        else { const bad = (b0.by === me && b0.v === 0xFF) ? b1 : b0; w = bad.by === me ? 'self' : bad.by === 'CAND1' || bad.by === 'CAND2' ? 'partner(' + bad.by + ')' : /^zom/.test(bad.by) ? 'zombie' : 'opp'; w += ' ' + hex(b0.v, 2) + ' ' + hex(b1?.v ?? 0, 2); }
        cls = 'dwell ' + w.replace(/ [0-9A-F]{2} [0-9A-F]{2}$/, '') + spres;
        if (show && cls.includes(show)) console.log(f, r.war, 'r' + r.round, st, me, r.reason, 'ip', hex(r.ip), 'sp', hex(r.sp), 'di', hex(r.di), 'si', hex(r.si), 'k', k, '|', r.bytes.map(b => hex(b.v, 2) + '/' + b.by + '@' + b.r).join(' '));
      } else {
        cls = 'nondwell' + spres;
        if (show && cls.includes(show)) console.log(f, r.war, 'r' + r.round, st, me, r.reason, 'ip', hex(r.ip), 'sp', hex(r.sp), 'di', hex(r.di), 'si', hex(r.si), 'ax', hex(r.ax), '|', r.bytes.map(b => hex(b.v, 2) + '/' + b.by + '@' + b.r).join(' '));
      }
    }
    const key = st + ' ' + cls; cnt[key] = (cnt[key] || 0) + 1;
  }
}
console.log('total', total);
console.log(Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([k, v]) => String(v).padStart(4) + '  ' + k).join('\n'));
