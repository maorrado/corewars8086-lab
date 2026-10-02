// Build an agent2 benchmark plan.
// usage: node make-plan.mjs --id ID --salt SALT --field 2025[,counters,...] --zombies z2025 --partitions K
//        --battles N --arms id=pathA,pathB[;id=...] [--size 3] [--telemetry] [--out agent2/plans/ID.json]
// Every cohort gets its own fresh seed derived from SALT; arms share cohorts/seeds (paired design).
import fs from "node:fs";
import path from "node:path";
import * as F from "./fields.mjs";

const a = process.argv.slice(2);
const o = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const id = o("--id"), salt = o("--salt"), K = Number(o("--partitions", "1")), size = Number(o("--size", "3"));
if (!id || !salt) throw new Error("--id and --salt required");
const fieldMap = {
  2025: F.field2025, "2025s": F.field2025senior, "2024live": F.field2024live, "2024final": F.field2024final,
  "2023final": F.field2023final, counters: F.counters, peers: F.peers,
};
const teams = o("--field", "2025").split(",").flatMap((f) => { if (!fieldMap[f]) throw new Error(`unknown field ${f}`); return fieldMap[f](); });
const exclude = (o("--exclude", "") || "").split(",").filter(Boolean);
const pool = teams.filter((t) => !exclude.includes(t.name));
const arms = o("--arms").split(";").map((s) => { const [aid, ws] = s.split("="); return { id: aid, warriors: ws.split(",") }; });
const cohorts = [];
for (let k = 0; k < K; k++) {
  F.partition(pool, size, `${salt}/partition/${k}`).forEach((c, j) => {
    const cid = `p${String(k + 1).padStart(2, "0")}-c${String(j + 1).padStart(2, "0")}`;
    cohorts.push({ id: cid, seeds: [F.seedFor(salt, cid)], opponents: c });
  });
}
const plan = {
  id, salt, battles: Number(o("--battles", "40")), telemetry: a.includes("--telemetry"),
  field: o("--field", "2025"), zombiesPack: o("--zombies", "z2025"), zombies: F.zombies[o("--zombies", "z2025")],
  arms, cohorts,
};
const out = o("--out", `agent2/plans/${id}.json`);
fs.mkdirSync(path.dirname(path.resolve(F.root, out)), { recursive: true });
fs.writeFileSync(path.resolve(F.root, out), JSON.stringify(plan, null, 1) + "\n");
console.log(`${out}: ${arms.length} arms x ${cohorts.length} cohorts x ${plan.battles} battles = ${arms.length * cohorts.length * plan.battles}`);
