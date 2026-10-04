// Coordinator wave 7: apply the fixed promotion rule to confirm results.
const fs = require("fs");
for (const id of process.argv.slice(2)) {
  const f = `agent2/night/queue/done/${id}.json`;
  if (!fs.existsSync(f)) { console.log(id, "NOT DONE"); continue; }
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  if (!r.ok) { console.log(id, "ERROR", r.error); continue; }
  const x = r.result, c = x.candidate;
  console.log(`== ${id} baseRev=${x.baseRevision} salt=${x.salt} battles/arm=${x.battlesPerArm} arms=${JSON.stringify(x.arms)}`);
  console.log(`   cand A ${c.sizeA}B ${c.shaA} B ${c.sizeB}B ${c.shaB}`);
  console.log(`   means ${JSON.stringify(x.means)}`);
  const s = (v) => v ? `${v.diff >= 0 ? "+" : ""}${v.diff} [${v.lo},${v.hi}] ${v.wins}/${v.losses}` : "-";
  for (const [arm, cmp] of Object.entries(x.compare)) {
    console.log(`  vs ${arm}: pooled ${s(cmp.pooled_2025_strong_2024live_z2_5)}`);
    for (const [g, v] of Object.entries(cmp.groups)) console.log(`     ${g}: ${s(v)}`);
    if (arm === "base" && cmp.byThreat) {
      const e = Object.entries(cmp.byThreat).map(([k, v]) => [k, v.diff ?? v]).sort((a, b) => a[1] - b[1]);
      console.log(`     byThreat min: ${e.slice(0, 4).map((p) => p.join(" ")).join(", ")} | max: ${e.slice(-4).map((p) => p.join(" ")).join(", ")}`);
    }
  }
  const b = x.compare.base, g = b.groups;
  const gate = (k) => g[k] && g[k].diff >= -0.01 && g[k].hi > 0;
  const rev0 = x.compare.rev0 ? x.compare.rev0.pooled_2025_strong_2024live_z2_5.diff >= 0 : true;
  const pass = b.pooled_2025_strong_2024live_z2_5.lo > 0 && gate("threat") && gate("multi") && gate("nozombie") && rev0;
  console.log(`  RULE: pooledLo>0=${b.pooled_2025_strong_2024live_z2_5.lo > 0} threat=${gate("threat")} multi=${gate("multi")} nozombie=${gate("nozombie")} rev0=${rev0} => ${pass ? "PROMOTE-ELIGIBLE" : "NOT PROMOTED"}`);
}
