// D5 family simulator: register-level emulation of V6-family phoenix streams only (no zombies, no
// other teams, startup not executed: each stream starts at its first `call far [bx]` round with the
// register state phoenix_init leaves). Instruction subset = what the anchor/worker executes; any other
// byte under IP counts as death (approximation). Engine rules from corewars8086 v6 source:
// one opcode per warrior per round in load order (groups random order, members consecutive),
// REP: CX!=0 -> CX--, one iteration, IP stays; CX==0 -> skip. call far pushes CS then IP.
// usage: import { battle, KINDS } from "./fsim.mjs"
const W = (s) => s.match(/../g).map((h) => parseInt(h, 16));
const WK = "a5f3a529d4292f8b3fb10931f6ab4fff1f";
export const TPL = { v6A: W(WK + "89"), v6B: W(WK + "cc"), r1: W(WK + "cccc"), z: W(WK.slice(0, -2) + "18cc") };

// stream config: t0 = round of the first call far (phoenix start + 34), phase = high-byte phase,
// gap = SP-IP at start, cx0 = first rebuild count, dx/bp step, cell, tpl
export function mkA(o = {}) { return { t0: 56, phase: 0x2c, gap: 0x100, cx0: 9, dx: 0x4000, bp: 0x4400, cell: 0x2c0, tpl: TPL.r1, quant: 0x3c, ...o }; }
export function mkB(o = {}) { return { t0: 59, phase: 0x10, gap: 0x600, cx0: 8, dx: 0x2400, bp: 0x2c00, cell: 0x280, tpl: TPL.r1, quant: 0x3c, ...o }; }
export const KINDS = {
  rev1: [mkA(), mkB()],
  rev0: [mkA({ tpl: TPL.v6A }), mkB({ tpl: TPL.v6B })],
  V6: [mkA({ t0: 63, tpl: TPL.v6A }), mkB({ tpl: TPL.v6B })],
  V6Guard: [mkA({ t0: 59, tpl: TPL.v6A }), mkB({ tpl: TPL.v6B })],
  V4: [mkA({ t0: 63, tpl: TPL.v6A }), mkB({ tpl: TPL.v6B, dx: 0x2000, bp: 0x2800 })],
  zchain4: [mkA({ t0: 58, phase: 0x10, gap: 0x1f0, cx0: 8, dx: 0x3800, bp: 0x3c00, cell: 0x200, tpl: TPL.z, ax: 0x18ff }), mkB({ t0: 53, phase: 0x70, gap: 0x270, cx0: 9, dx: 0x4000, bp: 0x4400, cell: 0x240, tpl: TPL.z, ax: 0x18ff })],
};

// deterministic PRNG
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

function loads(n, sizes, R) {
  const out = [];
  for (let i = 0; i < n; i++) {
    for (let tries = 0; tries < 10000; tries++) {
      const a = Math.floor(R() * 65536);
      if (a < 1024 || a + sizes[i] > 65536 - 1024) continue;
      if (out.some((o, j) => a + sizes[i] >= o - 1024 && a < o + sizes[j] + 1024)) continue;
      out.push(a); break;
    }
  }
  return out;
}

