// A005 abstract A/B partner-interference model (no engine, no opponents, no zombies).
// Models only the two phoenix streams of rev0: dwell pushes (4 bytes/turn, A4 at addr=2 mod 4),
// rebuild (movsb, movsw, rep movsw CX words, 8 more instructions), partner pushes landing on the anchor
// (early trigger) or on not-yet-executed worker bytes during a rebuild (counted as corruption = death).
// usage: node phase-sim.mjs [rounds=200000] [delayA=0] [delayB=0] [gapA=0x100] [gapB=0x600]
const [ROUNDS = 200000, dA = 0, dB = 0, gA = 0x100, gB = 0x600, DXB = 0x2400, DXA = 0x4000, BPB = 0x2c00] = process.argv.slice(2).map(Number);
const M = 0xffff;
function mk(name, h, startTurns, gap, cx0, dx, bp) {
  const P = ((h & 0xff) << 8) | 0x52;
  return { name, P, SP: (P + 0x50 + gap) & M, mode: "start", t: startTurns, cx: cx0, dx, bp, alive: true, early: 0, gens: 0, rb: null };
}
function run(qA, qB, delayA, delayB, gapA, gapB, rounds) {
  const A = mk("A", qA + 0x2c, 56 + delayA, gapA, 9, DXA, 0x4400);
  const B = mk("B", qB + 0x10, 59 + delayB, gapB, 8, DXB, BPB);
  const ev = { killA: 0, killB: 0, earlyA: 0, earlyB: 0, tKill: null };
  // rebuild schedule for a stream with rep count c: exec step index of byte offset m (relative to anchor)
  const sched = (c) => {
    const copy = {}, exec = {};
    copy[1] = 0; copy[2] = 1; copy[3] = 1;
    for (let j = 0; j < c; j++) { copy[4 + 2 * j] = 2 + j; copy[5 + 2 * j] = 2 + j; }
    const after = 2 + c; // turn of sub sp
    exec[1] = 1; exec[2] = 2; exec[3] = 2;
    const offs = [[4, 0], [6, 1], [8, 2], [10, 3], [12, 4], [14, 5], [15, 6], [16, 7]];
    for (const [m, k] of offs) { exec[m] = after + k; exec[m + 1] = after + k; }
    return { copy, exec, len: after + 8 }; // last turn (call far) = after+7
  };
  const push = (W, O, step) => {
    W.SP = (W.SP - 4) & M;
    const X = W.SP;
    if (W.SP === W.P) { W.mode = "rb"; W.rb = { start: step + 2, ...sched(W.cx) }; }
    if (!O.alive) return;
    // effect on partner O
    if (O.mode === "dwell" && X === O.P) { O.mode = "rb"; O.rb = { start: step + 1, ...sched(O.cx) }; O.early++; }
    else if (O.mode === "rb") {
      for (let b = 0; b < 4; b++) {
        const m = ((X + b) - O.P) & M;
        if (m >= 1 && m <= 17) {
          const ct = O.rb.start + 2 * O.rb.copy[m], et = O.rb.start + 2 * O.rb.exec[m];
          if (step > ct && step < et) { O.alive = false; if (ev.tKill === null) ev.tKill = step >> 1; return; }
        }
      }
    }
  };
  const turn = (W, O, step) => {
    if (!W.alive) return;
    if (W.mode === "start") { if (--W.t <= 0) { W.mode = "dwell"; push(W, O, step); } return; }
    if (W.mode === "dwell") { push(W, O, step); return; }
    // rebuild
    const k = (step - W.rb.start) >> 1; // 0-based turn in rebuild
    if (k === W.rb.len - 1) {
      // call far executes: new anchor/SP computed by worker (sub sp,dx ; sub [bx],bp)
      W.SP = (W.SP - W.dx) & M; W.P = (W.P - W.bp) & M; W.cx = 9; W.gens++;
      W.mode = "dwell"; push(W, O, step);
    }
  };
  for (let r = 0; r < rounds; r++) {
    turn(A, B, 2 * r); turn(B, A, 2 * r + 1);
    if (!A.alive && !B.alive) break;
  }
  ev.killA = A.alive ? 0 : 1; ev.killB = B.alive ? 0 : 1; ev.earlyA = A.early; ev.earlyB = B.early;
  return ev;
}
const qs = [0x00, 0x3c, 0x78, 0xb4, 0xf0];
let kA = 0, kB = 0, eA = 0, eB = 0, n = 0; const tk = [];
for (const qA of qs) for (const qB of qs) {
  const e = run(qA, qB, dA, dB, gA, gB, ROUNDS);
  kA += e.killA; kB += e.killB; eA += e.earlyA; eB += e.earlyB; n++; if (e.tKill !== null) tk.push(e.tKill);
}
console.log(JSON.stringify({ rounds: ROUNDS, delayA: dA, delayB: dB, gapA: gA.toString(16), gapB: gB.toString(16), combos: n, AkilledByB: kA, BkilledByA: kB, earlyTrigA: eA, earlyTrigB: eB, killRounds: tk.sort((a, b) => a - b) }));
