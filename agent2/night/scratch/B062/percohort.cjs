// usage: node percohort.cjs <basePlanJson> <candPlanJson>
const b=require(require("path").resolve(process.argv[2]));const c=require(require("path").resolve(process.argv[3]));
const m={};for(const r of c.runs)m[r.cohort+"|"+r.seed]=r;
for(const r of b.runs){const x=m[r.cohort+"|"+r.seed];const opp=Object.entries(r.opponents).map(([k,v])=>k+"="+(v/r.battles).toFixed(2)).join(" ");
 console.log(r.cohort.padEnd(26),"base",(r.team/r.battles).toFixed(3),"cand",(x.team/x.battles).toFixed(3),"d",((x.team-r.team)/r.battles).toFixed(3),"|",opp)}
