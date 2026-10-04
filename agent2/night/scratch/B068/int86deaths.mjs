// B068: count CAND deaths whose fatal byte window was written by an opponent INT86 block
// (>= 5 bytes in the window by the same non-CAND writer in the same round; only INT86 writes > 4 bytes per turn
// since PUSHA is invalid in v6). Usage: node int86deaths.mjs <traceDir>...
import fs from "node:fs"; import path from "node:path";
const tot = { deaths: 0, int86: 0, startup: 0, int86startup: 0, by: {}, ex: [] };
for (const dir of process.argv.slice(2)) for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".jsonl"))) {
  for (const line of fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n")) {
    const d = JSON.parse(line); if (d.warEnd !== undefined || d.group !== "CAND") continue;
    tot.deaths++;
    const startup = d.cs === 0x1000; if (startup) tot.startup++;
    const win = d.bytes.filter((b) => !b.oob);
    const cnt = {}; for (const b of win) if (b.r >= 0 && !/^CAND|^init|^load/.test(b.by)) { const k = `${b.by}@${b.r}`; cnt[k] = (cnt[k] ?? 0) + 1; }
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 5) { tot.int86++; if (startup) tot.int86startup++; const w = top[0].split("@")[0]; tot.by[w] = (tot.by[w] ?? 0) + 1;
      tot.ex.push(`${path.basename(dir)}/${f.replace(".jsonl", "")} ${d.name} r${d.round} cs ${d.cs.toString(16)} ip-load ${(d.ip - d.load).toString(16)} ${top[0]} x${top[1]}`); }
  }
}
console.log(JSON.stringify({ ...tot, ex: undefined }, null, 0)); for (const e of tot.ex) console.log(e);
