// Geometry at each own kill in the model: victim anchor, killer anchor and SP, coupled or free.
import { stream, run } from "./absim.mjs";
const bands = [0, 0x3C00, 0x7800, 0xB400, 0xF000];
const h = (x) => x.toString(16);
const R = +(process.argv[2] ?? 200000);
const t = {};
for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) for (const z of [44]) for (const zb of [null, 800]) {
  const S = [stream({ name: "A", id: 1, ip: bands[i] + 0x2CA2, gap: 0x100, cx: 9, dx: 0x4000, bp: 0x4400, cell: 0x2C0, startRound: 54 }),
    stream({ name: "B", id: 2, ip: bands[j] + 0x10A2, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: 57 }),
    stream({ name: "zA", id: 3, ip: bands[j] + 0x20A2, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: z, speed: 2 })];
  if (zb) S.push(stream({ name: "zB", id: 4, ip: (bands[j] + 0x70A2) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: zb, speed: 2 }));
  let snap = null;
  const res = run(S, R, { stopOnDeath: true });
  const dead = S.find(s => !s.alive); if (!dead) continue;
  const k = S.find(s => s.name === dead.death.killer);
  const vA = (dead.cellIp - 0x50) & 0xffff; // not tracked; use priv cell
  const vCell = ((dead.priv[dead.bx] | dead.priv[dead.bx + 1] << 8) - 0x50) & 0xffff;
  let desc = `vic ${dead.name} r${dead.death.round} ipArena ${h((dead.ip - 0x50) & 0xffff)} vicAnchor ${h(vCell)}`;
  if (k) { const kc = ((k.priv[k.bx] | k.priv[k.bx + 1] << 8) - 0x50) & 0xffff; const d = (k.sp - kc) & 0xffff; const len = k.name === "A" ? 0x400 : 0x800;
    desc += ` killer ${k.name} anchor ${h(kc)} sp ${h(k.sp)} sp-anchor ${h(d)} ${d <= len + 0x60 ? "coupled" : "FREE"} rel(kAnchor-vAnchor) ${h((kc - vCell) & 0xffff)}`;
    const key = `${dead.name}<-${k.name} ${d <= len + 0x60 ? "coupled" : "free"} rel=${h((kc - vCell) & 0xffff)}`; t[key] = (t[key] ?? 0) + 1; }
  console.log(`bA${i} bB${j} zb${zb}`, desc);
}
console.log(t);
