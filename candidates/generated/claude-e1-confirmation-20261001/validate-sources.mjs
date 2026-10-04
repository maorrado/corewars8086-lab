import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawnSync}from'node:child_process';
const here=import.meta.dirname,root=path.resolve(here,'../../..');
const rec=p=>({path:path.resolve(p),bytes:fs.statSync(p).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')});
const assert=(v,m)=>{if(!v)throw Error(m)};const read=p=>JSON.parse(fs.readFileSync(p));
const out=path.join(here,'validation');assert(!fs.existsSync(out)&&!fs.existsSync(path.join(here,'provenance.json')),'fresh validation only');
const sm=path.join(here,'source-snapshot/manifest.json');assert(rec(sm).sha256==='bdb3859435785966562ae97a1d37ade0eda6aa2289a0101652546f71427d465b','source snapshot pin');
const snapshot=read(sm),am=path.join(here,'assembly/manifest.json'),assembly=read(am),variants={};
for(const e of [...snapshot.sources,...snapshot.binaries])assert(rec(e.snapshot.path).sha256===e.snapshot.sha256,'snapshot identity');
for(const id of ['m049','m050','c090','e1'])variants[id]=['A','B'].map(side=>{
 const e=snapshot.binaries.find(x=>x.id===`${id}-${side}`);assert(e,'binary record');
 if(id.startsWith('m0'))return e.snapshot.path;
 const item=assembly.find(x=>path.basename(x.output)===`${id}-${side}`);assert(item&&item.binarySha256===e.snapshot.sha256&&item.size===e.snapshot.bytes,'independent assembly identity');
 assert(rec(item.output).sha256===item.binarySha256&&rec(item.input).sha256===item.sourceSha256,'assembly file identity');
 assert(fs.readFileSync(item.output).subarray(-17).toString('hex')==='a5f3a529d4292f8b3fb10931f6ab4fff1f','unchanged worker');return item.output;
});
const depFile=path.join(root,'candidates/generated/codex-goal-20261001/word-trigger/validation/result.json');
assert(rec(depFile).sha256==='a5d5f58d03a23aae8a2fd9298c3f590b50917d0ea51243aa20cd686ac60a9aba','original fixture');
const deps=read(depFile).files;for(const e of deps)assert(rec(e.path).sha256===e.sha256,'fixture dependency');
const classes=path.join(out,'classes'),priorClasses=path.join(root,'candidates/generated/codex-goal-20261001/word-trigger/validation/verified-classes');
const jar=path.join(root,'repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar');
const java=path.join(root,'tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe'),javac=path.join(root,'tools/temurin8-jdk/jdk8u504-b01/bin/javac.exe');
assert(rec(jar).sha256==='31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d','original jar');
fs.mkdirSync(classes,{recursive:true});const fixture=path.join(here,'BootstrapFixture.java');
const commands=[{executable:javac,args:['-cp',[priorClasses,jar].join(path.delimiter),'-d',classes,fixture]},
{executable:java,args:['-cp',[classes,priorClasses,jar].join(path.delimiter),'BootstrapFixture',...variants.m050,...variants.c090,...variants.e1]}];
const results=[];for(const c of commands){const r=spawnSync(c.executable,c.args,{encoding:'utf8',windowsHide:true,maxBuffer:4000000});results.push({...c,exitCode:r.status,stdout:r.stdout,stderr:r.stderr,error:r.error?.message??null});if(r.status!==0)break;}
const success=results.length===2&&results.every(x=>x.exitCode===0&&!x.error);const summary=success?JSON.parse(results[1].stdout):null;
const status=success&&summary.status==='PASS'&&summary.pairedPaths===714&&summary.healthyPaths===698&&summary.newFailures===0?'PASS':'FAIL';
const files=[sm,am,import.meta.filename,fixture,depFile,...deps.map(e=>e.path),...snapshot.sources.map(e=>e.snapshot.path),...snapshot.binaries.map(e=>e.snapshot.path),...assembly.flatMap(e=>[e.input,e.output]),java,javac,...fs.readdirSync(classes).map(n=>path.join(classes,n))];
const result={status,variants,summary,assembly:rec(am),sourceSnapshot:rec(sm),commands:results,files:[...new Set(files)].map(rec),
 limits:'Exact byte reproduction and isolated original-engine recurrence only, not broad superiority or immunity. Final competitive verification follows a separate frozen protocol.'};
const dest=path.join(here,status==='PASS'?'provenance.json':'validation/failure.json');fs.writeFileSync(dest,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status,artifact:rec(dest),summary,commands:success?undefined:results}));if(status!=='PASS')process.exitCode=1;
