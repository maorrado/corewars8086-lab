// per-threat team means for a threat job: node pt.cjs <specKey> <candPrefix>
const fs=require('fs');const [key,cp]=process.argv.slice(2);const R='agent2/night/results/';
for(const [lab,f,arm] of [['base','nightT-'+key+'-base-rev0.json','base'],['cand','nightT-'+key+'-'+cp+'.json','cand']]){
 if(!fs.existsSync(R+f)){console.log('missing',f);continue}
 const d=JSON.parse(fs.readFileSync(R+f));const g={};
 for(const r of d.runs.filter(r=>r.arm===arm)){const t=r.cohort.split('#')[0];(g[t]??=[]).push({v:r.team/r.battles,w1:r.w1/r.battles,w2:r.w2/r.battles,opp:r.opponents,c:r.cohort})}
 for(const [t,a] of Object.entries(g)){const m=k=>(a.reduce((s,x)=>s+x[k],0)/a.length).toFixed(4);console.log(lab,t,'team',m('v'),'w1',m('w1'),'w2',m('w2'),'n',a.length)}
 if(process.argv[4])for(const [t,a] of Object.entries(g))for(const x of a)console.log(lab,x.c,x.v.toFixed(3),JSON.stringify(x.opp))
}
