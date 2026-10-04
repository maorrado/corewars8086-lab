// Score a geometry variant: own-stream deaths over 25 band combos x zom20a starts x b/d-zombie starts.
import { stream, run } from "./absim.mjs";
export function score(P, { R = 200000, zs = [40, 44, 48], zbs = [null, 400, 1500] } = {}) {
  const bands = [0, 0x3C00, 0x7800, 0xB400, 0xF000];
  const t = { runs: 0, A: 0, B: 0, zA: 0, zB: 0, ourAB: 0, early: [] };
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) for (const z of zs) for (const zb of zbs) {
    const S = [stream({ name: "A", id: 1, ip: (bands[i] + P.aPh) & 0xffff, gap: P.aGap, cx: 9, dx: P.aDX, bp: P.aBP, cell: 0x2C0, startRound: P.aStart }),
      stream({ name: "B", id: 2, ip: (bands[j] + P.bPh) & 0xffff, gap: P.bGap, cx: 8, dx: P.bDX, bp: P.bBP, cell: 0x280, startRound: P.bStart })];
    if (z != null) S.push(stream({ name: "zA", id: 3, ip: (bands[j] + P.zaPh) & 0xffff, gap: P.zGap ?? P.bGap, cx: 8, dx: P.bDX, bp: P.bBP, cell: 0x280, startRound: z, speed: 2 }));
    if (zb != null) S.push(stream({ name: "zB", id: 4, ip: (bands[j] + P.zbPh) & 0xffff, gap: P.zGap ?? P.bGap, cx: 8, dx: P.bDX, bp: P.bBP, cell: 0x280, startRound: zb, speed: 2 }));
    const res = run(S, R, { stopOnDeath: false });
    t.runs++;
    for (const r of res) if (!r.alive) { t[r.name]++; if (r.name === "A" || r.name === "B") { t.ourAB++; t.early.push(r.death.round); } }
  }
  t.early = t.early.sort((a, b) => a - b).slice(0, 8);
  return t;
}
export const BASE = { aPh: 0x2CA2, bPh: 0x10A2, zaPh: 0x20A2, zbPh: 0x70A2, aGap: 0x100, bGap: 0x600, aDX: 0x4000, aBP: 0x4400, bDX: 0x2400, bBP: 0x2C00, aStart: 54, bStart: 57 };
if ((process.argv[1] ?? "").endsWith("scan.mjs")) {
  const over = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.split("="); return [k, Number(v)]; }));
  const P = { ...BASE, ...over };
  console.log(JSON.stringify(over), JSON.stringify(score(P)));
}
