// Usage: node eval.cjs <confirm-result.json> ; prints key numbers and the fixed promotion rule outcome.
const j = JSON.parse(require("fs").readFileSync(process.argv[2], "utf8"));
const r = j.result;
const f = (x) => (x >= 0 ? "+" : "") + x.toFixed(4);
const iv = (g) => `${f(g.diff)} [${f(g.lo)},${f(g.hi)}] ${g.wins}/${g.losses} n=${g.n}`;
console.log("job", j.job.id, "cand", JSON.stringify(r.candidate), "battles/arm", r.battlesPerArm, "baseRev", r.baseRevision);
console.log("means", JSON.stringify(r.means));
for (const [arm, c] of Object.entries(r.compare)) {
  console.log(`-- vs ${arm}: pooled ${iv(c.pooled_2025_strong_2024live_z2_5)}`);
  for (const [g, v] of Object.entries(c.groups)) console.log(`   ${g}: ${iv(v)}`);
  if (arm === "base" && c.byThreat) {
    const t = Object.entries(c.byThreat).map(([k, v]) => [k, v.diff ?? v]).filter(([, d]) => typeof d === "number").sort((a, b) => b[1] - a[1]);
    console.log("   byThreat:", t.map(([k, d]) => `${k} ${f(d)}`).join(", "));
  }
}
const b = r.compare.base;
const g = b.groups;
const ok1 = b.pooled_2025_strong_2024live_z2_5.lo > 0;
const ok2 = ["threat", "multi", "nozombie"].every((k) => g[k] && g[k].diff >= -0.01 && g[k].hi > 0);
const ok3 = r.compare.rev0 ? r.compare.rev0.pooled_2025_strong_2024live_z2_5.diff >= 0 : true;
console.log("RULE pooled.lo>0:", ok1, " threat/multi/nozombie:", ok2, " rev0:", r.compare.rev0 ? ok3 : "no arm", " => PROMOTE:", ok1 && ok2 && ok3);
