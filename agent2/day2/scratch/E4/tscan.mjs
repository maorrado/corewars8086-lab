// single captured b/d zombie (phase ph) at start t: weighted A<20k, A<R, B<R, zombie dead, over 25 band combos.
import { stream, run } from "../D1/absim.mjs";
const bands = [0, 0x3C00, 0x7800, 0xB400, 0xF000]; const WQ = [14, 15, 15, 15, 2.2];
const [t0, t1, ph = 0x70, R = 60000, bS = 57] = process.argv.slice(2).map(Number);
for (let t = t0; t <= t1; t++) {
  let w = 0, a20 = 0, aR = 0, bR = 0, zR = 0;
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    const ww = WQ[i] * WQ[j]; w += ww;
    const S = [stream({ name: "A", id: 1, ip: (bands[i] + 0x2CA2) & 0xffff, gap: 0x100, cx: 9, dx: 0x4000, bp: 0x4400, cell: 0x2C0, startRound: 54 }),
      stream({ name: "B", id: 2, ip: (bands[j] + 0x10A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: bS }),
      stream({ name: "z", id: 4, ip: (bands[j] + (ph << 8) + 0xA2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: t, speed: 2 })];
    const res = run(S, R, { stopOnDeath: false });
    if (!res[0].alive && res[0].death.killer !== "none") { aR += ww; if (res[0].death.round < 20000) a20 += ww; }
    if (!res[1].alive && res[1].death.killer !== "none") bR += ww;
    if (!res[2].alive) zR += ww;
  }
  const f = (x) => (x / w).toFixed(2);
  console.log(`ph ${ph.toString(16)} t ${t}: A<20k ${f(a20)} A<${R / 1000}k ${f(aR)} B ${f(bR)} z ${f(zR)}`);
}
