// E8: own-stream crossfire model (D1 absim: A, B, 3 captured zombies on 52h lattice, no opponents).
// Compares member (A/B) deaths by own streams within R rounds for zombie start rounds base vs +delay.
import { stream, run } from "../D1/absim.mjs";
const R = +(process.argv[2] ?? 8000), N = +(process.argv[3] ?? 2000), D = +(process.argv[4] ?? 20.5);
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x80000000;
const band = () => { const L = Math.floor(rnd() * 0x10000); return Math.floor(L / 0x3C00) * 0x3C00; };
const res = { base: {}, delay: {} };
for (let n = 0; n < N; n++) {
  const bA = band(), bB = band(), bZa = band(), bZb = band(), bZd = band();
  const has = [true, rnd() < 0.9, rnd() < 0.8]; // capture probabilities (rough)
  for (const arm of ['base', 'delay']) {
    const dz = arm === 'delay' ? Math.round(D) : 0;
    const S = [stream({ name: "A", id: 1, ip: (bA + 0x2CA2) & 0xffff, gap: 0x100, cx: 9, dx: 0x4000, bp: 0x4400, cell: 0x2C0, startRound: 54 }),
      stream({ name: "B", id: 2, ip: (bB + 0x10A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: 58 })];
    if (has[0]) S.push(stream({ name: "zA", id: 3, ip: (bZa + 0x20A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: 42 + dz, speed: 2 }));
    if (has[1]) S.push(stream({ name: "zB", id: 4, ip: (bZb + 0x70A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: 44 + dz, speed: 2 }));
    if (has[2]) S.push(stream({ name: "zD", id: 5, ip: (bZd + 0x70A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: 47 + dz, speed: 2 }));
    const out = run(S, R, {});
    const t = res[arm];
    const dA = !out[0].alive, dB = !out[1].alive;
    t.n = (t.n || 0) + 1; if (dA) t.A = (t.A || 0) + 1; if (dB) t.B = (t.B || 0) + 1; if (dA && dB) t.AB = (t.AB || 0) + 1;
    const zd = out.slice(2).filter(o => !o.alive).length; t.zdead = (t.zdead || 0) + zd;
    for (const o of out.slice(0, 2)) if (!o.alive) { const k = o.name + '<-' + o.death.killer; t[k] = (t[k] || 0) + 1; }
  }
}
console.log(JSON.stringify(res, null, 0));
