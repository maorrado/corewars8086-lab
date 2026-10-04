// B069: Monte Carlo prevalence of startup self-harm channels for rev0 (and zombie-phase variants).
// Static model only (no battles). Loads uniform with >=1024-byte separation (engine-v6-facts.md).
// Each warrior executes 1 instr/round (A before B); captured zombies 2 instr/round.
// A write event hits a victim if it covers a byte the victim still has to execute or copy.
// usage: node startup-mc.mjs [zPhaseA=0x20] [zPhaseBD=0x34] [N=400000]
const zpa = Number(process.argv[2] ?? 0x20), zpb = Number(process.argv[3] ?? 0x34), N = Number(process.argv[4] ?? 400000);
// [offset,len] in execution order (rep movsw expanded); round = index+1
const seq = (list) => { const out = []; for (const [o, l, rep] of list) for (let i = 0; i < (rep ?? 1); i++) out.push([o, l]); return out; };
const A = seq([[0,2],[2,1],[3,1],[4,3],[7,3],[0xa,3],[0xd,3],[0x10,3],[0x13,3],[0x16,2],[0x18,2],[0x1a,2],[0x1c,2],[0x1e,2],[0x20,2],[0x22,2],[0x24,2],[0x26,3],[0x29,2],[0x2b,4],[0x2f,2],
  [0x31,1],[0x32,1],[0x33,2],[0x35,3],[0x38,2,9],[0x3a,4],[0x3e,1],[0x3f,1],[0x40,3],[0x43,1],[0x44,1],[0x45,2],[0x47,3],[0x4a,4],[0x4e,3],[0x51,2],[0x53,2],[0x55,2],[0x57,2],[0x59,4],[0x5d,3],[0x60,3],[0x63,3],[0x66,3],[0x69,1],[0x6a,1],[0x6b,2]]);
const B = seq([[0,2],[2,4],[6,4],[0xa,1],[0xb,4],[0xf,1],[0x10,3],[0x13,3],[0x16,3],[0x19,3],[0x1c,1],[0x1d,2],[0x1f,1],[0x20,2],[0x22,2],[0x24,2],[0x26,2],[0x28,2],[0x2a,2],[0x2c,2],[0x2e,3],[0x31,2],[0x33,4],[0x37,2],
  [0x7d,1],[0x7e,1],[0x7f,2],[0x81,3],[0x84,2,9],[0x86,4],[0x8a,1],[0x8b,1],[0x8c,3],[0x8f,1],[0x90,1],[0x91,2],[0x93,3],[0x96,4],[0x9a,3],[0x9d,2],[0x9f,2],[0xa1,2],[0xa3,2],[0xa5,4],[0xa9,3],[0xac,3],[0xaf,3],[0xb2,3],[0xb5,1],[0xb6,1],[0xb7,2]]);
// zombie path (zom20a captured: CX!=0) and fallback (b/d: CX=0), from zombie_entry 39h
const Zcommon = [[0x5c,2],[0x5e,1],[0x5f,3],[0x62,1],[0x63,4],[0x67,2],[0x69,2],[0x6b,2],[0x6d,2],[0x6f,2],[0x71,2],[0x73,2],[0x75,2],[0x77,2],[0x79,4],
  [0x7d,1],[0x7e,1],[0x7f,2],[0x81,3],[0x84,2,9],[0x86,4],[0x8a,1],[0x8b,1],[0x8c,3],[0x8f,1],[0x90,1],[0x91,2],[0x93,3],[0x96,4],[0x9a,3],[0x9d,2],[0x9f,2],[0xa1,2],[0xa3,2],[0xa5,4],[0xa9,3],[0xac,3],[0xaf,3],[0xb2,3],[0xb5,1],[0xb6,1],[0xb7,2]];
