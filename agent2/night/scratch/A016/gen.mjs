// A016: generation index at death for A and B (from load address band), early-generation failure audit
import fs from 'fs';
const dir = process.argv[2], show = process.argv[3];
const hex = (v, n = 4) => (v >>> 0).toString(16).toUpperCase().padStart(n, '0');
const cfg = { CAND1: { ph: 0x2C, bp: 0x4400 }, CAND2: { ph: 0x10, bp: 0x2C00 } };
const hist = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) {
  for (const line of fs.readFileSync(dir + '/' + f, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);
    const c = cfg[r.name]; if (!c) continue;
    const band = Math.floor((r.load >> 8) / 0x3C) * 0x3C;
    const T0 = (((band + c.ph) & 0xff) << 8) | 0xA2;
    let g = 'startup';
    if (r.cs === 0x0FFB) {
      const T = (r.di & 0xff) === 0xA3 ? r.di - 1 : null;
      if (T == null) g = 'nondwell';
      else { g = '?'; for (let k = 0; k < 400; k++) if (((T0 - k * c.bp) & 0xffff) === T) { g = k; break; } }
    } else if (r.cs !== 0x1000) g = 'cs' + hex(r.cs);
    const key = r.name + ' ' + (typeof g === 'number' ? (g <= 2 ? 'gen' + g : 'gen3+') : g);
    hist[key] = (hist[key] || 0) + 1;
    if (show && key.includes(show)) console.log(f, r.war, 'r' + r.round, r.name, 'load', hex(r.load), 'T0', hex(T0), 'cs:ip', hex(r.cs) + ':' + hex(r.ip), 'sp', hex(r.sp), 'di', hex(r.di), 'si', hex(r.si), 'ax', hex(r.ax), '|', r.bytes.slice(0, 8).map(b => hex(b.v, 2) + '/' + b.by + '@' + b.r).join(' '));
  }
}
console.log(Object.entries(hist).sort().map(([k, v]) => String(v).padStart(4) + '  ' + k).join('\n'));
