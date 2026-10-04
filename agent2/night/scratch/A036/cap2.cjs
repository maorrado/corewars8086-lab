// A036: per-battle zom20a fate from a trace dir. writes / lifetime rounds; death round; ipBy at end.
const fs = require("fs"); const dir = process.argv[2]; const out = {};
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".jsonl")).sort()) {
  const L = fs.readFileSync(dir + "/" + f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  let deathR = {};
  for (const e of L) {
    if (e.warEnd === undefined) { if (e.name === "zom20a") deathR[e.war] = e; continue; }
    const z = e.writes.zom20a; const d = deathR[e.warEnd];
    const life = d ? d.round : e.round; const rate = z[0] / Math.max(1, life);
    let fate;
    if (rate > 2) fate = d ? "busy-died" : "busy-alive"; else fate = d ? (d.round < 60 ? "died<60" : "idle-died") : "idle-alive";
    const cand = ["CAND1", "CAND2"].filter((n) => e.writes[n] && e.writes[n][1]).length;
    const surv = Object.entries(e.writes).filter(([n, v]) => !n.startsWith("zom") && v[1]).length;
    const sc = surv ? cand / surv : 0;
    const k = f.replace(".jsonl", "");
    (out[k] ??= []).push({ war: e.warEnd, fate, life, rate: +rate.toFixed(2), sc, dIp: d ? d.ip : null, dBy: d ? d.bytes.slice(3, 5).map((b) => b.by + ":" + (b.v ?? "")).join(" ") : "" });
  }
}
const tot = {};
for (const [k, rows] of Object.entries(out)) {
  const c = {}; for (const r of rows) { c[r.fate] = (c[r.fate] || 0) + 1; tot[r.fate] = (tot[r.fate] || 0) + 1; }
  console.log(k.padEnd(28), JSON.stringify(c), "meanSc", (rows.reduce((a, r) => a + r.sc, 0) / rows.length).toFixed(3));
}
console.log("TOTAL", JSON.stringify(tot));
if (process.argv[3] === "-v") for (const [k, rows] of Object.entries(out)) for (const r of rows) if (r.fate.startsWith("died") || r.fate.startsWith("idle")) console.log(k, r.war, r.fate, r.life, r.rate, r.dBy);
if (process.argv[3] === "-j") console.log(JSON.stringify(out));