const ZA = seq([[0x39,2],[0x3b,1],[0x3c,3],[0x3f,2],[0x41,3],[0x44,1],[0x45,1],[0x46,3],[0x49,3],[0x4c,3],[0x4f,3],[0x52,2], ...Zcommon]);
const ZB = seq([[0x39,2],[0x3b,1],[0x3c,3],[0x3f,2],[0x54,3],[0x57,3],[0x5a,2], ...Zcommon]);
const tmplA = [0x6d, 0x7f], tmplB = [0xb9, 0xcb]; // template bytes copied by rep movsw (word i at copy instr)
const copyStartA = A.findIndex(([o]) => o === 0x38) + 1, copyStartB = B.findIndex(([o]) => o === 0x84) + 1;
// pending byte ranges of a warrior's own run after round r (instr index k executes at round start+k*step)
function pending(sq, start, step, r, tmpl, copyStart) {
  const out = [];
  sq.forEach(([o, l], k) => { if (start + k * step > r) out.push([o, o + l]); });
  if (tmpl) for (let i = 0; i < 9; i++) { const rr = start + (copyStart - 1 + i) * step; if (rr > r) out.push([tmpl[0] + 2 * i, tmpl[0] + 2 * i + 2]); }
  return out;
}
const near = (load, w0) => { const d = (w0 - load) & 0xffff; return d < 0xd0 || d > 0x10000 - 8; };
const hit = (load, ranges, w0, w1) => { for (const [a, b] of ranges) { // arena offsets mod 64K
  for (let x = a; x < b; x++) { const ad = (load + x) & 0xffff; const d = (ad - w0) & 0xffff; if (d < w1 - w0) return true; } } return false; };
const band = (load) => { const h = load >> 8; return Math.floor(h / 0x3c) * 0x3c; };
const tally = {}; const add = (k) => tally[k] = (tally[k] ?? 0) + 1;
// zombie timing (rounds) from traces pkj3o: zom20a-captured stosw ~r46, b/d-captured ~r55
const zStartA = 16, zStartB = 27, zStep = 0.5;
for (let n = 0; n < N; n++) {
  let la, lb; do { la = 0x400 + Math.floor(Math.random() * (0x10000 - 0x800 - 194)); lb = 0x400 + Math.floor(Math.random() * (0x10000 - 0x800 - 202)); } while (Math.abs(la - lb) < 0x400 + 202);
  const events = []; // [w0,w1,round,writer]
  events.push([0x9769, 0x976b, 5, "A-cell9769"], [0x4a17, 0x4a19, 3, "B-cell4A17"], [0x5d13, 0x5d15, 5, "B-cell5D13"]);
  const pa = ((band(la) + 0x2c) << 8) + 0x52 & 0xffff, pb = ((band(lb) + 0x10) << 8) + 0x52 & 0xffff;
  const sA = A.findIndex(([o]) => o === 0x69) + 1, sB = B.findIndex(([o]) => o === 0xb5) + 1;
  events.push([pa, pa + 2, sA, "A-anchor"]);
  for (let t = sA + 2, sp = pa + 0x100; sp > pa && t < 400; t++, sp -= 4) events.push([sp - 4, sp, t, "A-trail0"]);
  events.push([pb, pb + 2, sB, "B-anchor"]);
  for (let t = sB + 2, sp = pb + 0x600; sp > pb && t < 400; t++, sp -= 4) events.push([sp - 4, sp, t, "B-trail0"]);
  for (const [ph, st, sq, lab] of [[zpa, zStartA, ZA, "Za"], [zpb, zStartB, ZB, "Zbd"]]) {
    const pz = ((band(lb) + ph) << 8) + 0x52 & 0xffff; const sI = sq.findIndex(([o]) => o === 0xb5);
    const rs = st + sI * zStep; events.push([pz, pz + 2, rs, lab + "-anchor"]);
    for (let t = rs + 1, sp = pz + 0x600; sp > pz && t < 400; t += 0.5, sp -= 4) events.push([(sp - 4) & 0xffff, ((sp - 4) & 0xffff) + 4, t, lab + "-trail0"]);
  }
  const hits = new Set();
  for (const [w0, w1, r, who] of events) {
    if (near(la, w0) && hit(la, pending(A, 1, 1, r, tmplA, copyStartA), w0, w1)) hits.add(who + "->A");
    if (!near(lb, w0)) continue;
    if (hit(lb, pending(B, 1, 1, who.startsWith("A") ? r - 1 : r, tmplB, copyStartB), w0, w1)) hits.add(who + "->B");
    const pZ = []; for (const [st, sq] of [[zStartA, ZA], [zStartB, ZB]]) pZ.push(...pending(sq, st, zStep, r, null));
    if (hit(lb, pZ, w0, w1)) hits.add(who + "->zombieEntry");
  }
  for (const h of hits) add(h);
  const kA = [...hits].some((h) => /->A/.test(h)), kB = [...hits].some((h) => /->B/.test(h));
  if (kA) add("ANY->A"); if (kB) add("ANY->B"); if (kA || kB) add("ANY member"); if ([...hits].some((h) => h.includes("zombieEntry"))) add("ANY zombieEntry");
}
console.log(`zombie phases ${zpa.toString(16)}h/${zpb.toString(16)}h, N=${N}`);
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`${(100 * v / N).toFixed(3).padStart(7)}%  ${k}`);
