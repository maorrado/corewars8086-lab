// A007 multi-stream crossfire model (extends A005 phase-sim): V6-family phoenix streams only,
// no zombies, no other opponents. Our team = A(candidate step) + B(rev0); enemy teams = rev0 A+B copies.
// Counts per battle: our streams killed by crossfire, enemy streams killed, our alive at end.
// usage: node msim.mjs <BPA hex> <DXA hex> [enemyTeams=1] [battles=400] [rounds=60000]
const args = process.argv.slice(2);
const BPA = parseInt(args[0] || "4400", 16), DXA = parseInt(args[1] || "4000", 16);
const NE = +(args[2] || 1), NB = +(args[3] || 400), ROUNDS = +(args[4] || 60000);
const M = 0xffff;
let seed = +(process.env.SEED || 12345); const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
const sched = (c) => {
  const copy = {}, exec = {};
  copy[1] = 0; copy[2] = 1; copy[3] = 1;
  for (let j = 0; j < c; j++) { copy[4 + 2 * j] = 2 + j; copy[5 + 2 * j] = 2 + j; }
  const after = 2 + c;
  exec[1] = 1; exec[2] = 2; exec[3] = 2;
  const offs = [[4, 0], [6, 1], [8, 2], [10, 3], [12, 4], [14, 5], [15, 6], [16, 7]];
  for (const [m, k] of offs) { exec[m] = after + k; exec[m + 1] = after + k; }
  return { copy, exec, len: after + 8 };
};
const band = (hi) => Math.floor(hi / 0x3c) * 0x3c;
function mk(team, kind, hi, dx, bp) {
  const isA = kind === "A";
  const P = (((band(hi) + (isA ? 0x2c : 0x10)) & 0xff) << 8) | 0x52;
  const gap = isA ? 0x100 : 0x600;
  return { team, kind, P, SP: (P + 0x50 + gap) & M, mode: "start", t: isA ? 56 : 59, cx: isA ? 9 : 8, dx, bp, alive: true, rb: null };
}
function battle() {
  const S = [];
  const teams = 1 + NE;
  for (let t = 0; t < teams; t++) {
    const hiA = Math.floor(rnd() * 256), hiB = Math.floor(rnd() * 256);
    S.push(mk(t, "A", hiA, t === 0 ? DXA : 0x4000, t === 0 ? BPA : 0x4400));
    S.push(mk(t, "B", hiB, 0x2400, 0x2c00));
  }
  // order: teams in random order, A before B
  const order = [...Array(teams).keys()].sort(() => rnd() - 0.5).flatMap((t) => [2 * t, 2 * t + 1]);
  const push = (W, step) => {
    W.SP = (W.SP - 4) & M; const X = W.SP;
    if (W.SP === W.P) { W.mode = "rb"; W.rb = { start: step + 1, ...sched(W.cx) }; }
    for (const O of S) {
      if (O === W || !O.alive) continue;
      if (O.mode === "dwell" && X === O.P) { O.mode = "rb"; O.rb = { start: step + 1, ...sched(O.cx) }; }
      else if (O.mode === "rb") {
        for (let b = 0; b < 4; b++) {
          const m = ((X + b) - O.P) & M;
          if (m >= 1 && m <= 17) {
            const ct = O.rb.start + O.rb.copy[m], et = O.rb.start + O.rb.exec[m];
            if (step > ct && step < et) { O.alive = false; O.killedBy = W.team === O.team ? "own" : "enemy"; break; }
          }
        }
      }
    }
  };
  for (let r = 0; r < ROUNDS; r++) {
    for (const i of order) {
      const W = S[i]; if (!W.alive) continue;
      if (W.mode === "start") { if (--W.t <= 0) { W.mode = "dwell"; push(W, r); } continue; }
      if (W.mode === "dwell") { push(W, r); continue; }
      const k = r - W.rb.start;
      if (k === W.rb.len - 1) { W.SP = (W.SP - W.dx) & M; W.P = (W.P - W.bp) & M; W.cx = 9; W.mode = "dwell"; push(W, r); }
    }
  }
  return S;
}
let ourDeadOwn = 0, ourDeadEnemy = 0, enDead = 0, ourAlive = 0, enAlive = 0, share = 0;
for (let b = 0; b < NB; b++) {
  const S = battle();
  let oa = 0, ea = 0;
  for (const s of S) {
    if (s.team === 0) { if (s.alive) oa++; else if (s.killedBy === "own") ourDeadOwn++; else ourDeadEnemy++; }
    else { if (s.alive) ea++; else enDead++; }
  }
  ourAlive += oa; enAlive += ea; share += (oa + ea) ? oa / (oa + ea) : 0;
}
console.log(JSON.stringify({ BPA: BPA.toString(16), DXA: DXA.toString(16), enemyTeams: NE, battles: NB, rounds: ROUNDS,
  ourDeadOwn: ourDeadOwn / NB, ourDeadEnemy: ourDeadEnemy / NB, enemyDead: enDead / NB, ourAlive: ourAlive / NB, enemyAlive: enAlive / NB, ourShare: +(share / NB).toFixed(4) }));
