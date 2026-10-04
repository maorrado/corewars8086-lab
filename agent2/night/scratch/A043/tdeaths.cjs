// A043: list our (CAND1/CAND2) deaths in a trace dir: phase, round, writer of fatal bytes.
const fs = require("fs"), path = require("path");
const dir = process.argv[2];
const rows = [];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".jsonl"))) {
  for (const line of fs.readFileSync(path.join(dir, f), "utf8").split("\n")) {
    if (!line.trim()) continue; const r = JSON.parse(line);
    if (r.name !== "CAND1" && r.name !== "CAND2") continue;
    const by = [...new Set(r.bytes.slice(0, 4).map((b) => b.by))].join("/");
    rows.push({ f: f.replace(".jsonl", ""), war: r.war, who: r.name, round: r.round, cs: r.cs, ip: r.ip, load: r.load, by });
  }
}
const st = rows.filter((r) => r.cs === 4096);
console.log("total", rows.length, "startup", st.length, "partnerish", rows.filter((r) => /CAND/.test(r.by)).length);
for (const r of st) console.log(JSON.stringify(r));
const early = rows.filter((r) => r.round < 5000);
console.log("deaths <5000 rounds:", early.length, " A:", early.filter((r) => r.who === "CAND1").length, " B:", early.filter((r) => r.who === "CAND2").length);
for (const r of rows.filter((r) => /CAND/.test(r.by))) console.log("partner/self:", JSON.stringify(r));
