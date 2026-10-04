// E4 phase scan on D1's absim (own streams only). Phases given as lattice indices (hi byte / 4).
// For each config: 25 band combos (weights WQ) x zombie scenarios; records first own-caused A/B death round.
import { stream, run } from "../D1/absim.mjs";
const WQ = [14, 15, 15, 15, 2.2]; const bands = [0, 0x3C00, 0x7800, 0xB400, 0xF000];
export function evalCfg(c, { R = 100000, scen = ["ab", "za", "zb", "zab", "zbd"], zaT = 44, zbT = 70 } = {}) {
  const ph = (i) => ((i * 0x400) + 0xA2) & 0xffff;
  const out = { w: 0, d20: 0, d50: 0, dR: 0, list: [] };
  for (const sc of scen) for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    const w = WQ[i] * WQ[j];
    const S = [stream({ name: "A", id: 1, ip: (bands[i] + ph(c.a)) & 0xffff, gap: c.aGap ?? 0x100, cx: 9, dx: c.aDX ?? 0x4000, bp: c.aBP ?? 0x4400, cell: 0x2C0, startRound: c.aS ?? 54 }),
      stream({ name: "B", id: 2, ip: (bands[j] + ph(c.b)) & 0xffff, gap: c.bGap ?? 0x600, cx: 8, dx: c.bDX ?? 0x2400, bp: c.bBP ?? 0x2C00, cell: 0x280, startRound: c.bS ?? 57 })];
    const z = (name, id, p, t) => stream({ name, id, ip: (bands[j] + ph(p)) & 0xffff, gap: c.zGap ?? c.bGap ?? 0x600, cx: 8, dx: c.zDX ?? c.bDX ?? 0x2400, bp: c.zBP ?? c.bBP ?? 0x2C00, cell: 0x280, startRound: t, speed: 2 });
    if (sc === "za" || sc === "zab") S.push(z("zA", 3, c.za, zaT));
    if (sc === "zb" || sc === "zab" || sc === "zbd") S.push(z("zB", 4, c.zb, zbT));
    if (sc === "zbd") S.push(z("zD", 5, c.zb, zbT + 5));
    const res = run(S, R, { stopOnDeath: false });
    let first = Infinity, who = "";
    for (const r of res) if (!r.alive && (r.name === "A" || r.name === "B") && r.death.killer !== "none" && r.death.round < first) { first = r.death.round; who = `${r.name}<-${r.death.killer}`; }
    out.w += w;
    if (first < 20000) out.d20 += w; if (first < 50000) out.d50 += w; if (first < R) { out.dR += w; out.list.push(`${sc}:${i}${j}:${who}@${first}`); }
  }
  for (const k of ["d20", "d50", "dR"]) out[k] = +(out[k] / out.w).toFixed(3);
  return out;
}
if ((process.argv[1] ?? "").endsWith("pscan.mjs")) {
  const c = Object.fromEntries(process.argv.slice(2).filter(a => a.includes("=")).map(a => { const [k, v] = a.split("="); return [k, Number(v)]; }));
  const cfg = { a: 11, b: 4, za: 8, zb: 28, ...c };
  const r = evalCfg(cfg, { R: c.R ?? 100000 });
  console.log(JSON.stringify(cfg), "d20", r.d20, "d50", r.d50, "dR", r.dR); if (process.argv.includes("-v")) console.log(r.list.join("\n"));
}
