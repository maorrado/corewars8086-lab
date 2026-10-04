const fs=require('fs');
const Z='agent2/runs/diag-2025-tele-persistent/b01d__p01-c01__a2-2ac8bfcae2c5468d/zombies/';
const b=fs.readFileSync(Z+'zom20b'); const T=[...b.slice(3,259)];
const rol=(x,k)=>((x<<k)|(x>>(8-k)))&255;
const found=[];
for(let r=0;r<8;r++)for(let a=0;a<256;a++)for(let c=0;c<256;c++){
  if(T.every((v,i)=>rol((a*i+c)&255,r)===v)) found.push(['rol(a*i+c)',r,a,c]);
  if(T.every((v,i)=>((a*rol(i,r)+c)&255)===v)) found.push(['a*rol(i)+c',r,a,c]);
}
for(let x=0;x<256;x++)for(let a=0;a<256;a++)for(let c=0;c<256;c++){ if(T.every((v,i)=>(((a*(i^x))+c)&255)===v)) found.push(['a*(i^x)+c',x,a,c]); if(T.every((v,i)=>(((a*i+c)&255)^x)===v)) found.push(['(a*i+c)^x',x,a,c]); }
console.log(found.slice(0,10));
console.log(T.slice(0,32).map(x=>x.toString(16)).join(' '));
