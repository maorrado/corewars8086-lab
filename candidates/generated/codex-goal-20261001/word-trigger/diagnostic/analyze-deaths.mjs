// Read-only interpretation of an accepted original-engine diagnostic replay.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const here=import.meta.dirname;
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const file=path.join(here,'replay-reviewed/deaths.jsonl');
const execution=JSON.parse(fs.readFileSync(path.join(here,'replay-reviewed/execution.json'),'utf8'));
if(execution.status!=='PASS'||hash(file)!==execution.outputs.diagnosticsJsonl.sha256)throw Error('Unverified replay');
const deaths=fs.readFileSync(file,'utf8').trim().split(/\r?\n/).map(JSON.parse).filter(x=>x.event==='death');
const classified=deaths.map(row=>{
 const s=row.state,b=Buffer.from(s.codeWindow.hex,'hex'),i=s.codeWindowIpIndex;
 const damagedAnchor=row.reason==='memory exception'&&s.cs===0xffc&&s.ip===((s.dsBxWord+4)&65535)
  &&b.subarray(i-4,i-2).toString('hex')==='ffa5';
 return {war:row.war,name:row.name,round:row.round,reason:row.reason,damagedAnchor,
  ...(damagedAnchor?{pointer:s.dsBxWord,ip:s.ip,ds:s.ds,di:s.di,si:s.si,cx:s.cx,
   displacement:b.readUInt16LE(i-2),indirectReadOffset:(s.di+b.readUInt16LE(i-2))&65535,
   privateTemplateIntact:s.dsZeroWindow.hex.startsWith('a5f3a529d4292f8b3fb10931f6ab4fff1f')}: {})};
});
console.log(JSON.stringify({sourceSha256:hash(file),replayExecutionSha256:hash(path.join(here,'replay-reviewed/execution.json')),
 battles:50,deaths:deaths.length,memoryDeaths:deaths.filter(r=>r.reason==='memory exception').length,
 damagedAnchors:classified.filter(r=>r.damagedAnchor).length,classified,
 interpretation:'30 deaths decode the current FF A5 disp16 bytes as JMP near [DI+disp16] via private DS, instead of FF 1F CALL far [BX]. The callback IP is four bytes after the anchor; observed SI=0, CX=9 and intact private worker exclude a REP source-exhaustion explanation for these cases. The snapshot does not identify the corrupting writer. This is a selected single-cohort diagnostic sample, not a general-field prevalence estimate.'},null,2));
