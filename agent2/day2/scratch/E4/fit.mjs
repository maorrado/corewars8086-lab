// E4: fit captured b/d zombie start round: which zb reproduce the traced A-by-zombie death rounds?
import { stream, run } from "../D1/absim.mjs";
const bands = [0, 0x3C00, 0x7800, 0xB400, 0xF000];
const target = [7820, 7822, 7823, 10742, 10745, 12069, 12071, 4244, 4245, 3720, 11146, 9414, 12060, 12061];
const hits = {};
for (let zb = 40; zb <= 400; zb += 1) for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
  const S = [stream({ name: "A", id: 1, ip: (bands[i] + 0x2CA2) & 0xffff, gap: 0x100, cx: 9, dx: 0x4000, bp: 0x4400, cell: 0x2C0, startRound: 54 }),
    stream({ name: "B", id: 2, ip: (bands[j] + 0x10A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: 57 }),
    stream({ name: "zB", id: 4, ip: (bands[j] + 0x70A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: zb, speed: 2 })];
  const res = run(S, 13000, { stopOnDeath: true });
  for (const r of res) if (!r.alive && r.name === "A" && r.death.killer === "zB") { const m = target.find(t => Math.abs(t - r.death.round) <= 3); if (m) (hits[zb] ??= []).push(`${i}${j}:${r.death.round}`); }
}
for (const [k, v] of Object.entries(hits)) if (v.length >= 1) console.log(k, v.join(" "));
