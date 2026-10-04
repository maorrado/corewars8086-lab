// D1 mini-emulator of OUR phoenix streams only (no opponents, no engine): executes the real worker bytes
// (A4 A5 F3A5 29D4 292F 8B3F B1xx 31F6 AB 4F FF1F) on a 64 KiB arena with write attribution.
// Streams start at the stosw of phoenix_init with the registers phoenix_init leaves. Anything else executed
// = death (attributed to the last foreign writer of IP..IP+3). Optional captured-zombie streams (speed 2).
// usage: import { runCombo } ...  or  node absim.mjs [rounds] [json-config]
export const M = 0xffff;
export function makeTemplate(bytes) { const t = new Uint8Array(0x800); bytes.forEach((b, i) => t[i] = b); return t; }
const WORKER = [0xA5, 0xF3, 0xA5, 0x29, 0xD4, 0x29, 0x2F, 0x8B, 0x3F, 0xB1, 0x09, 0x31, 0xF6, 0xAB, 0x4F, 0xFF, 0x1F, 0xCC, 0xCC, 0x89];
export function stream(o) {
  // o: {name, id, ip, gap, cx, dx, bp, cell, startRound, speed, tmpl, fs}
  const fs = o.fs ?? 0x0FFB;
  return { name: o.name, id: o.id, alive: true, speed: o.speed ?? 1, start: o.startRound, phase: 0,
    ip: 0, cs: 0x1000, ax: 0x1FFF, cx: o.cx, dx: o.dx, bp: o.bp, sp: (o.ip + o.gap) & M, si: 0, di: o.ip, bx: o.cell,
    coupled: o.coupled ?? 0, fs, priv: makeTemplate(o.tmpl ?? WORKER), cellIp: o.ip, gens: 0, early: 0, death: null, ip0: o.ip };
}
export function run(streams, rounds, opts = {}) {
  const mem = new Uint8Array(0x10000).fill(0xCC); const who = new Int16Array(0x10000).fill(-1); const when = new Int32Array(0x10000).fill(-1);
  let round = 0;
  const lin = (seg, off) => ((seg << 4) + (off & M)); // linear
  const ar = (seg, off) => { const L = lin(seg, off); if (L < 0x10000 || L > 0x1FFFF) return -1; return L - 0x10000; };
  const wr = (s, a, v) => { if (a < 0) throw { mem: true }; mem[a] = v & 0xff; who[a] = s.id; when[a] = round; };
  const push = (s, w) => { s.sp = (s.sp - 2) & M; wr(s, s.sp, w); wr(s, (s.sp + 1) & M, w >> 8); };
  const rdCell = (s) => s.priv[s.bx] | (s.priv[s.bx + 1] << 8);
  const die = (s, why) => {
    s.alive = false;
    const a = ar(s.cs, s.ip); let k = -1, kr = -1;
    if (a >= 0) for (let i = -4; i < 4; i++) { const x = (a + i) & M; if (who[x] >= 0 && who[x] !== s.id && when[x] > kr) { kr = when[x]; k = who[x]; } }
    s.death = { round, why, ip: s.ip, killer: k >= 0 ? streams.find(t => t.id === k)?.name : "none", kr, win: a >= 0 ? [-4,-3,-2,-1,0,1,2,3].map(i => mem[(a + i) & M].toString(16) + ":" + who[(a + i) & M]).join(" ") : "", sp: s.sp, cell: s.priv[s.bx] | (s.priv[s.bx + 1] << 8) };
  };
  const step = (s) => {
    if (s.phase === 0) { // stosw of phoenix_init (DI = ip, ES = fs)
      const a = ar(s.fs, s.di); wr(s, a, 0xFF); wr(s, (a + 1) & M, 0x1F); s.di = (s.di + 2) & M; s.phase = 1; return;
    }
    if (s.phase === 1) { s.di = (s.di - 1) & M; s.phase = 2; return; }
    if (s.phase === 2) { s.priv[s.bx] = s.cellIp & 0xff; s.priv[s.bx + 1] = s.cellIp >> 8; s.priv[s.bx + 2] = s.fs & 0xff; s.priv[s.bx + 3] = s.fs >> 8;
      push(s, 0x1000); push(s, 0x0000); s.cs = s.fs; s.ip = s.cellIp; s.phase = 3; return; }
    const a = ar(s.cs, s.ip); if (a < 0) return die(s, "mem-ip");
    const b0 = mem[a], b1 = mem[(a + 1) & M];
    const es = s.fs;
    switch (b0) {
      case 0xA4: { const d = ar(es, s.di); if (d < 0) return die(s, "mem"); wr(s, d, s.priv[s.si & 0x7ff]); s.si = (s.si + 1) & M; s.di = (s.di + 1) & M; s.ip = (s.ip + 1) & M; return; }
      case 0xA5: { const d = ar(es, s.di); if (d < 0) return die(s, "mem"); wr(s, d, s.priv[s.si & 0x7ff]); wr(s, (d + 1) & M, s.priv[(s.si + 1) & 0x7ff]); s.si = (s.si + 2) & M; s.di = (s.di + 2) & M; s.ip = (s.ip + 1) & M; return; }
      case 0xF3: if (b1 === 0xA5) { if (s.cx === 0) { s.ip = (s.ip + 2) & M; return; }
          const d = ar(es, s.di); if (d < 0) return die(s, "mem"); wr(s, d, s.priv[s.si & 0x7ff]); wr(s, (d + 1) & M, s.priv[(s.si + 1) & 0x7ff]); s.si = (s.si + 2) & M; s.di = (s.di + 2) & M; s.cx = (s.cx - 1) & M; return; }
        return die(s, "op");
      case 0x29: if (b1 === 0xD4) { s.sp = (s.sp - s.dx) & M; if (s.coupled) s.sp = (rdCell(s) - s.bp - 0x50 + s.coupled) & M; s.ip = (s.ip + 2) & M; return; }
        if (b1 === 0x2F) { const v = (rdCell(s) - s.bp) & M; s.priv[s.bx] = v & 0xff; s.priv[s.bx + 1] = v >> 8; s.ip = (s.ip + 2) & M; return; }
        return die(s, "op");
      case 0x8B: if (b1 === 0x3F) { s.di = rdCell(s); s.ip = (s.ip + 2) & M; return; } return die(s, "op");
      case 0xB1: s.cx = (s.cx & 0xff00) | b1; s.ip = (s.ip + 2) & M; return;
      case 0x8D: if (b1 === 0x61) { const d8 = mem[(a + 2) & M]; s.sp = (s.bx + s.di + (d8 > 127 ? d8 - 256 : d8)) & M; s.ip = (s.ip + 3) & M; return; }
        if (b1 === 0x21) { s.sp = (s.bx + s.di) & M; s.ip = (s.ip + 2) & M; return; }
        if (b1 === 0xA5) { const d16 = mem[(a + 2) & M] | (mem[(a + 3) & M] << 8); s.sp = (s.di + d16) & M; s.ip = (s.ip + 4) & M; return; } return die(s, "op");
      case 0x31: if (b1 === 0xF6) { s.si = 0; s.ip = (s.ip + 2) & M; return; } return die(s, "op");
      case 0xAB: { const d = ar(es, s.di); if (d < 0) return die(s, "mem"); wr(s, d, s.ax); wr(s, (d + 1) & M, s.ax >> 8); s.di = (s.di + 2) & M; s.ip = (s.ip + 1) & M; return; }
      case 0x4F: s.di = (s.di - 1) & M; s.ip = (s.ip + 1) & M; return;
      case 0xFF: if (b1 === 0x1F) { const t = rdCell(s); push(s, s.cs); push(s, (s.ip + 2) & M); s.ip = t; s.cs = s.priv[s.bx + 2] | (s.priv[s.bx + 3] << 8);
          if (opts.onCall) opts.onCall(s, round); return; }
        return die(s, "op");
      default: return die(s, "op");
    }
  };
  for (round = 0; round < rounds; round++) {
    for (const s of streams) {
      if (!s.alive || round < s.start) continue;
      for (let k = 0; k < s.speed && s.alive; k++) { try { step(s); } catch (e) { if (e.mem) die(s, "mem"); else throw e; } }
    }
    if (opts.stopOnDeath && streams.some(s => !s.alive)) break;
    if (streams.every(s => !s.alive)) break;
  }
  return streams.map(s => ({ name: s.name, alive: s.alive, death: s.death }));
}
