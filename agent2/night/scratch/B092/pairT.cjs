// B092: paired per-cohort comparison of two threat-job results with the same spec key.
// usage: node pairT.cjs <fileX> <fileY>   (results/<plan>.json; arm auto = first arm in file)
const fs=require('fs');
const load=(p)=>{const r=JSON.parse(fs.readFileSync('results/'+p)); const o={}; for(const x of r.runs) o[x.cohort+'|'+x.seed]=x.team/x.battles; return o;};
const [px,py]=process.argv.slice(2); const X=load(px), Y=load(py);
const st=(d)=>{const n=d.length,m=d.reduce((a,b)=>a+b,0)/n,sd=Math.sqrt(d.reduce((a,b)=>a+(b-m)**2,0)/(n-1)); return {n,diff:+m.toFixed(4),lo:+(m-1.96*sd/Math.sqrt(n)).toFixed(4),hi:+(m+1.96*sd/Math.sqrt(n)).toFixed(4),w:d.filter(v=>v>1e-9).length,l:d.filter(v=>v<-1e-9).length};};
const g={}, all=[];
for(const k of Object.keys(X)){ if(!(k in Y)) continue; const d=X[k]-Y[k]; all.push(d); (g[k.split('#')[0]]??=[]).push(d); }
console.log('ALL',JSON.stringify(st(all))); for(const [k,v] of Object.entries(g)) console.log(' ',k,JSON.stringify(st(v)));
