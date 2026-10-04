// Rough "lattice war" model: our A/B (+ captured zom20a, optional b/d zombie) vs V6 A/B phoenix streams only.
// Random bands, random team order, random zombie timing. Counts deaths and who killed whom over R rounds.
// usage: node v6war.mjs '<json variant overrides for our side>' [nRuns=200] [R=200000] [seed=1]
import { stream, run } from "./absim.mjs";
const over = JSON.parse(process.argv[2] ?? "{}"); const N = +(process.argv[3] ?? 200), R = +(process.argv[4] ?? 200000);
let seed = +(process.argv[5] ?? 1); const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x80000000; };
const CB = [0xA5,0xF3,0xA5,0x29,0x2F,0x8B,0x3F,0x8D,0xA5,0xB0,0x07,0xB1,0x09,0x31,0xF6,0xAB,0x4F,0xFF,0x1F,0xCC,0xCC,0xCC];
const CL = [0xA5,0xF3,0xA5,0x29,0xD4,0x29,0x2F,0x8B,0x3F,0xB1,0x09,0x31,0xF6,0xAB,0x4F,0x8D,0x21,0xFF,0x1F,0xCC,0xCC,0xCC];
const P = { aPh: 0x2CA2, bPh: 0x10A2, zaPh: 0x20A2, zbPh: 0x70A2, aGap: 0x100, bGap: 0x600, aDX: 0x4000, aBP: 0x4400, bDX: 0x2400, bBP: 0x2C00, aStart: 54, bStart: 57, ...over };
const bands = [0, 0x3C00, 0x7800, 0xB400, 0xF000];
const pick = () => bands[Math.min(4, Math.floor(rnd() * 4.27))]; // band 4 (F000) is a short band
const tally = {}; const add = (k) => tally[k] = (tally[k] ?? 0) + 1; let ourAlive = 0, v6Alive = 0, share = 0;
for (let n = 0; n < N; n++) {
  const bA = pick(), bB = pick(), vA = pick(), vB = pick();
  const ours = [stream({ name: "A", id: 1, ip: (bA + P.aPh) & 0xffff, gap: P.aGap, cx: 9, dx: P.aDX, bp: P.aBP, cell: P.cL ? 0x3AF : 0x2C0, startRound: P.aStart + (P.cL ? 1 : 0), coupled: P.aCoupled, tmpl: P.cL ? CL : undefined }),
    stream({ name: "B", id: 2, ip: (bB + P.bPh) & 0xffff, gap: P.bGap, cx: 8, dx: P.bDX, bp: P.bBP, cell: P.cL ? 0x7AF : 0x280, startRound: P.bStart + (P.cL ? 1 : 0), coupled: P.bCoupled, tmpl: P.cL ? CL : P.cB ? CB : undefined })];
  const v6 = [stream({ name: "VA", id: 5, ip: (vA + 0x2CA2) & 0xffff, gap: 0x100, cx: 9, dx: 0x4000, bp: 0x4400, cell: 0x2C0, startRound: 61 }),
    stream({ name: "VB", id: 6, ip: (vB + 0x10A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: 57 })];
  const zs = [stream({ name: "zA", id: 3, ip: (bB + P.zaPh) & 0xffff, gap: P.zGap ?? P.bGap, cx: 8, dx: P.bDX, bp: P.bBP, cell: P.cL ? 0x7AF : 0x280, startRound: 40 + Math.floor(rnd() * 10), speed: 2, coupled: P.bCoupled, tmpl: P.cL ? CL : P.cB ? CB : undefined })];
  if (rnd() < 0.6) zs.push(stream({ name: "zB", id: 4, ip: (bB + P.zbPh) & 0xffff, gap: P.zGap ?? P.bGap, cx: 8, dx: P.bDX, bp: P.bBP, cell: P.cL ? 0x7AF : 0x280, startRound: 100 + Math.floor(rnd() * 2000), speed: 2, coupled: P.bCoupled, tmpl: P.cL ? CL : P.cB ? CB : undefined }));
  const v6x = P.noV6 ? [] : P.twoV6 ? [...v6, stream({ name: "WA", id: 7, ip: (pick() + 0x2CA2) & 0xffff, gap: 0x100, cx: 9, dx: 0x4000, bp: 0x4400, cell: 0x2C0, startRound: 61 }), stream({ name: "WB", id: 8, ip: (pick() + 0x10A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: 57 })] : v6;
  const order = rnd() < 0.5 ? [...ours, ...v6x] : [...v6x, ...ours];
  const S = [...zs, ...order];
  const res = run(S, R, {});
  for (const r of res) if (!r.alive) { add(`${r.name}<-${r.death.killer}`); if (process.env.DBG && ["A","B"].includes(r.name) && /^[VW]/.test(r.death.killer)) { const d = r.death; const anc = (d.cell - 0x50) & 0xffff; console.log("DBG", r.name, "<-", d.killer, "r", d.round, "ipOff", ((d.ip - 0x50 - anc) & 0xffff).toString(16), "spOff", ((d.sp - anc) & 0xffff).toString(16), d.win); } }
  const oa = res.filter(r => (r.name === "A" || r.name === "B") && r.alive).length, va = res.filter(r => ["VA","VB","WA","WB"].includes(r.name) && r.alive).length;
  ourAlive += oa; v6Alive += va; share += (oa + va) ? oa / (oa + va) : 0;
}
const by = (pfx) => Object.entries(tally).filter(([k]) => pfx.some(p => k.startsWith(p + "<-"))).map(([k, v]) => `${k}:${v}`).join(" ");
console.log(JSON.stringify(over), `runs ${N} ourAlive ${ourAlive} v6Alive ${v6Alive} meanShare ${(share / N).toFixed(3)}`);
console.log("  ours:", by(["A", "B"])); console.log("  v6:  ", by(["VA", "VB"])); console.log("  zomb:", by(["zA", "zB"]));
