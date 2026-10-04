// Enumerate all band configurations (qCA,qCB,qTA,qTB in 0..4) x team order, weighted by band probability.
// usage: node enum.mjs "<ours expr>" "<opp expr>" [rounds=200000] [label]
// expr: a KINDS key or a JS expression using mkA/mkB/TPL/KINDS
import { battle, KINDS, mkA, mkB, TPL } from "./fsim.mjs";
import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";
const me = fileURLToPath(import.meta.url);
const WQ = [14, 15, 15, 15, 2.2];
const parse = (k) => KINDS[k] || eval(k);
// rotation invariance (adding k to every q rotates the whole picture by 15k lattice points): merge
// configurations with the same q - min(q) into one canonical representative.
const cmap = new Map();
for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) for (let c = 0; c < 5; c++) for (let d = 0; d < 5; d++) for (let o = 0; o < 2; o++) {
  const m = Math.min(a, b, c, d);
  const key = [a - m, b - m, c - m, d - m, o].join();
  const w = WQ[a] * WQ[b] * WQ[c] * WQ[d];
  if (!cmap.has(key)) cmap.set(key, { qs: [[a - m, b - m], [c - m, d - m]], order: o ? [1, 0] : [0, 1], w: 0 });
  cmap.get(key).w += w;
}
const configs = [...cmap.values()];
if (process.argv[2] === "--child") {
  const [, , , ours, opp, rounds, part, parts] = process.argv;
  const O = parse(ours), T = parse(opp);
  const out = [];
  for (let i = +part; i < configs.length; i += +parts) {
    const cf = configs[i];
    const res = battle([{ name: "C", streams: O, size: [214, 222] }, { name: "T", streams: T, size: [221, 202] }], 1, { rounds: +rounds, qs: cf.qs, order: cf.order });
    const alive = res.procs.map((p) => p.alive ? 1 : 0).join("");
    out.push({ i, s: res.score[0], end: res.end, alive, d: res.deaths.map((d) => [res.procs[d.p].name, d.by >= 0 ? res.procs[d.by].name : "-", d.r]) });
  }
  process.send(out); process.exit(0);
} else {
  const [ours = "rev1", opp = "V6", rounds = "200000", label = ""] = process.argv.slice(2);
  const P = 8; let done = 0; const all = [];
  for (let k = 0; k < P; k++) {
    const ch = fork(me, ["--child", ours, opp, rounds, String(k), String(P)]);
    ch.on("message", (m) => { all.push(...m); });
    ch.on("exit", () => { if (++done === P) finish(); });
  }
  async function finish() {
    let sw = 0, ss = 0, win = 0, loss = 0; const kills = {};
    for (const r of all) {
      const w = configs[r.i].w; sw += w; ss += w * r.s;
      if (r.s === 1) win += w; else if (r.s === 0) loss += w;
      for (const [v, b, t] of r.d) { const key = `${t < 1000 ? "e" : "l"} ${v}<-${b}`; kills[key] = (kills[key] || 0) + w; }
    }
    console.log(`${label || ours} vs ${opp}: score ${(ss / sw).toFixed(4)} win ${(win / sw).toFixed(3)} loss ${(loss / sw).toFixed(3)}`);
    console.log("  deaths/battle: " + Object.entries(kills).sort().map(([k, v]) => `${k} ${(v / sw).toFixed(3)}`).join(", "));
    if (process.env.DUMP) { const fs = await import("node:fs"); fs.writeFileSync(process.env.DUMP, JSON.stringify(all)); }
  }
}
