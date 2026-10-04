import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../..');
const research=path.join(root,'.arena/kphl-defense-20261004');
const report=JSON.parse(fs.readFileSync(path.join(research,'confirmation-report.json')));
assert.equal(report.decision,'PASS_TARGETED_DEFENSE_NO_MATERIAL_FIELD_LOSS');
assert.equal(report.field.base.battles,3000);
assert.equal(report.field.identicalFullScores,150);
assert.equal(report.perCounter.Counter_boot_hunter.base.points,0);
assert.equal(report.perCounter.Counter_boot_hunter.KPHLGuard.points,138);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const binaries=report.byteAudit.map(item=>{
 const bin=path.join(here,'build/KPHLGuard'+item.warrior),data=fs.readFileSync(bin);
 assert.equal(sha(data),item.sha256);
 assert.equal(data.length,item.bytes);
 assert.equal(data.indexOf(Buffer.from('160731ff','hex')),-1);
 const source=path.join(here,'KPHLGuard'+item.warrior+'.asm');
 assert.match(fs.readFileSync(source,'utf8'),/phoenix_init:\s+push ss\s+pop es\s+sub di, di/);
 return{warrior:item.warrior,source:path.relative(root,source),sourceSha256:sha(fs.readFileSync(source)),binary:path.relative(root,bin),bytes:item.bytes,sha256:item.sha256};
});
function csv(line){let out=[],field='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){out.push(field);field='';}else field+=c;}out.push(field);return out;}
const counterResult=path.join(root,'.arena/v6-cooperative-20261003/results/kphldef-20261004-confirm-counters-persistent.json');
const telemetry={};
for(const arm of ['base','KPHLGuard']){
 const runs=JSON.parse(fs.readFileSync(counterResult)).runs.filter(r=>r.arm===arm&&Object.keys(r.opponents)[0]==='Counter_boot_hunter');
 const rows=runs.flatMap(r=>{const lines=fs.readFileSync(path.join(root,r.telemetry),'utf8').trim().split(/\r?\n/),header=csv(lines.shift());return lines.map(l=>Object.fromEntries(csv(l).map((v,i)=>[header[i],v]))).filter(row=>row.group==='CAND');});
 const deathRounds={};for(const row of rows)if(row.alive==='false')deathRounds[row.deathRound]=(deathRounds[row.deathRound]??0)+1;
 telemetry[arm]={survivorRecords:rows.length,aliveAtEnd:rows.filter(r=>r.alive==='true').length,earlyDeathsByRound25:rows.filter(r=>r.alive==='false'&&Number(r.deathRound)<=25).length,deathRounds};
}
const packageReport={...report,binaries,bootHunterTelemetry:telemetry,packageValidation:'Freshly assembled release sources match the tested hashes exactly. No final/ promotion, commit or push performed.',reproduction:{assembler:'node C:/Maor/CodeGuru/corewars8086-agent2/agent2/tools/nasm-node.cjs candidates/generated/kphl-guard-20261004/build candidates/generated/kphl-guard-20261004/KPHLGuardA.asm candidates/generated/kphl-guard-20261004/KPHLGuardB.asm',analyzer:'node .arena/kphl-defense-20261004/analyze-confirmation.mjs',verify:'node candidates/generated/kphl-guard-20261004/verify-package.mjs',benchmarkRunner:'.arena/v6-cooperative-20261003/bench-priority.mjs',warning:'Existing benchmark outputs use frozen plans/inputs; changing them invalidates caches. Use a new plan ID for changed inputs. Outputs depend on the local agent2 Java8 runtime and deterministic v6 JAR.'}};
const followupPath=path.join(research,'adaptive-counter/report.json');
if(fs.existsSync(followupPath)){
 packageReport.originalNarrowDecision=packageReport.decision;
 packageReport.adversarialFollowup=JSON.parse(fs.readFileSync(followupPath));
 packageReport.decision=packageReport.adversarialFollowup.decision;
 packageReport.disposition=packageReport.adversarialFollowup.disposition;
}
fs.writeFileSync(path.join(here,'evidence.json'),JSON.stringify(packageReport,null,2)+'\n');
console.log(JSON.stringify({status:'verified',binaries,field:report.field,primaryCounter:report.perCounter.Counter_boot_hunter,bootHunterTelemetry:telemetry},null,2));
