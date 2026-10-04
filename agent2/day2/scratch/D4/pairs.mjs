// D4: for each traced battle, our A/B load bands and whether/when A died by B (from att2 output lines)
import fs from 'fs';
const tdir = process.argv[2], rdir = process.argv[3], attTxt = process.argv[4];
const kills = {};
for (const l of fs.readFileSync(attTxt, 'utf8').split('\n')) {
  const m = l.match(/^(\S+) w(\d+) r(\d+) CAND1 (\w+) .*\| (.*)$/); if (!m) continue;
  const fatal = m[5].match(/\[([^\]]*)\]/)[1]; const by = fatal.includes(':B@') ? 'B' : fatal.includes(':zom') ? 'Z' : '?';
  kills[m[1] + ' ' + m[2]] = { r: +m[3], by };
}
const out = [];
for (const d of fs.readdirSync(rdir).filter(d => d.startsWith('cand__'))) {
  const c = d.replace(/^cand__/, '').replace(/__a2-.*/, '');
  const csv = fs.readFileSync(`${rdir}/${d}/telemetry.csv`, 'utf8').trim().split('\n');
  const hdr = csv[0].split(','); const rows = csv.slice(1).map(l => l.match(/("[^"]*"|[^,]*)(,|$)/g).map(x => x.replace(/,$/, '').replace(/"/g, '')));
  const byWar = {};
  for (const r of rows) { const o = Object.fromEntries(hdr.map((h, i) => [h, r[i]])); (byWar[o.war] ??= {})[o.name] = o; }
  for (const [w, t] of Object.entries(byWar)) {
    const A = t.CAND1, B = t.CAND2; if (!A || !B) continue;
    const qa = Math.floor(+A.loadOffset / 0x3c00), qb = Math.floor(+B.loadOffset / 0x3c00);
    const k = kills[c + ' ' + w];
    out.push(`${c.padEnd(16)} w${w.padEnd(3)} qA ${qa} qB ${qb} A ${A.alive} dR ${A.deathRound || '-'} B ${B.alive} end ${A.endRound} ${k ? 'KILL ' + k.by + ' r' + k.r : ''}`);
  }
}
console.log(out.join('\n'));
