// own-pair crossfire: our pair alone for 200000 rounds over all (qA,qB) band pairs, weighted
import { battle, KINDS, mkA, mkB, TPL } from "./fsim.mjs";
const parse = (k) => KINDS[k] || eval(k);
const [ours = "rev1", label = ""] = process.argv.slice(2);
const WQ = [14, 15, 15, 15, 2.2];
let sw = 0, dA = 0, dB = 0, both = 0; const tA = [];
for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) {
  const w = WQ[a] * WQ[b];
  const res = battle([{ name: "C", streams: parse(ours), size: [214, 222] }], 1, { rounds: 200000, qs: [[a, b]], order: [0], noStop: true });
  sw += w; const [A, B] = res.procs;
  if (!A.alive) { dA += w; tA.push(A.death.r); } if (!B.alive) dB += w; if (A.alive && B.alive) both += w;
}
console.log(`${label || ours} solo: P(A dies) ${(dA / sw).toFixed(3)} P(B dies) ${(dB / sw).toFixed(3)} both alive ${(both / sw).toFixed(3)}`);
