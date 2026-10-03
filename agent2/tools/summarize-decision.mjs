// Build agent2/results/decision-summary.json from raw holdout results (paired cohort t intervals).
import fs from "node:fs"; import { execFileSync } from "node:child_process";
const cmp = (files, ctl) => JSON.parse((execFileSync("node", ["agent2/tools/compare.mjs", files, ctl, "--json", "agent2/runs/_tmp.json"]), fs.readFileSync("agent2/runs/_tmp.json", "utf8")));
const out = { generatedAt: new Date().toISOString(), note: "diff = arm minus control, per-battle team score; ci95 = Student-t over cohort units", holdouts: {} };
for (const h of ["h1", "h2", "h3"]) for (const H of ["H1", "H2", "H3", "H4", "H5", "H6"]) {
  const f = `agent2/results/${h}-${H}-persistent.json`;
  if (!fs.existsSync(f)) continue;
  out.holdouts[`${h}-${H}`] = { m050: cmp(f, "m050").arms, b01d: cmp(f, "b01d").arms };
}
out.originalEngineFreshPanel = cmp("agent2/results/final-orig-2025-original.json", "m050").arms;
out.pooledH1vsM050 = cmp("agent2/results/h2-H1-persistent.json,agent2/results/h3-H1-persistent.json", "m050").arms;
for (const k of Object.keys(out.pooledH1vsM050)) delete out.pooledH1vsM050[k].perOpponent;
out.verification = ["verify-h1-H1-agent2-verify-h1", "verify-h3-H1-agent2-verify-h3H1", "verify-h3-H5-agent2-verify-h3H5"].map((n) => { const v = JSON.parse(fs.readFileSync(`agent2/results/${n}.json`, "utf8")); return { file: n, jobs: v.jobs, identical: v.identical }; });
fs.writeFileSync("agent2/results/decision-summary.json", JSON.stringify(out, null, 1) + "\n");
const show = (k, arm, ref) => { const a = out.holdouts[k]?.[ref]?.[arm]; return a && a.diff !== undefined ? `${a.diff >= 0 ? "+" : ""}${a.diff.toFixed(4)} [${a.ci95[0].toFixed(4)},${a.ci95[1].toFixed(4)}]` : "-"; };
for (const arm of ["zchain", "zchain3", "zchain4"]) for (const ref of ["m050", "b01d"]) {
  console.log(`${arm} vs ${ref}`);
  for (const h of ["h1", "h2", "h3"]) console.log("  " + h + " " + ["H1", "H2", "H3", "H4", "H5", "H6"].map((H) => `${H} ${show(`${h}-${H}`, arm, ref)}`).join(" | "));
}
