import fs from 'fs'; import path from 'path'; import {execSync} from 'child_process';
const roots=process.argv.slice(2);
function walk(d){let out=[];for(const f of fs.readdirSync(d)){const p=path.join(d,f);const s=fs.statSync(p);if(s.isDirectory())out=out.concat(walk(p));else if(s.size<=512&&!/\./.test(f))out.push(p);}return out}
for(const r of roots)for(const f of walk(r)){const b=fs.readFileSync(f);const hex=b.toString('hex');
 const hits=[];for(const c of ['174a','135d','6997']){let i=hex.indexOf(c);while(i>=0){if(i%2==0)hits.push(c+'@'+(i/2).toString(16));i=hex.indexOf(c,i+1)}}
 if(hits.length)console.log(f,hits.join(' '))}
