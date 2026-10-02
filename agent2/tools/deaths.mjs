// Dump candidate deaths with location classification. usage: node deaths.mjs <result.json> [arm]
import fs from "node:fs"; import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const res = JSON.parse(fs.readFileSync(process.argv[2], "utf8")); const armSel = process.argv[3];
const team = res.teamName;
const parse = (t) => { const L = t.trim().split(/\r?\n/); const H = L.shift().split(","); return L.map(l => { const c = l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map(x => x.replace(/,$/, "").replace(/^"|"$/g, "")); return Object.fromEntries(H.map((h, i) => [h, c[i]])); }); };
const sizes = Object.fromEntries(Object.entries(res.armHashes).map(([k, v]) => [k, v.map(x => x.bytes)]));
const buckets = {}; const where = {}; const n = {};
for (const run of res.runs) {
  if (armSel && run.arm !== armSel) continue;
  const rows = parse(fs.readFileSync(path.join(root, run.telemetry), "utf8"));
  for (const r of rows) {
    if (r.group !== team || r.alive === "true") continue;
    const dr = Number(r.deathRound);
    const b = dr < 50 ? "a<50" : dr < 200 ? "b<200" : dr < 1000 ? "c<1000" : dr < 5000 ? "d<5000" : "e>=5000";
    const k = `${run.arm} ${r.type}`;
    buckets[k] ??= {}; buckets[k][b] = (buckets[k][b] ?? 0) + 1;
    const cs = Number(r.cs), ip = Number(r.ip), lo = Number(r.loadOffset);
    const size = sizes[run.arm][r.type === "SURVIVOR_1" ? 0 : 1];
    const lin = (cs * 16 + ip) - 0x10000;
    let loc;
    if (cs === 0x1000 && ip >= lo && ip < lo + size) loc = `own-code+${(ip - lo).toString(16)}`;
    else if (cs === 0x1000) loc = "arena-cs1000";
    else if (cs === 0x0ffc || cs === 0x0ff9) loc = "worker-cs0ffc";
    else loc = `cs=${cs.toString(16)}`;
    if (dr < 1000) { const kk = `${k} ${r.deathReason} ${loc}`; where[kk] = (where[kk] ?? 0) + 1; }
  }
}
console.log(JSON.stringify(buckets, null, 0));
for (const [k, v] of Object.entries(where).sort((a, b) => b[1] - a[1]).slice(0, 40)) console.log(v, k);
