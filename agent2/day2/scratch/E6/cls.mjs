// E6: hist-based death classification for our streams (A, B, captured zombies).
// Normal states: D = dwell (IP in-page A2, bytes FF 1F ..), R = rebuild/worker (IP = anchor+k, k in 0..16, bytes match
// a4 + template). First abnormal entry after the last normal one = moment the stream left its code.
import fs from 'fs';
const T = [0xa4, 0xa5, 0xf3, 0xa5, 0x29, 0xd4, 0x29, 0x2f, 0x8b, 0x3f, 0xb1, 0x09, 0x31, 0xf6, 0xab, 0x4f, 0xff, 0x1f, 0xcc, 0xcc, 0xcc, 0xcc];
const args = process.argv.slice(2); const dirs = args.filter(a => !a.startsWith('--')); const teamOnly = args.includes('--cohort25');
const isZ = n => /^zom20/.test(n);
const tal = {}; const ex = {};
function norm(h) {
  if (!(h.cs === '0ffb' || h.cs === '0ffa')) return null;
  const k = (h.ip & 0xff) - 0xa2; if (k < 0 || k > 0x12) return null;
  const by = h.b.match(/../g).map(x => parseInt(x, 16));
  if (k === 0 && by[0] === 0xff && by[1] === 0x1f) return 'D';
  for (let i = 0; i < 4; i++) { const e = T[k + i]; if (e === undefined) break; if (k + i === 0) { if (by[i] !== 0xa4) return null; } else if (by[i] !== e) { if (i === 0) return null; else return 'Rx'; } }
  return 'R' + k.toString(16);
}
for (const dir of dirs) for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) {
  if (teamOnly && !f.startsWith('p2025')) continue;
  for (const line of fs.readFileSync(dir + '/' + f, 'utf8').split('\n')) {
    if (!line.trim()) continue; const r = JSON.parse(line);
    const ours = r.name === 'CAND1' || r.name === 'CAND2'; const capt = isZ(r.name) && (r.cs === 0xffb || r.cs === 0xffa || (r.hist || []).some(h => / 0ff[ab]:/.test(h)));
    if (!ours && !capt) continue;
    const who = r.name === 'CAND1' ? 'A' : r.name === 'CAND2' ? 'B' : 'Z';
    const H = (r.hist || []).map(h => { const m = h.match(/^r(\d+) ([0-9a-f]+):([0-9a-f]+) sp=(\w+) di=(\w+) si=(\w+) cx=(\w+) dx=(\w+) (\S+)/); return m && { r: +m[1], cs: m[2], ip: parseInt(m[3], 16), b: m[9] }; }).filter(Boolean);
    let k;
    if (!H.some(h => h.cs === '0ffb' || h.cs === '0ffa')) k = `${who} startup`;
    else {
      let j = H.length - 1; while (j >= 0 && !(norm(H[j]) || '').match(/^(D|R[0-9a-f]+)$/)) j--;
      if (j < 0) k = `${who} unknown(hist-short)`;
      else {
        const st = norm(H[j]); const nx = H[j + 1];
        const nb = nx ? nx.b : (r.bytes||[]).slice(4,8).map(x=>x.oob?'--':x.v.toString(16).padStart(2,'0')).join('');
        if (st === 'D') k = `${who} dwell-hit`;
        else { const off = parseInt(st.slice(1), 16); k = `${who} rebuild-hit ${off <= 2 ? 'k0-2(copy start)' : off <= 4 ? 'k3-4(rep movsw)' : 'k5+(worker)'}`; }
        (ex[k] ||= []).push(`${f.replace('.jsonl','')} w${r.war} r${r.round} ${st}->${nb}`);
      }
    }
    tal[k] = (tal[k] || 0) + 1;
  }
}
for (const [k, v] of Object.entries(tal).sort()) console.log(String(v).padStart(4), k.padEnd(34), (ex[k] || []).slice(0, 3).join(' | '));
