// D2: per-war death log for traced cohorts. usage: node wars.mjs <traceDir> <cohortPrefix>
import fs from "node:fs"; import path from "node:path";
const [dir, pre] = process.argv.slice(2);
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".jsonl") && f.startsWith(pre))) {
  console.log("=====", f);
  const wars = {};
  for (const line of fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n")) {
    const d = JSON.parse(line);
    if (d.warEnd !== undefined) { (wars[d.warEnd] ??= { deaths: [] }).end = d; continue; }
    const w = (wars[d.war] ??= { deaths: [] });
    const win = d.bytes.slice(0, 8).filter(b => !b.oob && b.by !== d.name && b.r >= 0).sort((a, b) => b.r - a.r);
    const zs = d.alive.filter(a => a.z).map(a => `${a.n.slice(5)}:${a.ipBy.replace("zom20", "")}`).join(",");
    w.deaths.push(`${d.name}@${d.round}<-${win.length ? win[0].by : "self/untouched"} cs=${d.cs.toString(16)} [${zs}]`);
  }
  for (const [k, w] of Object.entries(wars)) {
    const e = w.end; const zst = e ? Object.entries(e.writes).filter(([n]) => n.startsWith("zom")).map(([n, v]) => `${n.slice(5)}:${v[1] ? "L" : "d"}:${v[2]}`).join(" ") : "";
    console.log(`war ${k} end r${e?.round} winners: ${e?.winners} | ${zst}`);
    for (const x of w.deaths) console.log("   ", x);
  }
}
