// E2 lattice-war model (extends D1 absim/v6war): our A/B (+ captured zombies on B's lattice) vs one leader team's
// phoenix streams. Executes the real worker bytes; any opcode outside the worker set = death.
// Added opcodes: 8B 3E d16 (mov di,[d16]), FF 1E d16 (call far [d16]), FF 18 (call far [bx+si]).
// usage: node sim.mjs <ourVariant DET2|MC|CF> <ourFS hex> <opp: V6|ZC|none> [N] [R] [seed]
const M = 0xffff;
const T = {
  DET2A: [0xA5,0xF3,0xA5,0x29,0xD4,0x29,0x2F,0x8B,0x3F,0xB1,0x09,0x31,0xF6,0xAB,0x4F,0xFF,0x1F,0xCC,0xCC,0x89],
  DET2B: [0xA5,0xF3,0xA5,0x29,0xD4,0x29,0x2F,0x8B,0x3F,0xB1,0x09,0x31,0xF6,0xAB,0x4F,0xFF,0x1F,0xCC,0xCC,0xCC],
  MCA:   [0xA5,0xF3,0xA5,0x29,0xD4,0x29,0x2F,0x8B,0x3E,0x00,0x03,0xB1,0x09,0x31,0xF6,0xAB,0x4F,0xFF,0x1F,0xCC,0xCC,0x89],
  MCB:   [0xA5,0xF3,0xA5,0x29,0xD4,0x29,0x2F,0x8B,0x3E,0x00,0x03,0xB1,0x09,0x31,0xF6,0xAB,0x4F,0xFF,0x1F,0xCC,0xCC,0xCC],
  CFA:   [0xA5,0xF3,0xA5,0x29,0xD4,0x29,0x2F,0x8B,0x3F,0xB1,0x09,0x31,0xF6,0xAB,0x4F,0xFF,0x1E,0x00,0x03,0xCC],
  CFB:   [0xA5,0xF3,0xA5,0x29,0xD4,0x29,0x2F,0x8B,0x3F,0xB1,0x09,0x31,0xF6,0xAB,0x4F,0xFF,0x1E,0x00,0x03,0xCC],
  V6A:   [0xA5,0xF3,0xA5,0x29,0xD4,0x29,0x2F,0x8B,0x3F,0xB1,0x09,0x31,0xF6,0xAB,0x4F,0xFF,0x1F,0x89],
  V6B:   [0xA5,0xF3,0xA5,0x29,0xD4,0x29,0x2F,0x8B,0x3F,0xB1,0x09,0x31,0xF6,0xAB,0x4F,0xFF,0x1F,0xCC],
  ZC:    [0xA5,0xF3,0xA5,0x29,0xD4,0x29,0x2F,0x8B,0x3F,0xB1,0x09,0x31,0xF6,0xAB,0x4F,0xFF,0x18,0xCC],
};
function stream(o) {
  const priv = new Uint8Array(0x800); o.tmpl.forEach((b, i) => priv[i] = b);
  // SP = IP + gap as an arena (SS=CS=1000h) offset, as in phoenix_init (mov sp,di; add sp,gap)
  return { name: o.name, id: o.id, team: o.team, alive: true, speed: o.speed ?? 1, start: o.start, phase: 0, ip: 0, cs: 0x1000,
    ax: o.ax ?? 0x1FFF, cx: o.cx, dx: o.dx, bp: o.bp, sp: (o.ip + o.gap) & M, si: 0, di: o.ip, bx: o.cell,
    fs: o.fs, priv, cellIp: o.ip, death: null };
}
function run(streams, rounds) {
  const mem = new Uint8Array(0x10000).fill(0xCC), who = new Int16Array(0x10000).fill(-1), when = new Int32Array(0x10000).fill(-1);
  let round = 0;
  const ar = (seg, off) => { const L = (seg << 4) + (off & M); if (L < 0x10000 || L > 0x1FFFF) return -1; return L - 0x10000; };
  const wr = (s, a, v) => { if (a < 0) throw { mem: true }; mem[a] = v & 0xff; who[a] = s.id; when[a] = round; };
  const push = (s, w) => { s.sp = (s.sp - 2) & M; wr(s, s.sp, w); wr(s, (s.sp + 1) & M, w >> 8); };
  const rw = (s, o) => s.priv[o & 0x7ff] | (s.priv[(o + 1) & 0x7ff] << 8);
  const ww = (s, o, v) => { s.priv[o & 0x7ff] = v & 0xff; s.priv[(o + 1) & 0x7ff] = (v >> 8) & 0xff; };
  const die = (s, why) => {
    s.alive = false; const a = ar(s.cs, s.ip); let k = -1, kr = -1;
    if (a >= 0) for (let i = -4; i < 4; i++) { const x = (a + i) & M; if (who[x] >= 0 && who[x] !== s.id && when[x] > kr) { kr = when[x]; k = who[x]; } }
    s.death = { round, why, killer: k >= 0 ? streams.find(t => t.id === k).name : (a < 0 ? "oob" : "none") };
  };
  const callFar = (s, off, len) => { const t = rw(s, off), c = rw(s, off + 2); if (process.env.DBG && ar(c, t) < 0) { const a0 = ar(s.cs, s.ip); console.log("DBG", s.name, "r", round, "off", off.toString(16), "len", len, "si", s.si, "bytes", [0,1,2,3].map(i=>mem[(a0+i)&M].toString(16)+":"+who[(a0+i)&M]).join(" "), "inpage", (a0&0x3ff).toString(16)); } push(s, s.cs); push(s, (s.ip + len) & M); s.ip = t; s.cs = c; };
  const step = (s) => {
    if (s.phase === 0) { const a = ar(s.fs, s.di); wr(s, a, s.ax); wr(s, (a + 1) & M, s.ax >> 8); s.di = (s.di + 2) & M; s.phase = 1; return; }
    if (s.phase === 1) { s.di = (s.di - 1) & M; s.phase = 2; return; }
    if (s.phase === 2) { ww(s, s.bx, s.cellIp); ww(s, s.bx + 2, s.fs); push(s, 0x1000); push(s, 0x0000); s.cs = s.fs; s.ip = s.cellIp; s.phase = 3; return; }
    const a = ar(s.cs, s.ip); if (a < 0) return die(s, "mem-ip");
    const b0 = mem[a], b1 = mem[(a + 1) & M], b2 = mem[(a + 2) & M], b3 = mem[(a + 3) & M];
    const es = s.fs;
    switch (b0) {
      case 0xA4: { const d = ar(es, s.di); if (d < 0) return die(s, "mem"); wr(s, d, s.priv[s.si & 0x7ff]); s.si = (s.si + 1) & M; s.di = (s.di + 1) & M; s.ip = (s.ip + 1) & M; return; }
      case 0xA5: { const d = ar(es, s.di); if (d < 0) return die(s, "mem"); wr(s, d, s.priv[s.si & 0x7ff]); wr(s, (d + 1) & M, s.priv[(s.si + 1) & 0x7ff]); s.si = (s.si + 2) & M; s.di = (s.di + 2) & M; s.ip = (s.ip + 1) & M; return; }
      case 0xF3: if (b1 === 0xA5) { if (s.cx === 0) { s.ip = (s.ip + 2) & M; return; }
          const d = ar(es, s.di); if (d < 0) return die(s, "mem"); wr(s, d, s.priv[s.si & 0x7ff]); wr(s, (d + 1) & M, s.priv[(s.si + 1) & 0x7ff]); s.si = (s.si + 2) & M; s.di = (s.di + 2) & M; s.cx = (s.cx - 1) & M; if (s.cx === 0) s.ip = (s.ip + 2) & M; return; }
        return die(s, "op");
      case 0x29: if (b1 === 0xD4) { s.sp = (s.sp - s.dx) & M; s.ip = (s.ip + 2) & M; return; }
        if (b1 === 0x2F) { ww(s, s.bx, rw(s, s.bx) - s.bp); s.ip = (s.ip + 2) & M; return; }
        return die(s, "op");
      case 0x8B: if (b1 === 0x3F) { s.di = rw(s, s.bx); s.ip = (s.ip + 2) & M; return; }
        if (b1 === 0x3E) { s.di = rw(s, b2 | (b3 << 8)); s.ip = (s.ip + 4) & M; return; }
        return die(s, "op");
      case 0xB1: s.cx = (s.cx & 0xff00) | b1; s.ip = (s.ip + 2) & M; return;
      case 0x31: if (b1 === 0xF6) { s.si = 0; s.ip = (s.ip + 2) & M; return; } return die(s, "op");
      case 0xAB: { const d = ar(es, s.di); if (d < 0) return die(s, "mem"); wr(s, d, s.ax); wr(s, (d + 1) & M, s.ax >> 8); s.di = (s.di + 2) & M; s.ip = (s.ip + 1) & M; return; }
      case 0x4F: s.di = (s.di - 1) & M; s.ip = (s.ip + 1) & M; return;
      case 0xFF: if (b1 === 0x1F) return callFar(s, s.bx, 2);
        if (b1 === 0x18) return callFar(s, s.bx + s.si, 2);
        if (b1 === 0x1E) return callFar(s, b2 | (b3 << 8), 4);
        return die(s, "op");
      default: return die(s, "op");
    }
  };
  for (round = 0; round < rounds; round++) {
    for (const s of streams) {
      if (!s.alive || round < s.start) continue;
      for (let k = 0; k < s.speed && s.alive; k++) { try { step(s); } catch (e) { if (e.mem) die(s, "mem"); else throw e; } }
    }
    if (round > 3000 && round % 64 === 0) { const t = new Set(streams.filter(s => s.alive && s.team !== "Z").map(s => s.team)); if (t.size <= 1) break; }
  }
  return streams;
}
const [variant = "DET2", fsHex = "FFA", opp = "V6", N0 = "200", R0 = "60000", seed0 = "1"] = process.argv.slice(2);
const FS = parseInt(fsHex, 16), N = +N0, R = +R0; let seed = +seed0;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x80000000; };
const bands = [0, 0x3C00, 0x7800, 0xB400, 0xF000]; const pick = () => bands[Math.min(4, Math.floor(rnd() * 4.27))];
const cellA = variant === "DET2" ? 0x2C0 : 0x300, cellB = variant === "DET2" ? 0x280 : 0x300;
const tA = T[variant + "A"], tB = T[variant + "B"];
const tally = {}; let share = 0, ours = 0, theirs = 0;
for (let n = 0; n < N; n++) {
  const bA = pick(), bB = pick(), oA = pick(), oB = pick();
  const us = [stream({ name: "A", id: 1, team: "us", ip: (bA + 0x2CA2) & M, gap: 0x100, cx: 9, dx: 0x4000, bp: 0x4400, cell: cellA, start: 54, fs: FS, tmpl: tA }),
    stream({ name: "B", id: 2, team: "us", ip: (bB + 0x10A2) & M, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: cellB, start: 57, fs: FS, tmpl: tB })];
  const zs = [stream({ name: "zA", id: 3, team: "Z", ip: (bB + 0x20A2) & M, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: cellB, start: 40 + Math.floor(rnd() * 10), speed: 2, fs: FS, tmpl: tB })];
  if (rnd() < 0.6) zs.push(stream({ name: "zB", id: 4, team: "Z", ip: (bB + 0x70A2) & M, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: cellB, start: 100 + Math.floor(rnd() * 2000), speed: 2, fs: FS, tmpl: tB }));
  let them = [];
  if (opp === "V6") them = [stream({ name: "VA", id: 5, team: "them", ip: (oA + 0x2CA2) & M, gap: 0x100, cx: 9, dx: 0x4000, bp: 0x4400, cell: 0x2C0, start: 61, fs: 0xFFB, tmpl: T.V6A }),
    stream({ name: "VB", id: 6, team: "them", ip: (oB + 0x10A2) & M, gap: 0x600, cx: 8, dx: 0x2400, bp: 0x2C00, cell: 0x280, start: 57, fs: 0xFFB, tmpl: T.V6B })];
  if (opp === "ZC") them = [stream({ name: "CA", id: 5, team: "them", ip: (oA + 0x10A2) & M, gap: 0x1F0, cx: 8, dx: 0x3800, bp: 0x3C00, cell: 0x200, start: 60, fs: 0xFFB, tmpl: T.ZC, ax: 0x18FF }),
    stream({ name: "CB", id: 6, team: "them", ip: (oB + 0x10A2) & M, gap: 0x1F0, cx: 8, dx: 0x3800, bp: 0x3C00, cell: 0x200, start: 45, fs: 0xFFB, tmpl: T.ZC, ax: 0x18FF })];
  const order = rnd() < 0.5 ? [...us, ...them] : [...them, ...us];
  const S = run([...zs, ...order], R);
  for (const s of S) if (!s.alive) tally[`${s.name}<-${s.death.killer}`] = (tally[`${s.name}<-${s.death.killer}`] ?? 0) + 1;
  const oa = S.filter(s => s.team === "us" && s.alive).length, ta = S.filter(s => s.team === "them" && s.alive).length;
  ours += oa; theirs += ta; share += (oa + ta) ? oa / (oa + ta) : 0;
}
console.log(`${variant} fs ${fsHex} vs ${opp}: runs ${N} ourAlive ${ours} themAlive ${theirs} meanShare ${(share / N).toFixed(3)}`);
console.log("   ", Object.entries(tally).sort().map(([k, v]) => `${k}:${v}`).join(" "));
