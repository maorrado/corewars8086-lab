// Paired scan of one knob in the lattice-war model. usage: node v6scan.mjs key v1,v2,... N R seed [extraJSON]
import { execFileSync } from "node:child_process";
const [key, vals, N = "200", R = "200000", seed = "11", extra = "{}"] = process.argv.slice(2);
for (const v of vals.split(",")) {
  const o = { ...JSON.parse(extra), [key]: Number(v) };
  const out = execFileSync("node", ["v6war.mjs", JSON.stringify(o), N, R, seed], { encoding: "utf8" });
  const L = out.trim().split("\n");
  const m = L[0].match(/ourAlive (\d+) v6Alive (\d+) meanShare ([\d.]+)/);
  const cnt = (line, re) => [...line.matchAll(/(\w+)<-(\w+):(\d+)/g)].filter(x => re(x[1], x[2])).reduce((s, x) => s + +x[3], 0);
  const ourSet = new Set(["A", "B", "zA", "zB"]);
  const self = cnt(L[1], (v, k) => ourSet.has(k));
  const killsV6 = cnt(L[2], (v, k) => ourSet.has(k));
  const v6killsUs = cnt(L[1], (v, k) => k === "VA" || k === "VB");
  console.log(`${key}=0x${Number(v).toString(16)} share ${m[3]} ourAlive ${m[1]} v6Alive ${m[2]} selfKills ${self} oursKillV6 ${killsV6} v6KillUs ${v6killsUs} | ${L[1].trim()}`);
}
