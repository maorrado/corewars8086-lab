// A/B + captured zom20a (bp 2000h, band of B, speed 2) and/or one captured b/d zombie (bp 7000h), scanning start rounds.
import { stream, run } from "./absim.mjs";
const args = Object.fromEntries(process.argv.slice(2).map(a => a.split("=")));
const R = +(args.rounds ?? 200000);
const P = { aPh: +(args.aPh ?? 0x2CA2), bPh: +(args.bPh ?? 0x10A2), zaPh: +(args.zaPh ?? 0x20A2), zbPh: +(args.zbPh ?? 0x70A2),
  aGap: +(args.aGap ?? 0x100), bGap: +(args.bGap ?? 0x600), aDX: +(args.aDX ?? 0x4000), aBP: +(args.aBP ?? 0x4400), bDX: +(args.bDX ?? 0x2400), bBP: +(args.bBP ?? 0x2C00),
  aStart: +(args.aStart ?? 54), bStart: +(args.bStart ?? 57) };
const zs = (args.zs ?? "40").split(",").map(Number); const zbs = (args.zbs ?? "").split(",").filter(Boolean).map(Number);
const bands = [0, 0x3C00, 0x7800, 0xB400, 0xF000];
const tally = {};
for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) for (const z of zs) for (const zb of (zbs.length ? zbs : [null])) {
  const S = [stream({ name: "A", id: 1, ip: (bands[i] + P.aPh) & 0xffff, gap: P.aGap, cx: 9, dx: P.aDX, bp: P.aBP, cell: 0x2C0, startRound: P.aStart }),
    stream({ name: "B", id: 2, ip: (bands[j] + P.bPh) & 0xffff, gap: P.bGap, cx: 8, dx: P.bDX, bp: P.bBP, cell: 0x280, startRound: P.bStart })];
  if (z >= 0) S.push(stream({ name: "zA", id: 3, ip: (bands[j] + P.zaPh) & 0xffff, gap: P.bGap, cx: 8, dx: P.bDX, bp: P.bBP, cell: 0x280, startRound: z, speed: 2 }));
  if (zb != null) S.push(stream({ name: "zB", id: 4, ip: (bands[j] + P.zbPh) & 0xffff, gap: P.bGap, cx: 8, dx: P.bDX, bp: P.bBP, cell: 0x280, startRound: zb, speed: 2 }));
  const res = run(S, R, { stopOnDeath: !args.all });
  const d = res.filter(r => !r.alive).map(r => `${r.name}@${r.death.round}(${r.death.why},by ${r.death.killer})`);
  for (const r of res.filter(r => !r.alive)) { const k = `${r.name} by ${r.death.killer}`; tally[k] = (tally[k] ?? 0) + 1; }
  if (args.v) console.log(`bA=${i} bB=${j} z=${z} zb=${zb} ${d.join(" ") || "-"}`);
}
console.log(JSON.stringify(tally));
