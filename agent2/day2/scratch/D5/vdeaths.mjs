import fs from "node:fs";
const D = "agent2/day2/q/scratch/_trace/dayTR-1e9efbcb54-dd73fad407";
const files = process.argv.slice(2);
for (const f of files) {
  const rows = fs.readFileSync(`${D}/${f}`, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const sc = fs.readFileSync(`${D}/${f.replace(".jsonl", ".scores.csv")}`, "utf8");
  console.log("=====", f, sc.replace(/\n/g, " | ").slice(0, 300));
  for (const r of rows.filter((r) => /^CAND|^T_/.test(r.name))) {
    const by = [...new Set(r.bytes.slice(0, 6).map((b) => b.by + "@" + b.r))].slice(0, 3).join(",");
    const ip = r.cs * 16 + r.ip - 0x10000;
    console.log(String(r.war).padStart(2), r.name.padEnd(12), "rnd", String(r.round).padStart(6), "cs", r.cs.toString(16), "phys", (ip & 0xffff).toString(16).padStart(4, "0"), "load", r.load.toString(16).padStart(4,"0"), "sp", r.sp.toString(16), r.reason.slice(0, 3), "b", r.bytes.slice(0, 4).map((b) => (b.v ?? -1).toString(16)).join(" "), by,
      "alive", r.alive.filter(a=>!a.z).map(a=>a.n+(a.ipBy!==a.n?"<"+a.ipBy:"")).join(" "));
  }
}
