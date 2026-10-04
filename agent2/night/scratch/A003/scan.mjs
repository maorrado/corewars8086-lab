import fs from 'fs'; import path from 'path';
const roots=process.argv.slice(2);
const pats={ 'movAX_F2E2':[0xB8,0xE2,0xF2],'movAX_9341':[0xB8,0x41,0x93],'movDX_C381':[0xBA,0x81,0xC3],'bytes_E2F281C3':[0xE2,0xF2,0x81,0xC3],'bytes_4193E2F2':[0x41,0x93,0xE2,0xF2],'cell4A17':[0x17,0x4A],'int87':[0xCD,0x87],'movCX_F2E2':[0xB9,0xE2,0xF2],'movDX_F2E2':[0xBA,0xE2,0xF2],'movDX_E2F2?':[0xBA,0xF2,0xE2]};
function walk(d){let out=[];for(const f of fs.readdirSync(d)){const p=path.join(d,f);const s=fs.statSync(p);if(s.isDirectory())out=out.concat(walk(p));else if(s.size<=512&&!/\./.test(f))out.push(p);}return out}
function find(b,p){const r=[];for(let i=0;i+p.length<=b.length;i++){let ok=true;for(let j=0;j<p.length;j++)if(b[i+j]!==p[j]){ok=false;break}if(ok)r.push(i)}return r}
for(const r of roots)for(const f of walk(r)){const b=fs.readFileSync(f);const hits=[];for(const[k,p]of Object.entries(pats)){const h=find(b,p);if(h.length&&k!=='int87')hits.push(k+'@'+h.map(x=>x.toString(16)).join(','))}if(hits.length)console.log(f,hits.join(' '))}
