// B092: paired per-cohort comparison of two screen results on field S (same cohorts+seeds).
// usage: node pairS.cjs <planX> <armX> <planY> <armY>   (plan = results/<plan>.json)
const fs=require('fs'); const S=JSON.parse(fs.readFileSync('fields/S.json'));
const load=(p,arm)=>{const r=JSON.parse(fs.readFileSync('results/'+p+'.json')); const o={}; for(const x of r.runs) if(x.arm===arm) o[x.cohort]=x.team/x.battles; return o;};
const [px,ax,py,ay]=process.argv.slice(2); const X=load(px,ax), Y=load(py,ay);
const st=(d)=>{const n=d.length,m=d.reduce((a,b)=>a+b,0)/n,sd=Math.sqrt(d.reduce((a,b)=>a+(b-m)**2,0)/(n-1)); return {n,diff:+m.toFixed(5),lo:+(m-1.96*sd/Math.sqrt(n)).toFixed(5),hi:+(m+1.96*sd/Math.sqrt(n)).toFixed(5),w:d.filter(v=>v>1e-9).length,l:d.filter(v=>v<-1e-9).length};};
const g={}; const all=[]; const per=[];
for(const c of S.cohorts){ const d=X[c.id]-Y[c.id]; all.push(d); (g[c.group]??=[]).push(d); if(Math.abs(d)>1e-9) per.push(c.id+':'+d.toFixed(3)); }
console.log('ALL',JSON.stringify(st(all))); for(const [k,v] of Object.entries(g)) console.log(k,JSON.stringify(st(v)));
console.log(per.join(' '));
