// B065: per-threat team scores of base and candidate arms (mean, SE) from threat-job result files.
const fs=require('fs');
for(const j of process.argv.slice(2)){
  const r=JSON.parse(fs.readFileSync(`agent2/night/queue/done/${j}.json`));const res=r.result||r;
  const key=res.specKey;
  for(const [arm,file] of [['base',`nightT-${key}-base-rev0.json`],['cand',`nightT-${key}-${r.candidate?.shaA?.slice(0,10)??'45d913530e'}-${r.candidate?.shaB?.slice(0,10)??'6b4b07dea5'}.json`]]){
    const p='agent2/night/results/'+file; if(!fs.existsSync(p)){console.log('missing',p);continue}
    const R=JSON.parse(fs.readFileSync(p));const by={};
    for(const x of R.runs){const t=x.cohort.split('#')[0];(by[t]??=[]).push(x.team/x.battles)}
    for(const [t,a] of Object.entries(by)){const m=a.reduce((s,x)=>s+x,0)/a.length;const sd=Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1));console.log(j.slice(-5),arm,t.padEnd(12),m.toFixed(4),'se',(sd/Math.sqrt(a.length)).toFixed(4),'n',a.length)}
  }
}
