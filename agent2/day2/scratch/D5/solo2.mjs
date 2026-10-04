// own-pair crossfire incl. our captured zombies (B code at B's band, speed 2): our pair alone for 200000 rounds
// usage: node solo2.mjs "<ours expr>" label zmode(0=none,1=zom20a 2000h,2=b/d 7000h,3=both) [zphA=0x20] [zphB=0x70]
import { battle, KINDS, mkA, mkB, TPL } from "./fsim2.mjs";
const parse = (k) => KINDS[k] || eval(k);
const [ours = "rev1", label = "", zm = "0", zpa = "0x20", zpb = "0x70"] = process.argv.slice(2);
const WQ = [14, 15, 15, 15, 2.2];
let sw = 0, dA = 0, dB = 0, both = 0;
const base = parse(ours);
const t0s = +zm ? [70, 95, 120] : [0];
for (const t0 of t0s) for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) {
  const w = WQ[a] * WQ[b];
  const st = [...base]; const q = [a, b];
  if (+zm & 1) { st.push({ ...base[1], phase: +zpa, t0: t0, speed: 2, zombie: true }); q.push(b); }
  if (+zm & 2) { st.push({ ...base[1], phase: +zpb, t0: t0 + 13, speed: 2, zombie: true }); q.push(b); }
  const res = battle([{ name: "C", streams: st, size: st.map(() => 200) }], 1, { rounds: 200000, qs: [q], order: [0], noStop: true });
  sw += w; const [A, B] = res.procs;
  if (!A.alive) dA += w; if (!B.alive) dB += w; if (A.alive && B.alive) both += w;
}
console.log(`${label || ours} z${zm}: P(A dies) ${(dA / sw).toFixed(3)} P(B dies) ${(dB / sw).toFixed(3)} both ${(both / sw).toFixed(3)}`);
