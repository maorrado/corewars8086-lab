const fs=require('fs');
const Z='agent2/runs/diag-2025-tele-persistent/b01d__p01-c01__a2-2ac8bfcae2c5468d/zombies/';
for (const z of ['zom20b','zom20d']){
const b=fs.readFileSync(Z+z); const T=[...b.slice(3,259)];
const w=[...Array(8)].map((_,j)=>(T[1<<j]-T[0])&255);
const ok=T.every((v,i)=>{let s=T[0];for(let j=0;j<8;j++)if(i>>j&1)s+=w[j];return (s&255)===v;});
const wx=[...Array(8)].map((_,j)=>(T[1<<j]^T[0]));
const okx=T.every((v,i)=>{let s=T[0];for(let j=0;j<8;j++)if(i>>j&1)s^=wx[j];return s===v;});
console.log(z,'additive',ok,w.map(x=>x.toString(16)),'xor',okx);
// inverse structure
const inv=Array(256);T.forEach((v,i)=>inv[v]=i);
const vi=[...Array(8)].map((_,j)=>(inv[1<<j]-inv[0])&255);
const okI=inv.every((v,y)=>{let s=inv[0];for(let j=0;j<8;j++)if(y>>j&1)s+=vi[j];return (s&255)===v;});
const vx=[...Array(8)].map((_,j)=>(inv[1<<j]^inv[0]));
const okIx=inv.every((v,y)=>{let s=inv[0];for(let j=0;j<8;j++)if(y>>j&1)s^=vx[j];return s===v;});
console.log(' inv additive',okI,'inv xor',okIx, 'inv0',inv[0].toString(16), vi.map(x=>x.toString(16)));
}
