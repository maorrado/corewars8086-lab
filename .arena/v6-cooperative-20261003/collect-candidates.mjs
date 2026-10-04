import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const session=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const [outName,...files]=process.argv.slice(2);
if(!outName||outName.includes('/')||outName.includes('\\')||!files.length)throw Error('usage collect output.json manifest...');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const seen=new Map(),candidates=[],duplicates=[];
for(const file of files) {
 const m=JSON.parse(fs.readFileSync(file));
 for(const c of (Array.isArray(m)?m:m.candidates)) {
  const ws=c.warriors??c.binaries??[c.a,c.b];
  const binaries=ws.map(w=>typeof w==='string'?w:w.binary);
  const sources=c.sources??ws.map(w=>w.source);
  const hashes=binaries.map(sha);
  const expected=c.sha256??ws.map(w=>w.sha256);
  for(let i=0;i<2;i++)if(expected[i]&&expected[i]!==hashes[i])throw Error('manifest hash mismatch: '+c.id);
  if(seen.has(hashes.join(':'))){duplicates.push({id:c.id,sameAs:seen.get(hashes.join(':'))});continue;}
  seen.set(hashes.join(':'),c.id);
  candidates.push({...c,warriors:binaries,sources,sha256:hashes,sizes:binaries.map(b=>fs.statSync(b).size),sourceManifest:path.resolve(file)});
 }
}
const out=path.join(session,outName);fs.writeFileSync(out,JSON.stringify({candidates,duplicates},null,2)+'\n',{flag:'wx'});
console.log(`${out}: ${candidates.length} unique pairs, ${duplicates.length} duplicates`);
