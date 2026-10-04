// tandem scenario summary: A,B + two captured b/d zombies (phase pB / pD, start 70 and 70+gap), 25 band combos.
import { stream, run } from "../D1/absim.mjs";
const bands = [0, 0x3C00, 0x7800, 0xB400, 0xF000]; const WQ = [14, 15, 15, 15, 2.2];
export function tandem(pB, pD, gapT, R, za = -1) {
  let w = 0, a20 = 0, a50 = 0, aR = 0, bR = 0, zR = 0; const firsts = [];
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    const ww = WQ[i] * WQ[j]; w += ww;
    const S = [stream({ name: "A", id: 1, ip: (bands[i] + 0x2CA2) & 0xffff, gap: 0x100, cx: 9, dx: 0x4000, bp: 0x4400, cell: 0x2C0, startRound: 54 }),
      stream({ name: "B", id: 2, ip: (bands[j] + 0x10A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: 57 }),
      stream({ name: "zB", id: 4, ip: (bands[j] + (pB << 8) + 0xA2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: 70, speed: 2 }),
      stream({ name: "zD", id: 5, ip: (bands[j] + (pD << 8) + 0xA2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: 70 + gapT, speed: 2 })];
    if (za >= 0) S.push(stream({ name: "zA", id: 3, ip: (bands[j] + 0x20A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: za, speed: 2 }));
    const res = run(S, R, { stopOnDeath: false });
    const A = res[0], B = res[1];
    if (!A.alive && A.death.killer !== "none") { if (A.death.round < 20000) a20 += ww; if (A.death.round < 50000) a50 += ww; aR += ww; firsts.push(A.death.round); }
    if (!B.alive && B.death.killer !== "none") bR += ww;
    if (res.slice(2).some(r => !r.alive)) zR += ww;
  }
  const f = (x) => (x / w).toFixed(2);
  return `A<20k ${f(a20)} A<50k ${f(a50)} A<R ${f(aR)} B<R ${f(bR)} zdead ${f(zR)} medianA ${firsts.sort((a, b) => a - b)[firsts.length >> 1] ?? "-"}`;
}
if ((process.argv[1] ?? "").endsWith("zbd2.mjs")) {
  const [pB, pD, R] = process.argv.slice(2, 5).map(Number); const gaps = (process.argv[5] ?? "-8,-4,-2,0,2,5,8,12").split(",").map(Number);
  for (const g of gaps) console.log(`pB ${pB.toString(16)} pD ${pD.toString(16)} gap ${g}:`, tandem(pB, pD, g, R));
}
