import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const here=import.meta.dirname,root=path.resolve(here,'../../..');
const external='C:/Users/ronyr/codeguru-work/corewars8086-lab/candidates/generated/microopt-2026-10-01/e1';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const assert=(v,m)=>{if(!v)throw Error(m)};
const record=p=>({path:path.resolve(p),bytes:fs.statSync(p).size,sha256:hash(p)});
const specs=[
 ['m049-A','candidates/generated/codex-goal-20261001/bootstrap-holdout/frozen/build/m049/A','106765da16166d0fa744631e5cfbe403c5eafc30db164eb47e1749e7d365a973',189],
 ['m049-B','candidates/generated/codex-goal-20261001/bootstrap-holdout/frozen/build/m049/B','7ed87893a82861b716ad0df6404b1c70282cb983db1a4a607363fd3f27ad6c77',117],
 ['m050-A','candidates/generated/codex-goal-20261001/bootstrap-holdout/frozen/build/m050/A','0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44',189],
 ['m050-B','candidates/generated/codex-goal-20261001/bootstrap-holdout/frozen/build/m050/B','06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782',117],
 ['c090-A','build/claude-synthesis-audit-20260930/extras/LeaA','e5a2681fe8a7d6a3af8cb5cedbe528f8629c39cb35fd12576b1d884612aa7a07',187],
 ['c090-B','build/claude-synthesis-audit-20260930/extras/LeaB','99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b',115],
 ['e1-A',path.join(external,'build/e1A'),'9447b5add61d6f18bff2708adfd2038c3eb1a9008dd9cf03df5c046eff4a4349',184],
 ['e1-B',path.join(external,'build/e1B'),'99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b',115],
];
const sourceSpecs=[
 ['e1-A.asm',path.join(external,'e1A.asm'),'4889a65840af4af98382b9128722336100fac0c508367b899d63c5d7d08a0fc1'],
 ['e1-B.asm',path.join(external,'e1B.asm'),'448a65a2d674fd68b36888b03004602fb2f8d3ac73e456c969e004bb48790664'],
 ['c090-A.asm',path.join(root,'candidates/generated/claude-synthesis-audit-20260930/LeaA.asm'),null],
 ['c090-B.asm',path.join(root,'candidates/generated/claude-synthesis-audit-20260930/LeaB.asm'),null],
];
const out=path.join(here,'source-snapshot');assert(!fs.existsSync(out),'Refusing an existing snapshot');
const inputs=specs.map(([id,file,expected,bytes])=>{const input=record(path.resolve(root,file));assert(input.sha256===expected&&input.bytes===bytes,'binary identity '+id);return{id,input}});
const sources=sourceSpecs.map(([id,file,expected])=>{const input=record(file);assert(!expected||input.sha256===expected,'source identity '+id);return{id,input}});
fs.mkdirSync(out);fs.mkdirSync(path.join(out,'binaries'));fs.mkdirSync(path.join(out,'sources'));
for(const [group,dir] of [[inputs,'binaries'],[sources,'sources']])for(const entry of group){const target=path.join(out,dir,entry.id);fs.copyFileSync(entry.input.path,target,fs.constants.COPYFILE_EXCL);entry.snapshot=record(target);assert(entry.snapshot.sha256===entry.input.sha256,'snapshot equality')}
const manifest={schemaVersion:1,status:'FROZEN_SOURCES_NOT_YET_INDEPENDENTLY_ASSEMBLED',recordedAt:new Date().toISOString(),binaries:inputs,sources,
 generator:record(import.meta.filename),limit:'Identity snapshot only; no new entropy, result or competitive claim.'};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(record(path.join(out,'manifest.json'))));
