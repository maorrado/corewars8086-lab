// E4: base vs TSPLIT in the own-stream emulator with calibrated start rounds (tandem 44/49 reproduces traced kills).
// variant base: every captured b/d zombie at phase 70h, start t. TSPLIT: +d rounds (detector cost), first 70h, later ones 74h.
import { stream, run } from "../D1/absim.mjs";
const bands = [0, 0x3C00, 0x7800, 0xB400, 0xF000]; const WQ = [14, 15, 15, 15, 2.2];
const R = +(process.argv[2] ?? 100000); const d = +(process.argv[3] ?? 2); const variant = process.argv[4] ?? "both";
const P2 = +(process.argv[5] ?? 0x74);
const mk = (name, id, j, ph, t) => stream({ name, id, ip: (bands[j] + (ph << 8) + 0xA2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: t, speed: 2 });
function scen(kind, t, g, za, split) {
  const acc = { w: 0, a20: 0, a50: 0, aR: 0, bR: 0, zR: 0 };
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    const w = WQ[i] * WQ[j]; acc.w += w;
    const S = [stream({ name: "A", id: 1, ip: (bands[i] + 0x2CA2) & 0xffff, gap: 0x100, cx: 9, dx: 0x4000, bp: 0x4400, cell: 0x2C0, startRound: 54 }),
      stream({ name: "B", id: 2, ip: (bands[j] + 0x10A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: 57 })];
    const dd = split ? d : 0;
    S.push(mk("z1", 4, j, 0x70, t + dd));
    if (kind === "tandem") S.push(mk("z2", 5, j, split ? P2 : 0x70, t + g + dd));
    if (za) S.push(mk("zA", 3, j, 0x20, za));
    const res = run(S, R, { stopOnDeath: false });
    const A = res[0], B = res[1];
    if (!A.alive && A.death.killer !== "none") { if (A.death.round < 20000) acc.a20 += w; if (A.death.round < 50000) acc.a50 += w; acc.aR += w; }
    if (!B.alive && B.death.killer !== "none") acc.bR += w;
    if (res.slice(2).some(r => !r.alive)) acc.zR += w;
  }
  return acc;
}
for (const kind of ["single", "tandem"]) for (const za of [0, 40]) for (const split of (variant === "both" ? [0, 1] : [+variant])) {
  const tot = { w: 0, a20: 0, a50: 0, aR: 0, bR: 0, zR: 0 };
  for (const t of [42, 44, 46, 48, 50]) for (const g of (kind === "tandem" ? [1, 2, 3, 5] : [0])) {
    const a = scen(kind, t, g, za, split); for (const k in tot) tot[k] += a[k];
  }
  const f = (x) => (x / tot.w).toFixed(3);
  console.log(`${kind.padEnd(6)} zA=${za} ${split ? "TSPLIT" : "base  "} A<20k ${f(tot.a20)} A<50k ${f(tot.a50)} A<${R / 1000}k ${f(tot.aR)} B ${f(tot.bR)} zdead ${f(tot.zR)}`);
}
