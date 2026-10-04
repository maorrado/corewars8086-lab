// B051: classify CAND deaths by the bytes at the fatal IP (bytes[0..3] = IP..IP+3) and their writers.
// usage: node anal.mjs <traceDir> [examples]
import fs from "node:fs"; import path from "node:path";
const dir = process.argv[2];
const h = (v) => (v ?? 0).toString(16).padStart(2, "0");
const who = (x) => (x?.by ?? "oob").replace(/[12]$/, "");
const tally = {}, fams = {}, killers = {}; const ex = []; let n = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".jsonl"))) {
  for (const line of fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n")) {
    const d = JSON.parse(line);
    if (d.warEnd !== undefined || d.group !== "CAND") continue;
    n++;
    const b = d.bytes, last = d.hist.at(-1) ?? "", m = last.match(/ (\w+):(\w+) /);
    const lip = m ? parseInt(m[2], 16) : -1, lcs = m ? parseInt(m[1], 16) : -1;
    const off = lip >= 0 ? (lip - d.ip + 4) : 4; const ip4 = b.slice(Math.max(0, off), Math.max(0, off) + 4);
    const atAnchor = lcs === 0x0ffb && (lip & 0xff) === 0xa2;
    const fam = !atAnchor ? "not-anchor" : ip4[0].v === 0xff && ip4[1].v === 0xa5 ? "anchor FF A5 (MOVSW trail, 1st push)" : ip4[1].v === 0xa5 ? "anchor ?? A5 (MOVSW trail, 2nd push)" : ip4[0].v === 0xff && ip4[1].v === 0x1f ? "anchor intact FF 1F" : "anchor other";
    const k1 = `${fam}`; fams[k1] = (fams[k1] ?? 0) + 1;
    const key = `${f.replace(".jsonl", "").padEnd(28)} ${d.reason.padEnd(17)} ${fam.padEnd(38)} w(IP+1)=${who(ip4[1])}`;
    tally[key] = (tally[key] ?? 0) + 1;
    if (atAnchor && ip4[1].v === 0xa5) killers[who(ip4[1])] = (killers[who(ip4[1])] ?? 0) + 1;
    ex.push(`${f} r${d.round} ${d.name} ${d.reason} ${h(d.cs)}:${d.ip.toString(16)} ds=${d.ds.toString(16)} di=${d.di.toString(16)} bytes=${b.map(x => h(x.v)).join(" ")} w=${ip4.map(x => who(x) + "@" + x.r).join(",")} last=${(d.hist.at(-1) ?? "").split(" ").pop()}`);
  }
}
console.log("CAND deaths", n);
for (const [k, v] of Object.entries(fams).sort((a, b) => b[1] - a[1])) console.log(String(v).padStart(4), k);
console.log("A5-at-anchor+1 writers:", JSON.stringify(killers));
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(String(v).padStart(4), k);
if (process.argv[3]) console.log(ex.join("\n"));
