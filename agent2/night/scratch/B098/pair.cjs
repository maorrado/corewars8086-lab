// paired per-cohort difference between two screen (or threat) jobs on the same field: cand1 - cand2
const fs=require('fs');const L=id=>JSON.parse(fs.readFileSync(`agent2/night/queue/done/${id}.json`,'utf8')).result;
const [a,b]=process.argv.slice(2).map(L);
const key=p=>p.cohort+'|'+(p.threat??'');
const mb=new Map(b.perCohort.map(p=>[key(p),p]));
const groups={};const rows=[];
for(const p of a.perCohort){const q=mb.get(key(p));if(!q)continue;
 if(Math.abs(p.base-q.base)>1e-9) console.log('BASE MISMATCH',key(p),p.base,q.base);
 const d=p.cand-q.cand;(groups[p.group]??=[]).push(d);(groups.ALL??=[]).push(d);
 if(Math.abs(d)>1e-9)rows.push(`${p.group} ${p.threat??p.cohort} ${d.toFixed(4)}`);}
const st=x=>{const n=x.length,m=x.reduce((s,v)=>s+v,0)/n,sd=Math.sqrt(x.reduce((s,v)=>s+(v-m)**2,0)/Math.max(1,n-1)),se=sd/Math.sqrt(n);
 return `${m>=0?'+':''}${m.toFixed(4)} [${(m-2*se).toFixed(4)},${(m+2*se).toFixed(4)}] n=${n} W/L=${x.filter(v=>v>1e-9).length}/${x.filter(v=>v<-1e-9).length}`;};
for(const[g,x]of Object.entries(groups))console.log(g,st(x));console.log(rows.join('\n'));
