// usage: node run.mjs <oursKind|json> <oppKind> [N=200] [seed0=1] [rounds=200000]
import { battle, KINDS, mkA, mkB, TPL } from "./fsim.mjs";
const [ours = "rev1", opp = "V6", N = "200", s0 = "1", RR = "200000"] = process.argv.slice(2);
const parse = (k) => KINDS[k] || eval(k); // allow inline expressions using mkA/mkB
const O = parse(ours), T = parse(opp);
let sum = 0, n = 0; const kills = {}; const ends = [];
let both = 0, ourWin = 0, oppWin = 0;
for (let i = 0; i < +N; i++) {
  const res = battle([{ name: "C", streams: O, size: [214, 222] }, { name: "T", streams: T, size: [221, 202] }], (+s0) * 7919 + i * 104729, { rounds: +RR });
  sum += res.score[0]; n++; ends.push(res.end);
  if (res.score[0] === 1) ourWin++; else if (res.score[1] === 1) oppWin++; else both++;
  for (const d of res.deaths) {
    const v = res.procs[d.p].name, k = d.by >= 0 ? res.procs[d.by].name : "none";
    const ph = d.r < 1000 ? "early" : "late";
    const key = `${ph} ${v}<-${k}`; kills[key] = (kills[key] || 0) + 1;
  }
}
console.log(`${ours} vs ${opp}: mean ${(sum / n).toFixed(3)} n ${n} ourWin ${ourWin} oppWin ${oppWin} split ${both}`);
console.log(Object.entries(kills).sort().map(([k, v]) => `${k}:${v}`).join("  "));
