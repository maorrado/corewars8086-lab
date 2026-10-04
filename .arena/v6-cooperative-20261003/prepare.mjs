import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const session = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const root = 'C:/Maor/CodeGuru/corewars8086-lab';
const agent2 = 'C:/Maor/CodeGuru/corewars8086-agent2';
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const write = (p, data) => { fs.mkdirSync(path.dirname(p), {recursive:true}); fs.writeFileSync(p,data,{flag:'wx'}); };
const copy = (src,dest) => { fs.mkdirSync(path.dirname(dest), {recursive:true}); fs.copyFileSync(src,dest,fs.constants.COPYFILE_EXCL); return {path:dest,source:src,bytes:fs.statSync(dest).size,sha256:hash(dest)}; };
const expected=['3fa67bed880413901ad618b4f7b248e5782d98de93318271ac540ad1690ca2b7','8579e2c2212d72a413a6daacfe3b91ceb72be648bfc085bfeed9430eeaf6657a'];
const baseline=[];
for(let i=0;i<2;i++) {
  const src=path.join(root,'study-notes/good-test-v6/original-binaries',`Good_Test_V6_${i+1}`);
  if(hash(src)!==expected[i])throw Error('baseline mismatch');
  baseline.push(copy(src,path.join(session,'baseline',i?'B':'A')));
}
const frontier=JSON.parse(fs.readFileSync(path.join(agent2,'agent2/frontier-20261003/frontier-v4-v6-screen.json')));
const teams=new Map();
for(const c of frontier.cohorts)for(const t of c.opponents) teams.set(t.name,t);
if(teams.size!==75)throw Error(`expected all 75 teams, found ${teams.size}`);
const pool=[];
for(const t of [...teams.values()].sort((a,b)=>a.name.localeCompare(b.name))) {
  const files=t.warriors.map((w,i)=>copy(path.resolve(agent2,w),path.join(session,'pool',t.name,String(i+1))));
  pool.push({name:t.name,warriors:files.map(f=>f.path),files});
}
const zombies=frontier.zombies.map(z=>({name:z.name,...copy(path.resolve(agent2,z.path),path.join(session,'zombies',z.name))}));
write(path.join(session,'pool.json'),JSON.stringify({baseline,pool,zombies},null,2)+'\n');
let runner=fs.readFileSync(path.join(agent2,'agent2/tools/bench.mjs'),'utf8');
runner=runner.replace(/^const root = .*;$/m,`const root = ${JSON.stringify(root)};\nconst session = ${JSON.stringify(session)};\nconst agent2 = ${JSON.stringify(agent2)};`)
 .replace('const java = R("tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe");','const java = path.join(agent2,"tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe");')
 .replace('const jar = R("repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar");','const jar = path.join(agent2,"repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar");')
 .replace('const runRoot = R(`agent2/runs/${safe(plan.id)}-${engine}`);','const runRoot = path.join(session,`runs/${safe(plan.id)}-${engine}`);')
 .replace('const resultPath = R(`agent2/results/${safe(plan.id)}-${engine}.json`);','const resultPath = path.join(session,`results/${safe(plan.id)}-${engine}.json`);')
 .replace('fs.rmSync(j.dir, { recursive: true, force: true });','if (fs.existsSync(j.dir)) throw new Error(`Partial job directory exists; use a new plan ID: ${j.dir}`);')
 .replace('R("agent2/tools/java/classes")','path.join(agent2,"agent2/tools/java/classes")')
 .replace('sha(R("agent2/tools/java/A2Batch.java"))','sha(path.join(agent2,"agent2/tools/java/A2Batch.java"))');
const marker='const todo = jobs.filter((j) => !fs.existsSync(j.scores));';
if(!runner.includes(marker))throw Error('runner version mismatch');
const guard=`
fs.mkdirSync(runRoot,{recursive:true});
const inputFiles=[...new Set([...plan.arms.flatMap(a=>a.warriors),...plan.cohorts.flatMap(c=>c.opponents.flatMap(o=>o.warriors)),...plan.zombies.map(z=>z.path)])];
const signature=JSON.stringify({plan:sha(planPath),files:inputFiles.map(p=>[p,sha(R(p))]),driver:sha(path.join(agent2,'agent2/tools/java/A2Batch.java')),jar:sha(jar)});
const signaturePath=path.join(runRoot,'frozen-inputs.json');
if(fs.existsSync(signaturePath)){if(fs.readFileSync(signaturePath,'utf8')!==signature)throw new Error('Cached input identity mismatch');}
else fs.writeFileSync(signaturePath,signature,{flag:'wx'});
`;
runner=runner.replace(marker,guard+'\n'+marker);
write(path.join(session,'bench.mjs'),runner);
write(path.join(session,'compare.mjs'),fs.readFileSync(path.join(agent2,'agent2/tools/compare.mjs')));
write(path.join(session,'tool-provenance.json'),JSON.stringify({source:path.join(agent2,'agent2/tools/bench.mjs'),sourceSha256:hash(path.join(agent2,'agent2/tools/bench.mjs')),adaptedSha256:hash(path.join(session,'bench.mjs')),changes:['absolute dependency paths','session-local output paths','input hash guard','refuse partial-stage overwrite; no deletes']},null,2)+'\n');
console.log(`Frozen original V6, ${pool.length} opponents, ${zombies.length} Zombies and isolated driver.`);
