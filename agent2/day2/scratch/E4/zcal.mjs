import { stream, run } from "../D1/absim.mjs";
const bands = [0, 0x3C00, 0x7800, 0xB400, 0xF000];
const [t1, t2] = process.argv.slice(2).map(Number);
const out = [];
for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
  const S = [stream({ name: "A", id: 1, ip: (bands[i] + 0x2CA2) & 0xffff, gap: 0x100, cx: 9, dx: 0x4000, bp: 0x4400, cell: 0x2C0, startRound: 54 }),
    stream({ name: "B", id: 2, ip: (bands[j] + 0x10A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: 57 }),
    stream({ name: "zB", id: 4, ip: (bands[j] + 0x70A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: t1, speed: 2 }),
    stream({ name: "zD", id: 5, ip: (bands[j] + 0x70A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: t2, speed: 2 })];
  const res = run(S, 16000, { stopOnDeath: true });
  out.push(res.filter(r => !r.alive).map(r => `${r.name}<-${r.death.killer}@${r.death.round}`).join(""));
}
console.log(t1, t2, [...new Set(out)].join(" "));
