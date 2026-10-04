import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../../..');
const file=relative=>path.join(root,relative);
const record=p=>({path:path.resolve(p),bytes:fs.statSync(p).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')});
const report=path.join(here,'validation/result.json'),build=path.join(here,'validation/verified-classes');
if(fs.existsSync(report)||fs.existsSync(build))throw Error('Refusing prior validation output');
const jar=file('repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar');
const javac=file('tools/temurin8-jdk/jdk8u504-b01/bin/javac.exe'),java=file('tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe');
if(record(jar).sha256!=='31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d')throw Error('Wrong original engine');
const source=path.join(here,'validation/WorkerRecurrenceFixture.java');
const binaries=['A','B'].map(n=>file(`candidates/generated/codex-goal-20261001/bootstrap-holdout/frozen/build/m050/${n}`))
 .concat(['A','B'].map(n=>path.join(here,`build/Word${n}`)));
const expected=['0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44','06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782','82616615d827119202b995649f4b11a59c3f7766ae2c9e762ab2b7ff833b1526','9f0326daa7c0bc2028788a1d5730072ed99032e2e0bad285a779bc47a9c3b778'];
binaries.forEach((p,i)=>{if(record(p).sha256!==expected[i])throw Error('Unexpected warrior binary');});
fs.mkdirSync(build);
const commands=[{executable:javac,args:['-cp',jar,'-d',build,source]},
 {executable:java,args:['-cp',[build,jar].join(path.delimiter),'WorkerRecurrenceFixture',...binaries]}];
const runs=[];
for(const command of commands){const r=spawnSync(command.executable,command.args,{encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024});
 runs.push({...command,exitCode:r.status,signal:r.signal,error:r.error?.message??null,stdout:r.stdout??'',stderr:r.stderr??''});if(r.status!==0)break;}
const last=runs.at(-1),summary='Original engine recurrence PASS: offsets=119, paths=357, baselineUnhealthyPaths=8, baselineDeviationsAvoided=0, pairedHealthyFiveGenerationPaths=349, newFaultsOrInvariantFailures=0, steadyOpcodesSaved=3';
const success=runs.length===2&&runs.every(r=>r.exitCode===0)&&last.stdout.includes(summary)&&last.stdout.split('\n').filter(l=>l.startsWith('BASELINE_DEVIATION')).length===8;
const result={recordedAt:new Date().toISOString(),status:success?'PASS':'FAIL',engineMode:'unchanged original JAR; no acceleration overlay',
 summary,offsets:119,paths:357,healthyPairedPaths:349,baselineUnhealthyPaths:8,newUnhealthyPaths:success?0:null,steadyOpcodesSaved:success?3:null,
 interpretation:'357 paired inert path cases (main A, main B, direct captured-A entry). 349 satisfy all five-generation invariants on both versions. Eight baseline B paths already fail or deviate, and the candidate also fails/deviates there; these are NOT claimed fixed. No battle score or all-load/hostile-interference guarantee.',
 commands:runs,binaryIdentities:Object.fromEntries(['m050A','m050B','wordA','wordB'].map((n,i)=>[n,record(binaries[i])])),
 files:[source,fileURLToPath(import.meta.url),jar,java,javac,...binaries,path.join(here,'build/manifest.json'),...['A','B'].map(n=>path.join(here,`Word${n}.asm`)),...fs.readdirSync(build).map(n=>path.join(build,n))].map(record)};
fs.writeFileSync(report,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:result.status,report,reportSha256:record(report).sha256,summary}));
if(!success)process.exitCode=1;
