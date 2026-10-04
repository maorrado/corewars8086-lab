// E8: find stosw rounds (phoenix start) of captured zombies / A / B from hist of early deaths.
import fs from 'fs';
const dirs = process.argv.slice(2); const out = {};
for (const dir of dirs) for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) for (const line of fs.readFileSync(dir + '/' + f, 'utf8').trim().split('\n')) {
  const r = JSON.parse(line); if (!r.hist || !r.hist.length) continue;
  for (const h of r.hist) { const m = h.match(/^r(\d+) 1000:([0-9a-f]+) .* (ab4fff1f)$/); if (m) { const k = r.name.replace(/[12]$/, '') ; (out[k] = out[k] || []).push(+m[1]); } }
}
for (const [k, v] of Object.entries(out)) { const c = {}; v.forEach(x => c[x] = (c[x] || 0) + 1); console.log(k, JSON.stringify(c)); }
