// B061: per-cohort FF A5 anchor deaths in a trace dir + score check + crude upper-bound cost
// usage: node cost.mjs <traceDir>
import fs from "node:fs"; import path from "node:path";
const dir = process.argv[2];
const isZ = (n) => /^zom/.test(n);
let G = { battles: 0, a5: 0, a5battles: 0, ub: 0 };
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".jsonl")).sort()) {
  const csv = fs.readFileSync(path.join(dir, f.replace(".jsonl", ".scores.csv")), "utf8");
  const candCsv = +(csv.match(/^CAND,([\d.]+)/m)?.[1] ?? NaN);
  const wars = {}; const deaths = {};
  for (const line of fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n")) {
    const d = JSON.parse(line);
    if (d.warEnd !== undefined) { wars[d.warEnd] = d; continue; }
    if (d.group !== "CAND") continue;
    const b = d.bytes; const last = d.hist.at(-1) ?? ""; const m = last.match(/ (\w+):(\w+) /);
    const lip = m ? parseInt(m[2], 16) : -1, lcs = m ? parseInt(m[1], 16) : -1;
    const off = lip >= 0 ? lip - d.ip + 4 : 4; const ip4 = b.slice(Math.max(0, off), Math.max(0, off) + 4);
    const a5 = lcs === 0x0ffb && (lip & 0xff) === 0xa2 && ip4[1]?.v === 0xa5;
    (deaths[d.war] ??= []).push({ name: d.name, a5, by: ip4[1]?.by });
  }
  let sum = 0, a5n = 0, a5b = 0, ub = 0; const killers = {};
  for (const [w, e] of Object.entries(wars)) {
    const win = e.winners.split(",").map((s) => s.trim()).filter((s) => s && !isZ(s));
    const k = win.filter((s) => /^CAND/.test(s)).length; const n = win.length;
    const sc = n ? k / n : 0; sum += sc;
    const dl = (deaths[w] ?? []).filter((x) => x.a5);
    if (dl.length) { a5b++; a5n += dl.length; dl.forEach((x) => (killers[x.by?.replace(/[12]$/, "")] = (killers[x.by?.replace(/[12]$/, "")] ?? 0) + 1));
      const k2 = k + dl.length, n2 = n + dl.length; ub += k2 / n2 - sc; }
  }
  const nb = Object.keys(wars).length;
  G.battles += nb; G.a5 += a5n; G.a5battles += a5b; G.ub += ub;
  console.log(f.replace(".jsonl", "").padEnd(28), `battles ${nb} scoreSum(formula) ${sum.toFixed(2)} csv ${candCsv}  FF-A5 deaths ${a5n} in ${a5b} battles  upper-bound cost/battle ${(ub / nb).toFixed(3)}  killers ${JSON.stringify(killers)}`);
}
console.log("TOTAL", JSON.stringify(G), "ub/battle", (G.ub / G.battles).toFixed(3));
