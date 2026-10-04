import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const here=import.meta.dirname,root=path.resolve(here,'../../../..');
const record=p=>({path:path.resolve(p),bytes:fs.statSync(p).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')});
const assert=(ok,m)=>{if(!ok)throw Error(m);};
const validation=path.join(here,'validation'),classes=path.join(validation,'classes');
assert(!fs.existsSync(validation),'Refusing prior validation');
const design=JSON.parse(fs.readFileSync(path.join(here,'manifest.json'))),assembly=JSON.parse(fs.readFileSync(path.join(here,'build/manifest.json')));
const controls=['A','B'].map(n=>path.join(root,design.baseline[n].binary));
const candidates=['A-lower','B-lower','A-upper','B-upper'];
const binaries=[...controls,...candidates.map(n=>path.join(here,'build',n))];
const expected=[design.baseline.A.binarySha256,design.baseline.B.binarySha256,...candidates.map(n=>design.components[n].expectedBinarySha256)];
binaries.forEach((p,i)=>assert(record(p).sha256===expected[i],'binary identity'));
candidates.forEach((n,i)=>{
 const c=design.components[n],a=assembly.find(e=>path.basename(e.output)===n),binary=fs.readFileSync(binaries[i+2]),old=fs.readFileSync(controls[c.letter==='A'?0:1]);
 assert(a&&a.binarySha256===c.expectedBinarySha256&&a.sourceSha256===c.sourceSha256&&a.size===c.expectedBinaryBytes,'assembled manifest');
 assert(record(path.join(root,c.source)).sha256===c.sourceSha256,'source identity');
 const diff=[...old.keys()].filter(k=>old[k]!==binary[k]);
 assert(binary.length===old.length&&JSON.stringify(diff)===JSON.stringify(c.binaryChanges.map(d=>d.offset)),'two-byte BP/DX-only change');
 assert(binary.subarray(c.worker.offset).toString('hex')===c.worker.hex,'unchanged worker');
});
const fixtureResult=path.resolve(here,'../word-trigger/validation/result.json');
assert(record(fixtureResult).sha256==='a5d5f58d03a23aae8a2fd9298c3f590b50917d0ea51243aa20cd686ac60a9aba','original fixture provenance');
const dependency=JSON.parse(fs.readFileSync(fixtureResult));
for(const f of dependency.files)assert(record(f.path).sha256===f.sha256,'original fixture dependency unchanged');
const originalClasses=path.resolve(here,'../word-trigger/validation/verified-classes');
const jar=path.join(root,'repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar');
const java=path.join(root,'tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe'),javac=path.join(root,'tools/temurin8-jdk/jdk8u504-b01/bin/javac.exe');
assert(record(jar).sha256==='31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d','original engine');
fs.mkdirSync(classes,{recursive:true});
const source=path.join(here,'CoverageFixture.java');
const commands=[{executable:javac,args:['-cp',[originalClasses,jar].join(path.delimiter),'-d',classes,source]},
 {executable:java,args:['-cp',[classes,originalClasses,jar].join(path.delimiter),'CoverageFixture',...binaries]}];
const results=[];
for(const c of commands){const r=spawnSync(c.executable,c.args,{encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024});results.push({...c,exitCode:r.status,stdout:r.stdout,stderr:r.stderr,error:r.error?.message??null});if(r.status!==0)break;}
const summary='Coverage PASS offsets=119 paired=714 healthy=698 baselineUnhealthy=16 generations=258 newFailures=0';
const success=results.length===2&&results.every(r=>r.exitCode===0&&!r.error)&&results.at(-1).stdout.trim()===summary;
const result={status:success?'PASS':'FAIL',recordedAt:new Date().toISOString(),summary,offsets:119,pairedPaths:714,healthyPaths:698,baselineUnhealthyPaths:16,generations:258,newFailures:success?0:null,
 interpretation:'Original-engine isolated full-orbit comparisons, including direct captured-A entry; BP/DX and intended pointer orbit/dwell differ. No hostile-battle or universal claim. Known baseline bootstrap failures are separately reproduced.',commands:results,
 binaries:binaries.map(record),files:[...dependency.files.map(f=>f.path),fixtureResult,import.meta.filename,source,path.join(here,'manifest.json'),path.join(here,'build/manifest.json'),java,javac,
 ...candidates.map(n=>path.join(root,design.components[n].source)),...binaries,...fs.readdirSync(classes).map(n=>path.join(classes,n))].filter((p,i,a)=>a.indexOf(p)===i).map(record)};
const out=path.join(validation,'result.json');fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:result.status,result:record(out),summary,commands:success?undefined:results}));if(!success)process.exitCode=1;
