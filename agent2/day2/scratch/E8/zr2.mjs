// E8: own-stream crossfire model, calibrated start rounds (A 54, B 57, captured zom20a 43, captured b/d 48), FAR_SEG fs.
import { stream, run } from "../D1/absim.mjs";
const a = Object.fromEntries(process.argv.slice(2).map(x => x.split('=')));
const R = +(a.R ?? 15000), dz = +(a.dz ?? 0), fs = parseInt(a.fs ?? 'FFB', 16), zaS = +(a.za ?? 43), zbS = +(a.zb ?? 48), aS = +(a.as ?? 54), bS = +(a.bs ?? 57);
const bands = [0, 0x3C00, 0x7800, 0xB400, 0xF000]; const W = [0.234, 0.234, 0.234, 0.234, 0.0625];
const cnt = {}; let wsum = 0, wA = 0, wB = 0, wAB = 0;
for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) for (let k = 0; k < 5; k++) for (let l = 0; l < 5; l++) {
  const w = W[i] * W[j] * W[k] * W[l];
  const S = [stream({ name: "A", id: 1, ip: (bands[i] + 0x2CA2) & 0xffff, gap: 0x100, cx: 9, dx: 0x4000, bp: 0x4400, cell: 0x2C0, startRound: aS, fs }),
    stream({ name: "B", id: 2, ip: (bands[j] + 0x10A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: bS, fs }),
    stream({ name: "zA", id: 3, ip: (bands[k] + 0x20A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: zaS + dz, speed: 2, fs }),
    stream({ name: "zB", id: 4, ip: (bands[l] + 0x70A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: zbS + dz, speed: 2, fs })];
  const out = run(S, R, {});
  wsum += w; if (!out[0].alive) wA += w; if (!out[1].alive) wB += w; if (!out[0].alive && !out[1].alive) wAB += w;
  for (const o of out) if (!o.alive && a.v) { const kk = `${o.name}<-${o.death.killer}@${o.death.round}`; cnt[kk] = (cnt[kk] || 0) + 1; }
}
console.log(`dz=${dz} fs=${fs.toString(16)} R=${R} P(A dies)=${(wA / wsum).toFixed(4)} P(B dies)=${(wB / wsum).toFixed(4)} P(both)=${(wAB / wsum).toFixed(4)}`);
if (a.v) console.log(Object.entries(cnt).sort((x, y) => +x[0].split('@')[1] - +y[0].split('@')[1]).map(([k, v]) => k + 'x' + v).join(' '));
