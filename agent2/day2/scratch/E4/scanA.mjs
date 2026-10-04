import { evalCfg } from "./pscan.mjs";
const key = process.argv[2]; const vals = process.argv[3].split(",").map(Number); const R = +(process.argv[4] ?? 200000);
const scen = (process.argv[5] ?? "ab,za,zb,zab").split(",");
for (const v of vals) { const cfg = { a: 11, b: 4, za: 8, zb: 28, [key]: v };
  const r = evalCfg(cfg, { R, scen });
  const by = {}; for (const x of r.list) { const k = x.split(":")[0] + ":" + x.split(":")[2].split("@")[0]; by[k] = (by[k] ?? 0) + 1; }
  console.log(key, v, "d20", r.d20, "d50", r.d50, "dR", r.dR, JSON.stringify(by)); }
