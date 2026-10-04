// Run all A/B band combos for rev1 geometry (or a variant) and list kills.
import { stream, run } from "./absim.mjs";
const args = Object.fromEntries(process.argv.slice(2).map(a => a.split("=")));
const R = +(args.rounds ?? 200000);
const P = { aPh: +(args.aPh ?? 0x2CA2), bPh: +(args.bPh ?? 0x10A2), aGap: +(args.aGap ?? 0x100), bGap: +(args.bGap ?? 0x600),
  aDX: +(args.aDX ?? 0x4000), aBP: +(args.aBP ?? 0x4400), bDX: +(args.bDX ?? 0x2400), bBP: +(args.bBP ?? 0x2C00),
  aStart: +(args.aStart ?? 54), bStart: +(args.bStart ?? 57), aCX: +(args.aCX ?? 9), bCX: +(args.bCX ?? 8) };
const bands = [0, 0x3C00, 0x7800, 0xB400, 0xF000];
let kills = 0; const out = [];
for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
  const A = stream({ name: "A", id: 1, ip: (bands[i] + P.aPh) & 0xffff, gap: P.aGap, cx: P.aCX, dx: P.aDX, bp: P.aBP, cell: 0x2C0, startRound: P.aStart });
  const B = stream({ name: "B", id: 2, ip: (bands[j] + P.bPh) & 0xffff, gap: P.bGap, cx: P.bCX, dx: P.bDX, bp: P.bBP, cell: 0x280, startRound: P.bStart });
  const res = run([A, B], R, { stopOnDeath: true });
  const d = res.filter(r => !r.alive).map(r => `${r.name}@${r.death.round}(${r.death.why},by ${r.death.killer})`);
  if (d.length) kills++;
  out.push(`bandA=${i} bandB=${j} ${d.join(" ") || "-"}`);
}
console.log(out.join("\n")); console.log("combos with a death:", kills, "/ 25");
