// E6: list opponent binaries that contain mov ax,18FFh / 1FFFh (B8 FF 18 / B8 FF 1F) and INT 87h / INT 86h.
import fs from 'fs'; import path from 'path';
const roots = process.argv.slice(2); const seen = new Map();
for (const R of roots) for (const d of fs.readdirSync(R)) { const s = path.join(R, d, 'survivors'); if (!fs.existsSync(s)) continue; for (const f of fs.readdirSync(s)) if (!f.startsWith('CAND') && !seen.has(f)) seen.set(f, path.join(s, f)); }
const hx = b => [...b].map(x => x.toString(16).padStart(2, '0')).join('');
for (const [n, p] of [...seen].sort()) {
  const b = fs.readFileSync(p); const h = hx(b);
  const has = (pat) => { const out = []; let i = -1; while ((i = h.indexOf(pat, i + 1)) >= 0) if (i % 2 === 0) out.push(i / 2); return out; };
  const f18 = has('b8ff18'), f1f = has('b8ff1f'), i87 = has('cd87'), i86 = has('cd86'), d18 = has('ff18cccc'), d1f = has('ff1fcccc');
  if (process.env.P==="1f" ? (f1f.length||d1f.length) : (f18.length || d18.length)) console.log(n.padEnd(30), 'movaxFF@', (process.env.P==="1f"?f1f:f18).join(','), 'int87@', i87.join(','), 'int86@', i86.join(','), 'ff18cccc@', d18.join(','));
}
console.log('binaries scanned', seen.size);
