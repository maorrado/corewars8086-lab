// Classify per-cohort capture value (cand=nocapA minus base) by presence of zom20a mimics / competitors.
const path=require("path");
const b=require(path.resolve(process.argv[2])),c=require(path.resolve(process.argv[3]));
const m={};for(const r of c.runs)m[r.cohort+"|"+r.seed]=r;
const cls=(opp)=>{const n=Object.keys(opp).join(" ");
 if(/T_V6|T_V4|K_GoodTestV6|V6Guard/.test(n))return "v6family";
 if(/Grindo|callfart/.test(n))return "mimic";
 if(/Fishandpoultry|HDS_YOY/.test(n))return "z20aCompetitor";
 return "clean";};
const g={};for(const r of b.runs){const x=m[r.cohort+"|"+r.seed];const d=(x.team-r.team)/r.battles;const k=(r.cohort.startsWith("sstrong")?"strong:":"")+cls(r.opponents);(g[k]??=[]).push(d);}
for(const [k,a] of Object.entries(g)){const n=a.length,mu=a.reduce((s,x)=>s+x,0)/n,sd=Math.sqrt(a.reduce((s,x)=>s+(x-mu)**2,0)/Math.max(1,n-1));console.log(k.padEnd(22),"n",n,"mean",mu.toFixed(4),"se",(sd/Math.sqrt(n)).toFixed(4));}
