// E6: for our stream deaths, find the last hist entry; classify by IP position relative to the anchor and bytes there.
import fs from 'fs';
const dirs = process.argv.slice(2); const isZ = n => /^zom20/.test(n);
const tal = {}; const ex = {};
for (const dir of dirs) for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'))) for (const line of fs.readFileSync(dir + '/' + f, 'utf8').split('\n')) {
  if (!line.trim()) continue; const r = JSON.parse(line);
  const ours = r.name === 'CAND1' || r.name === 'CAND2'; if (!ours) continue;
  const who = r.name === 'CAND1' ? 'A' : 'B';
  if (r.cs === 0x1000 && !(r.hist||[]).some(h => !h.includes(' 1000:'))) { const k = who + ' startup'; tal[k] = (tal[k] || 0) + 1; continue; }
  const H = (r.hist || []).map(h => { const m = h.match(/^r(\d+) ([0-9a-f]+):([0-9a-f]+) sp=(\w+) di=(\w+) si=(\w+) cx=(\w+) dx=(\w+) (\S+)/); return m && { r: +m[1], cs: m[2], ip: parseInt(m[3], 16), sp: parseInt(m[4], 16), di: parseInt(m[5], 16), b: m[9] }; }).filter(Boolean);
  // find the last entry executing at an anchor (ip low byte a2 and cs 0ffb/0ffa)
  let k;
  const last = H[H.length - 1];
  if (!last) { k = who + ' nohist'; }
  else {
    // last normal instruction: walk back to the first entry that is not our normal code
    const inPage = last.ip & 0xff;
    if ((last.cs === '0ffb' || last.cs === '0ffa') && inPage === 0xa2 && last.b.slice(0, 4) !== 'ff1f' ) k = `${who} anchorHit ${last.b.slice(0,2)}${last.b.slice(2,4)}`;
    else if ((last.cs === '0ffb' || last.cs === '0ffa') && inPage === 0xa2) k = `${who} anchorNormal->${r.cs.toString(16)}:${r.ip.toString(16)}`;
    else if ((last.cs === '0ffb' || last.cs === '0ffa') && inPage > 0xa2 && inPage <= 0xb6) k = `${who} worker+${(inPage - 0xa2).toString(16)}`;
    else {
      // find last anchor-ish entry in hist
      let j = H.length - 1; while (j >= 0 && !((H[j].ip & 0xff) === 0xa2)) j--;
      k = `${who} wander` + (j >= 0 ? ` from-anchor ${H[j].b.slice(0, 4)}` : ' (no anchor in hist)');
    }
  }
  tal[k] = (tal[k] || 0) + 1; (ex[k] ||= []).push(`${f} w${r.war} r${r.round}`);
}
for (const [k, v] of Object.entries(tal).sort((a, b) => b[1] - a[1])) console.log(String(v).padStart(4), k, '  e.g.', ex[k] ? ex[k].slice(0, 2).join('; ') : '');
