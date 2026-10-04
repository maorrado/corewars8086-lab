// A036: zom20a capture statistics from a trace dir (warEnd records): per battle,
// zom20a byte writes per round (uncaptured zom20a writes 2 bytes / 3 rounds ~0.67/round).
const fs = require("fs"); const dir = process.argv[2];
const rows = [];
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".jsonl")).sort()) {
  const lines = fs.readFileSync(dir + "/" + f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  for (const e of lines) {
    if (e.warEnd === undefined) continue;
    const z = e.writes.zom20a; if (!z) continue;
    const rate = z[0] / Math.max(1, e.round);
    const zall = ["zom20b", "zom20c", "zom20d"].map((n) => e.writes[n] ? e.writes[n][0] / Math.max(1, e.round) : 0);
    const cand = (e.winners.includes("CAND1") ? 0.5 : 0) + (e.winners.includes("CAND2") ? 0.5 : 0);
    const nwin = e.winners.split(",").map((s) => s.trim()).filter((s) => s && !s.startsWith("zom")).length;
    rows.push({ f, war: e.warEnd, round: e.round, rate, cap: rate > 2, alive: z[1], ipBy: z[2], zbd: zall, a4: e.a45["ZoMbIeS:A4"] ? e.a45["ZoMbIeS:A4"][2] : 0, score: nwin ? (cand * 2) / nwin : 0 });
  }
}
const by = {};
for (const r of rows) { const g = (by[r.f] ??= { n: 0, cap: 0, a4: 0, sc: 0, capSc: 0, nocapSc: 0 }); g.n++; g.cap += r.cap; g.a4 += r.a4 > 50; g.sc += r.score; if (r.cap) g.capSc += r.score; else g.nocapSc += r.score; }
let T = { n: 0, cap: 0, a4: 0 };
for (const [f, g] of Object.entries(by)) { console.log(f.padEnd(36), "n", g.n, "zom20a busy", g.cap, "zombieA4@2>50", g.a4, "candWinShare", (g.sc / g.n).toFixed(3), "capSc", (g.capSc / Math.max(1, g.cap)).toFixed(3), "nocapSc", (g.nocapSc / Math.max(1, g.n - g.cap)).toFixed(3)); T.n += g.n; T.cap += g.cap; T.a4 += g.a4; }
console.log("TOTAL n", T.n, "zom20a busy", T.cap, "zombieA4@2>50", T.a4);
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(rows));
