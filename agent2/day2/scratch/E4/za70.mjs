// zA (captured zom20a, CX!=0 path) phase 20h (DET2) vs 70h (same chain as b/d -> tandem), with/without one b/d capture.
import { stream, run } from "../D1/absim.mjs";
const bands = [0, 0x3C00, 0x7800, 0xB400, 0xF000]; const WQ = [14, 15, 15, 15, 2.2];
const mk = (name, id, j, ph, t) => stream({ name, id, ip: (bands[j] + (ph << 8) + 0xA2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: t, speed: 2 });
const R = +(process.argv[2] ?? 60000);
for (const zaPh of [0x20, 0x70]) for (const bd of [0, 1]) {
  let w = 0, a20 = 0, aR = 0, bR = 0, zR = 0;
  for (const ta of [36, 38, 40, 42]) for (const tb of (bd ? [44, 46, 48, 50] : [0])) for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    const ww = WQ[i] * WQ[j]; w += ww;
    const S = [stream({ name: "A", id: 1, ip: (bands[i] + 0x2CA2) & 0xffff, gap: 0x100, cx: 9, dx: 0x4000, bp: 0x4400, cell: 0x2C0, startRound: 54 }),
      stream({ name: "B", id: 2, ip: (bands[j] + 0x10A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: 57 }), mk("zA", 3, j, zaPh, ta)];
    if (bd) S.push(mk("zB", 4, j, 0x70, tb));
    const res = run(S, R, { stopOnDeath: false });
    if (!res[0].alive && res[0].death.killer !== "none") { aR += ww; if (res[0].death.round < 20000) a20 += ww; }
    if (!res[1].alive && res[1].death.killer !== "none") bR += ww;
    if (res.slice(2).some(r => !r.alive)) zR += ww;
  }
  const f = (x) => (x / w).toFixed(2);
  console.log(`zA ${zaPh.toString(16)} bd=${bd}: A<20k ${f(a20)} A<${R / 1000}k ${f(aR)} B ${f(bR)} zdead ${f(zR)}`);
}
