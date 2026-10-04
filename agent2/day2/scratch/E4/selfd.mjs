// E4: list DET2 A/B deaths whose fatal bytes are self/partner/our-captured-zombie written, with geometry.
import fs from 'fs';
const dir = process.argv[2]; const filt = process.argv[3] || 'selfish';
const isZ = (n) => /^zom20/.test(n); const hex = (v, w = 4) => (v ?? 0).toString(16).padStart(w, '0');
const tally = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) {
  const L = fs.readFileSync(dir + '/' + f, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
  for (const r of L) {
    if (r.name !== 'CAND1' && r.name !== 'CAND2') continue;
    const capt = new Set(r.alive.filter(a => a.z && (a.ipBy === 'CAND1' || a.ipBy === 'CAND2')).map(a => a.n));
    const cat = (by) => by === r.name ? 'self' : (by === 'CAND1' || by === 'CAND2') ? 'partner' : isZ(by) ? (capt.has(by) ? 'ourZ' : 'zombie') : (by === 'init' || by === 'load') ? by : 'opp';
    let phase, k0;
    if (r.cs === 0x1000) { phase = 'startup'; k0 = 3; }
    else { const anc = (r.di - 1) & 0xffff; const d = (r.ip - anc) & 0xffff; if (d >= 1 && d <= 4) { phase = 'dwell'; k0 = 4 - d; } else { phase = 'other'; k0 = 3; } }
    const fb = r.bytes.slice(k0, 4).filter(b => !b.oob);
    const foreign = fb.filter(b => b.by !== r.name).sort((a, b) => b.r - a.r);
    const killer = foreign.length ? cat(foreign[0].by) : 'self';
    const key = `${r.name === 'CAND1' ? 'A' : 'B'} ${phase} ${r.reason.split(' ')[0]} <- ${killer}`; tally[key] = (tally[key] || 0) + 1;
    if (filt === 'all' || (filt === 'selfish' && ['self', 'partner', 'ourZ'].includes(killer)) || filt === killer) {
      const H = r.hist.slice(-12);
      console.log(`--- ${f} w${r.war} r${r.round} ${r.name} ${phase} ${r.reason} killer=${killer}(${foreign[0]?.by ?? ''}) cs ${hex(r.cs)} ip ${hex(r.ip)} sp ${hex(r.sp)} di ${hex(r.di)} si ${hex(r.si)} es ${hex(r.es)} bx ${hex(r.bx)}`);
      console.log('   bytes', r.bytes.map((b, i) => (i === k0 ? '[' : '') + (b.oob ? 'oob' : hex(b.v, 2) + ':' + b.by.replace('CAND1', 'A').replace('CAND2', 'B') + '@' + b.r) + (i === 3 ? ']' : '')).join(' '));
      console.log('   capt', [...capt].join(','), ' hist:'); for (const h of H) console.log('     ' + h);
    }
  }
}
for (const [k, v] of Object.entries(tally).sort()) console.error(String(v).padStart(4), k);
