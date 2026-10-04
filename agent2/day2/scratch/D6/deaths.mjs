import fs from "node:fs";
const D = process.argv[2] || "agent2/day2/q/scratch/_trace/dayTR-1e9efbcb54-dd73fad407";
const rows = [];
for (const f of fs.readdirSync(D).filter((f) => f.endsWith(".jsonl"))) {
  for (const l of fs.readFileSync(`${D}/${f}`, "utf8").split("\n").filter(Boolean)) {
    const r = JSON.parse(l); r.file = f; rows.push(r);
  }
}
const cand = rows.filter((r) => r.name === "CAND1" || r.name === "CAND2");
console.log("cand deaths", cand.length);
const hist = {};
for (const r of cand) {
  const b = r.round < 50 ? "<50" : r.round < 200 ? "<200" : r.round < 1000 ? "<1000" : r.round < 5000 ? "<5000" : ">=5000";
  const k = `${r.name} ${r.cs === 4096 ? "arena" : "cs" + r.cs.toString(16)} ${b}`;
  hist[k] = (hist[k] || 0) + 1;
}
console.log(Object.entries(hist).sort().map(([k, v]) => `${k}: ${v}`).join("\n"));
console.log("--- early (round<300) deaths ---");
for (const r of cand.filter((r) => r.round < 300).sort((a, b) => a.round - b.round)) {
  const by = [...new Set(r.bytes.slice(0, 4).map((b) => b.by + "@" + b.r))].join(",");
  console.log(r.file, r.war, r.name, "rnd", r.round, "cs", r.cs.toString(16), "ip", r.ip.toString(16), "load", r.load.toString(16), r.reason, "ax",(r.ax>>>0).toString(16),"di",(r.di>>>0).toString(16),"es",(r.es>>>0).toString(16),"ss",(r.ss>>>0).toString(16),"sp",(r.sp>>>0).toString(16),"bx",(r.bx>>>0).toString(16), "bytes", r.bytes.slice(0, 4).map((b) => (b.v??-1).toString(16)).join(" "), by);
}
