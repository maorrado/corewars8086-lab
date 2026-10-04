import { stream, run } from "../D1/absim.mjs";
const R = +(process.argv[2] ?? 15000), dz = +(process.argv[3] ?? 0);
const bands = [0, 0x3C00, 0x7800, 0xB400, 0xF000]; const cnt = {};
for (const bA of bands) for (const bB of bands) for (const bZ of bands) for (const which of ['zA', 'zB', 'zD']) {
  const S = [stream({ name: "A", id: 1, ip: (bA + 0x2CA2) & 0xffff, gap: 0x100, cx: 9, dx: 0x4000, bp: 0x4400, cell: 0x2C0, startRound: 54 }),
    stream({ name: "B", id: 2, ip: (bB + 0x10A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: 58 })];
  const ph = which === 'zA' ? 0x20A2 : 0x70A2, st = which === 'zA' ? 42 : which === 'zB' ? 44 : 47;
  S.push(stream({ name: which, id: 3, ip: (bZ + ph) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: st + dz, speed: 2 }));
  const out = run(S, R, {});
  for (const o of out) if (!o.alive) { const k = `${o.name}<-${o.death.killer}@${o.death.round}`; cnt[k] = (cnt[k] || 0) + 1; }
}
console.log(Object.entries(cnt).sort((a, b) => +a[0].split('@')[1] - +b[0].split('@')[1]).map(([k, v]) => k + 'x' + v).join(' '));