// teams: [{name, streams:[cfgA,cfgB], size:[a,b]}]; extra: number of dummy warriors (other teams, only for load placement)
export function battle(teams, seed, { rounds = 200000, extra = 4, log = false, qs = null, order = null, noStop = false } = {}) {
  const R = rng(seed);
  const mem = new Uint8Array(65536).fill(0xcc);
  const who = new Int8Array(65536).fill(-1);
  // load order: random group order (or given)
  const groups = order ? order.slice() : teams.map((t, i) => i);
  if (!order) for (let i = groups.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [groups[i], groups[j]] = [groups[j], groups[i]]; }
  const nW = teams.reduce((s, t) => s + t.streams.length, 0);
  const sizes = []; for (const g of groups) for (const sz of teams[g].size) sizes.push(sz);
  for (let i = 0; i < extra; i++) sizes.push(200);
  // extra warriors get placed at random positions in the load sequence; place ours in order, extra afterwards (approx.)
  const L = loads(nW + extra, sizes, R);
  const procs = [];
  let k = 0;
  for (const g of groups) {
    teams[g].streams.forEach((c, m) => {
      const load = L[k++];
      const q = qs ? qs[g][m] : Math.floor((load >> 8) / c.quant);
      let ah = (q * c.quant + c.phase) & 0xff;
      const T = (ah << 8) | 0xa2;
      const priv = new Uint8Array(2048);
      c.tpl.forEach((b, i) => { priv[i] = b; });
      priv[c.cell] = T & 0xff; priv[c.cell + 1] = T >> 8; priv[c.cell + 2] = 0xfb; priv[c.cell + 3] = 0x0f;
      procs.push({ id: procs.length, team: g, name: teams[g].name + "ABCD"[m], c, load, T, alive: true, started: false,
        cs: 0x0ffb, ip: T, bx: c.cell, cx: c.cx0, dx: c.dx, bp: c.bp, sp: (T + c.gap) & 0xffff, si: 0, di: (T + 1) & 0xffff, ax: c.ax || 0x1fff,
        priv, death: null });
    });
  }
  const aliveTeams = () => new Set(procs.filter((p) => p.alive).map((p) => p.team)).size;
  let dirty = false;
  const deaths = [];
  const lin = (seg, off) => ((seg << 4) + off) - 0x10000; // arena offset or out of range
  const wr = (a, v, p, r) => { mem[a] = v; who[a] = p.id; };
  const kill = (p, r, why, a) => { p.alive = false; dirty = true; p.death = { r, why, by: a >= 0 && a < 65536 ? who[a] : -1, at: a }; deaths.push({ p: p.id, ...p.death }); };
  let r;
  for (r = 1; r <= rounds; r++) {
    for (const p of procs) {
      if (!p.alive) continue;
      if (!p.started) {
        if (r === p.c.t0 - 2) { // stosw FF 1F at the anchor
          const a = lin(0x0ffb, p.T);
          wr(a, 0xff, p, r); wr((a + 1) & 0xffff, 0x1f, p, r);
        }
        if (r < p.c.t0) continue;
        p.started = true;
      }
      const a = lin(p.cs, p.ip);
      if (a < 0 || a >= 65536) { kill(p, r, "ipout", a); continue; }
      const op = mem[a];
      const b1 = mem[(a + 1) & 0xffff];
      const esdi = () => { const x = lin(0x0ffb, p.di); return x; };
      if (op === 0xff && (b1 === 0x1f || b1 === 0x18)) {
        const ea = b1 === 0x18 ? (p.bx + p.si) & 2047 : p.bx;
        const nip = p.priv[ea] | (p.priv[ea + 1] << 8), ncs = p.priv[ea + 2] | (p.priv[ea + 3] << 8);
        const ret = (p.ip + 2) & 0xffff;
        p.sp = (p.sp - 2) & 0xffff; wr(p.sp, p.cs & 0xff, p, r); wr((p.sp + 1) & 0xffff, p.cs >> 8, p, r);
        p.sp = (p.sp - 2) & 0xffff; wr(p.sp, ret & 0xff, p, r); wr((p.sp + 1) & 0xffff, ret >> 8, p, r);
        p.cs = ncs; p.ip = nip;
      } else if (op === 0xa4 || op === 0xa5 || (op === 0xf3 && (b1 === 0xa5 || b1 === 0xa4))) {
        const rep = op === 0xf3; const w = (rep ? b1 : op) === 0xa5 ? 2 : 1;
        if (rep && p.cx === 0) { p.ip = (p.ip + 2) & 0xffff; continue; }
        const d = esdi(); if (d < 0) { kill(p, r, "esout", d); continue; }
        for (let i = 0; i < w; i++) wr((d + i) & 0xffff, p.priv[(p.si + i) & 2047], p, r);
        p.si = (p.si + w) & 0xffff; p.di = (p.di + w) & 0xffff;
        if (rep) p.cx = (p.cx - 1) & 0xffff; else p.ip = (p.ip + 1) & 0xffff;
      } else if (op === 0x29 && b1 === 0xd4) { p.sp = (p.sp - p.dx) & 0xffff; p.ip = (p.ip + 2) & 0xffff; }
      else if (op === 0x29 && b1 === 0x2f) { const v = ((p.priv[p.bx] | (p.priv[p.bx + 1] << 8)) - p.bp) & 0xffff; p.priv[p.bx] = v & 0xff; p.priv[p.bx + 1] = v >> 8; p.ip = (p.ip + 2) & 0xffff; }
      else if (op === 0x8b && b1 === 0x3f) { p.di = p.priv[p.bx] | (p.priv[p.bx + 1] << 8); p.ip = (p.ip + 2) & 0xffff; }
      else if (op === 0xb1) { p.cx = (p.cx & 0xff00) | b1; p.ip = (p.ip + 2) & 0xffff; }
      else if (op === 0x31 && b1 === 0xf6) { p.si = 0; p.ip = (p.ip + 2) & 0xffff; }
      else if (op === 0xab) { const d = esdi(); if (d < 0) { kill(p, r, "esout", d); continue; } wr(d, p.ax & 0xff, p, r); wr((d + 1) & 0xffff, p.ax >> 8, p, r); p.di = (p.di + 2) & 0xffff; p.ip = (p.ip + 1) & 0xffff; }
      else if (op === 0x4f) { p.di = (p.di - 1) & 0xffff; p.ip = (p.ip + 1) & 0xffff; }
      else { kill(p, r, "op" + op.toString(16), a); }
      if (!p.alive) continue;
    }
    if (dirty) { dirty = false; if (aliveTeams() <= (noStop ? 0 : 1)) break; }
  }
  const alive = procs.filter((p) => p.alive);
  const score = teams.map((t, g) => alive.length ? alive.filter((p) => p.team === g).length / alive.length : 0);
  return { end: Math.min(r, rounds), score, procs, deaths };
}
