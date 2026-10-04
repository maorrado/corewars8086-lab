// B058: list CAND deaths in startup phase or killed by bytes written in the first 300 rounds; show writer, round, IP-load, bytes.
import fs from "node:fs"; import path from "node:path";
const [dir, team = "CAND"] = process.argv.slice(2);
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".jsonl"))) {
  for (const line of fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n")) {
    const d = JSON.parse(line);
    if (d.warEnd !== undefined || d.group !== team) continue;
    const win = d.bytes.slice(0, 8).filter(b => !b.oob);
    const ext = win.filter(b => b.by !== d.name && b.r >= 0).sort((a, b) => b.r - a.r)[0];
    const early = d.cs === 0x1000 || (ext && ext.r < 400 && !/^CAND/.test(ext.by));
    if (!early) continue;
    console.log(f.replace(".jsonl",""), d.name, "round", d.round, "cs", d.cs.toString(16), "ip", d.ip.toString(16), "load", d.load.toString(16), "ip-load", (d.ip - d.load).toString(16), d.reason, "| killer", ext ? `${ext.by}@r${ext.r}` : "none", "| bytes", win.map(b => b.v.toString(16).padStart(2,"0")+":"+b.by.slice(0,10)+"@"+b.r).join(" "));
  }
}
