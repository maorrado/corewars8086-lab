// E8: which single-zombie start round / phase produces A deaths at the trace's crossfire rounds?
import { stream, run } from "../D1/absim.mjs";
const target = process.argv[2].split(',').map(Number); const fs = parseInt(process.argv[3] ?? 'FFA', 16); const aS = +(process.argv[4] ?? 54);
const bands = [0, 0x3C00, 0x7800, 0xB400, 0xF000];
for (const ph of [0x20A2, 0x70A2]) for (let s = 20; s <= 140; s++) {
  const hits = {};
  for (const bA of bands) for (const bZ of bands) {
    const S = [stream({ name: "A", id: 1, ip: (bA + 0x2CA2) & 0xffff, gap: 0x100, cx: 9, dx: 0x4000, bp: 0x4400, cell: 0x2C0, startRound: aS, fs }),
      stream({ name: "z", id: 3, ip: (bZ + ph) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: s, speed: 2, fs })];
    const out = run(S, Math.max(...target) + 20, { stopOnDeath: true });
    if (!out[0].alive) { const r = out[0].death.round; for (const t of target) if (Math.abs(r - t) <= 4) hits[t] = (hits[t] || 0) + 1; }
  }
  if (Object.keys(hits).length) console.log('ph', ph.toString(16), 's', s, JSON.stringify(hits));
}
