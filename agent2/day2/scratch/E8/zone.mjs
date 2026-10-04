import { stream, run } from "../D1/absim.mjs";
const [bA, bZ, ph, fs, s0, s1, R] = process.argv.slice(2).map(x => parseInt(x, 16));
for (let s = s0; s <= s1; s++) {
  const S = [stream({ name: "A", id: 1, ip: (bA + 0x2CA2) & 0xffff, gap: 0x100, cx: 9, dx: 0x4000, bp: 0x4400, cell: 0x2C0, startRound: 54, fs }),
    stream({ name: "z", id: 3, ip: (bZ + ph) & 0xffff, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, startRound: s, speed: 2, fs })];
  let calls = [];
  const out = run(S, R, { onCall: (st, r) => { if (st.name === 'A' && calls.length < 0) calls.push(r); } });
  console.log(s, out.map(o => o.name + ':' + (o.alive ? 'alive' : o.death.round + '/' + o.death.killer + '/' + o.death.why)).join(' '));
}
