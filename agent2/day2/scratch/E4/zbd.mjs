import { stream, run } from "../D1/absim.mjs";
const bands = [0, 0x3C00, 0x7800, 0xB400, 0xF000];
const [zbPh = 0x70, gapT = 5, R = 60000, splitPh = -1] = process.argv.slice(2).map(Number);
for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
  const S = [stream({ name: "A", id: 1, ip: (bands[i] + 0x2CA2) & 0xffff, gap: 0x100, cx: 9, dx: 0x4000, bp: 0x4400, cell: 0x2C0, startRound: 54 }),
    stream({ name: "B", id: 2, ip: (bands[j] + 0x10A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: 57 }),
    stream({ name: "zB", id: 4, ip: (bands[j] + (zbPh << 8) + 0xA2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: 70, speed: 2 }),
    stream({ name: "zD", id: 5, ip: (bands[j] + ((splitPh >= 0 ? splitPh : zbPh) << 8) + 0xA2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: 70 + gapT, speed: 2 })];
  const res = run(S, R, { stopOnDeath: false });
  console.log(i, j, res.filter(r => !r.alive).map(r => `${r.name}<-${r.death.killer}@${r.death.round}`).join(" ") || "-");
}
