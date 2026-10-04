const fs=require('fs');
const Z='agent2/runs/diag-2025-tele-persistent/b01d__p01-c01__a2-2ac8bfcae2c5468d/zombies/';
for (const z of ['zom20b','zom20d']) {
  const b=fs.readFileSync(Z+z); const T=[...b.slice(3,259)];
  const perm = new Set(T).size===256;
  // GF2 affine?
  let aff=true; for(let i=0;i<256;i++)for(let j=0;j<256;j++) if((T[i^j]^T[0])!==((T[i]^T[0])^(T[j]^T[0]))){aff=false;break;}
  // mod-256 linear? T[i]=a*i+c
  let lin=null; for(let a=0;a<256;a++){ if(T.every((v,i)=>((a*i+T[0])&255)===v)) lin=a; }
  console.log(z,'perm',perm,'affineGF2',aff,'lin',lin, 'T0',T[0].toString(16), 'T1',T[1].toString(16));
  // try T[i] = f(i) with xor/add combos: check T[i]^T[i^1]
  console.log(' T[i]^T[i^1] set', [...new Set(T.map((v,i)=>v^T[i^1]))].map(x=>x.toString(16)));
  console.log(' diffs even', T.filter((_,i)=>i%2==0).slice(0,20).map((v,k,a)=>k?((v-a[k-1])&255).toString(16):'').join(' '));
  console.log(' tail bytes', [...b.slice(259,0x107)].map(x=>x.toString(16)).join(' '));
}
