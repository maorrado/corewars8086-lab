// D4 byte-level A/B phoenix-stream simulator (no opponents, no zombies).
// Executes the real worker bytes from arena memory with a minimal interpreter (only the opcodes our
// worker uses + MOVSB). Any other opcode reached (foreign trail bytes xx/FB/0F, CC) = death.
// usage: node absim.mjs [rounds] [phA hex pages] [phB hex pages] [opts...]
//   opts: A:dx=4000,bp=4400,gap=100,cx=9,start=56  B:dx=2400,bp=2C00,gap=600,cx=8,start=59  (hex)
const MAIN = (process.argv[1] || "").endsWith("absim.mjs"); const args = MAIN ? process.argv.slice(2) : [];
const ROUNDS = +(args[0] || 200000);
const PHA = parseInt(args[1] || "2C", 16), PHB = parseInt(args[2] || "10", 16);
const cfg = { A: { dx: 0x4000, bp: 0x4400, gap: 0x100, cx: 9, start: 56, seg: 0xffb }, B: { dx: 0x2400, bp: 0x2c00, gap: 0x600, cx: 8, start: 59, seg: 0xffb } };
for (const o of args.slice(3)) { const [w, kv] = o.split(":"); for (const p of kv.split(",")) { const [k, v] = p.split("="); cfg[w][k] = k === "start" || k === "cx" ? +v : parseInt(v, 16); } }
// worker template bytes (A and B identical): movsw; rep movsw; sub sp,dx; sub [bx],bp; mov di,[bx]; mov cl,9; xor si,si; stosw; dec di; call far [bx]; CC CC; (byte 19 = next code byte; 20+ = 0)
const TPL = [0xa5, 0xf3, 0xa5, 0x29, 0xd4, 0x29, 0x2f, 0x8b, 0x3f, 0xb1, 0x09, 0x31, 0xf6, 0xab, 0x4f, 0xff, 0x1f, 0xcc, 0xcc, 0x89, 0, 0, 0, 0];
export function sim(qA, qB, opt = {}) {
  const rounds = opt.rounds ?? ROUNDS, phA = opt.phA ?? PHA, phB = opt.phB ?? PHB, C = opt.cfg ?? cfg;
  const mem = new Uint8Array(65536).fill(0xcc), own = new Uint8Array(65536);
  const mk = (id, name, q, ph, c) => {
    const ipv = ((((q * 0x3c + ph) & 0xff) << 8) | 0xa2); // target IP (CS = seg)
    const base = (0x10000 - (0x1000 - c.seg) * 16); // arena = IP - (1000h-seg)*16
    const off = (0x1000 - c.seg) * 16;
    return { id, name, c, off, cell: ipv, cs: c.seg, ip: null, sp: (ipv + c.gap) & 0xffff, si: 0, di: (ipv + 1) & 0xffff, cx: c.cx, dx: c.dx, bp: c.bp,
      ax: 0x1fff, alive: true, t: c.start, first: true, death: null, gens: 0, early: 0, trig: 0 };
  };
  const S = [mk(1, "A", qA, phA, C.A), mk(2, "B", qB, phB, C.B)];
  const ar = (s, ipv) => (ipv - s.off) & 0xffff; // CS-relative -> arena
  const wr = (a, v, id) => { a &= 0xffff; mem[a] = v; own[a] = id; };
  const push = (s, w) => { s.sp = (s.sp - 2) & 0xffff; wr(s.sp, w & 0xff, s.id); wr(s.sp + 1, w >> 8, s.id); };
  const die = (s, r, why) => { s.alive = false; s.death = { r, why }; };
  const step = (s, r) => {
    if (s.t > 1) { s.t--; return; }
    if (s.first) { // phoenix's first stosw + call far from the code segment (CS=1000h)
      s.first = false; const a = ar(s, s.cell); wr(a, 0xff, s.id); wr(a + 1, 0x1f, s.id);
      push(s, 0x1000); push(s, 0x5577); s.ip = s.cell; return;
    }
    const a = ar(s, s.ip), op = mem[a], op2 = mem[(a + 1) & 0xffff];
    switch (op) {
      case 0xa4: wr(ar(s, s.di), TPL[s.si] ?? 0, s.id); s.si++; s.di = (s.di + 1) & 0xffff; s.ip += 1;
        if (own[a] !== s.id) s.early++; else s.trig++; return;
      case 0xa5: wr(ar(s, s.di), TPL[s.si] ?? 0, s.id); wr(ar(s, s.di + 1), TPL[s.si + 1] ?? 0, s.id); s.si += 2; s.di = (s.di + 2) & 0xffff; s.ip += 1; return;
      case 0xf3: if (op2 !== 0xa5) return die(s, r, "f3" + op2.toString(16));
        if (s.cx === 0) { s.ip += 2; return; }
        wr(ar(s, s.di), TPL[s.si] ?? 0, s.id); wr(ar(s, s.di + 1), TPL[s.si + 1] ?? 0, s.id); s.si += 2; s.di = (s.di + 2) & 0xffff; s.cx--;
        if (s.cx === 0) s.ip += 2; return;
      case 0x29: if (op2 === 0xd4) { s.sp = (s.sp - s.dx) & 0xffff; s.ip += 2; return; }
        if (op2 === 0x2f) { s.cell = (s.cell - s.bp) & 0xffff; s.ip += 2; return; }
        return die(s, r, "29" + op2.toString(16));
      case 0x8b: if (op2 !== 0x3f) return die(s, r, "8b"); s.di = s.cell; s.ip += 2; return;
      case 0xb1: s.cx = (s.cx & 0xff00) | op2; s.ip += 2; return;
      case 0x31: if (op2 !== 0xf6) return die(s, r, "31"); s.si = 0; s.ip += 2; return;
      case 0xab: wr(ar(s, s.di), s.ax & 0xff, s.id); wr(ar(s, s.di + 1), s.ax >> 8, s.id); s.di = (s.di + 2) & 0xffff; s.ip += 1; return;
      case 0x4f: s.di = (s.di - 1) & 0xffff; s.ip += 1; return;
      case 0xff: if (op2 !== 0x1f) return die(s, r, "ff" + op2.toString(16));
        push(s, s.cs); push(s, (s.ip + 2) & 0xffff); s.ip = s.cell; s.gens += (a === ar(s, s.cell)) ? 0 : 1; return;
      default: return die(s, r, op.toString(16) + (own[a] && own[a] !== s.id ? "/foreign" : ""));
    }
  };
  for (let r = 1; r <= rounds; r++) {
    for (const s of (opt.bFirst ? [S[1], S[0]] : S)) if (s.alive) step(s, r);
    if (!S[0].alive && !S[1].alive) break;
    if (opt.stopOnA && !S[0].alive) break;
    if (opt.watch && r >= opt.watch[0] && r <= opt.watch[1] && r % (opt.watch[2] || 1) === 0) console.log(r, S.map(s => `${s.name} ip ${(s.ip ?? 0).toString(16)} cell ${s.cell.toString(16)} sp ${s.sp.toString(16)} early ${s.early}`).join(" | "));
  }
  return { A: S[0].death, B: S[1].death, earlyA: S[0].early, earlyB: S[1].early };
}
if ((process.argv[1] || "").endsWith("absim.mjs")) {
  for (let qA = 0; qA < 5; qA++) for (let qB = 0; qB < 5; qB++) {
    const e = sim(qA, qB);
    console.log(qA, qB, "A", e.A ? `${e.A.r} ${e.A.why}` : "-", " B", e.B ? `${e.B.r} ${e.B.why}` : "-", " early", e.earlyA, e.earlyB);
  }
}
