// D3: classify zombie end states per cohort from telemetry.csv (cs 4091 = 0FFBh far-call family).
// b/d zombies (zom20b/d): bomb86=1,bomb87=1 -> rev1 Z1 b/d path (ours); bomb86=2,bomb87=0 -> V6-family b/d path / other;
const fs=require("fs"); const root=process.argv[2];
for (const d of fs.readdirSync(root)) {
  const f=root+"/"+d+"/telemetry.csv"; if(!fs.existsSync(f)) continue;
  const rows=fs.readFileSync(f,"utf8").trim().split("\n").slice(1).map(l=>l.match(/("[^"]*"|[^,]*)(,|$)/g).map(x=>x.replace(/,$/,"").replace(/"/g,"")));
  const t={}; const wars=new Set();
  for (const r of rows) { const [war,,,,,name,group,type,load,alive,dr,reason,cs,ip,ss,sp,ds,es,en,b86,b87]=r; wars.add(war);
    if (type!=="ZOMBIE") continue;
    const k=name+":"+(cs==="4091"?"ffb":cs==="4096"?"own":"cs"+cs)+":"+b86+b87+(alive==="true"?":alive":"");
    t[k]=(t[k]||0)+1; }
  console.log(d.split("__")[1], "wars", wars.size, Object.entries(t).sort().map(([k,v])=>k+"="+v).join("  "));
}
