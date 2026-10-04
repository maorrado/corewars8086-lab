// D3: tally who wrote the fatal bytes for our warriors per cohort (trace jsonl)
const fs=require("fs"); const dir=process.argv[2];
for (const f of fs.readdirSync(dir).filter(f=>f.endsWith(".jsonl"))) {
  const lines=fs.readFileSync(dir+"/"+f,"utf8").trim().split("\n").map(JSON.parse);
  const t={}; let n=0; const wars=new Set(lines.map(l=>l.war));
  for (const d of lines) {
    if (!/^CAND/.test(d.name)) continue; n++;
    const w = d.bytes.slice(0,4).map(b=>b.by).filter(b=>b!==d.name);
    const k = d.name+"<-"+(w[0]||"self")+" r"+(d.round<30?"<30":d.round<2000?"<2k":">=2k");
    t[k]=(t[k]||0)+1;
  }
  console.log(f, "battles", wars.size, "CAND deaths", n);
  for (const [k,v] of Object.entries(t).sort((a,b)=>b[1]-a[1]).slice(0,10)) console.log("   ",v,k);
}
