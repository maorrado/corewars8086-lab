const fs=require('fs'),path=require('path');
const session='C:/Maor/CodeGuru/corewars8086-lab/.arena/v6-cooperative-20261003';
const pool=JSON.parse(fs.readFileSync(path.join(session,'pool.json'),'utf8'));
const targets=[['originalA',pool.baseline[0].path],['originalB',pool.baseline[1].path],['camoA',path.join(__dirname,'batch7/camo_both/build/A')],['camoB',path.join(__dirname,'batch7/camo_both/build/B')]].map(([name,file])=>({name,bytes:fs.readFileSync(file)}));
function last(bytes,end,opcode){for(let i=end-3;i>=Math.max(0,end-48);i--)if(bytes[i]===opcode)return{at:i,value:bytes.readUInt16LE(i+1)};return null;}
const records=[];
for(const team of pool.pool)for(const file of team.warriors){
 const bytes=fs.readFileSync(file);
 for(let i=0;i<bytes.length-1;i++)if(bytes[i]===0xcd&&bytes[i+1]===0x87){
  const ax=last(bytes,i,0xb8),dx=last(bytes,i,0xba);if(!ax||!dx)continue;
  const signature=Buffer.alloc(4);signature.writeUInt16LE(ax.value,0);signature.writeUInt16LE(dx.value,2);
  const hits=targets.map(t=>({target:t.name,at:t.bytes.indexOf(signature)})).filter(x=>x.at>=0);
  records.push({team:team.name,file,int87Offset:i,ax,dx,signature:signature.toString('hex'),hits});
 }
}
const report={warning:'Raw opcode/immediate heuristic only: bytes may be inside operands or data; intervening register mutations and control flow are not resolved. Matches identify review targets, not proof of executable attacks.',records};
fs.writeFileSync(path.join(__dirname,'field-signatures.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({sites:records.length,hits:records.filter(x=>x.hits.length)},null,2));
