import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..');
const tracked=new Set(execFileSync('git',['ls-files','-z'],{cwd:root,maxBuffer:100000000}).toString().split('\0'));
const selected=new Map(),excluded={},large=[],maxFile=20*1024*1024;
const count=(why)=>{excluded[why]=(excluded[why]??0)+1;};
const eligible=new Set(['.asm','.mjs','.cjs','.js','.json','.md','.java','.ps1','.py','.patch','.txt']);
const badSecret=[/sk-[A-Za-z0-9_-]{32,}/,/ghp_[A-Za-z0-9]{36}/,/github_pat_[A-Za-z0-9_]{50,}/,/AKIA[A-Z0-9]{16}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/];
function add(rel,reason){
 const abs=path.join(root,rel),st=fs.statSync(abs);if(st.size>maxFile){large.push({path:rel,bytes:st.size,reason:'Large raw output not included; keep local, see compact summaries.'});return;}
 const data=fs.readFileSync(abs);
 if(eligible.has(path.extname(rel).toLowerCase())||rel.endsWith('.csv')){const text=data.toString('utf8');for(const re of badSecret)if(re.test(text))throw Error('Potential secret in '+rel+'; review before staging (secret value not printed).');}
 selected.set(rel,{path:rel,bytes:st.size,sha256:crypto.createHash('sha256').update(data).digest('hex'),reason});
}
function walk(rel,mode,inRun=false){
 for(const ent of fs.readdirSync(path.join(root,rel),{withFileTypes:true})){
  const next=rel+'/'+ent.name,run=inRun||/^runs(?:-|$)/.test(ent.name);
  if(ent.isSymbolicLink()){count('Symlinks not followed');continue;}
  if(ent.isDirectory()){
   if(['.git','node_modules','.venv','__pycache__','classes','.cache'].includes(ent.name)){count('Environment or compiled-class directories');continue;}
   if(run&&['survivors','zombies'].includes(ent.name)){count('Duplicate staged input directories');continue;}
   if(mode!=='arena'&&['build','assembly','measurements'].includes(ent.name)){
    if(ent.name==='measurements'&&mode==='tools')walk(next,mode,run);else count('Regenerable build directories');continue;
   }
   if(next.endsWith('/.arena')&&mode==='arena'&&rel!=='.arena'){walk(next,'arena',run);continue;}
   walk(next,mode,run);continue;
  }
  if(!ent.isFile())continue;
  const ext=path.extname(ent.name).toLowerCase();
  if(run){if(['scores.csv','telemetry.csv'].includes(ent.name))add(next,'Raw score or telemetry evidence; duplicate warrior/Zombie staging is excluded.');else count('Runtime manifests logs and staging');continue;}
  if(tracked.has(next)){count('Already tracked research');continue;}
  if(['.lst','.class','.nul','.log','.tmp','.out','.err','.dll','.exe','.jar','.zip','.png','.jpg','.mp4'].includes(ext)){count('Regenerable listing runtime media or log');continue;}
  if(mode==='arena'&&(eligible.has(ext)||ext===''||ext==='.csv'))add(next,'Codex session source input snapshot plan result or analysis.');
  else if(eligible.has(ext)&&!next.includes('/survivors/')&&!next.includes('/zombies/'))add(next,'Previously local authored research script config or compact result.');
  else count('Other generated local artifacts');
 }
}
for(const dir of ['.arena','experiments','candidates/generated'])if(fs.existsSync(path.join(root,dir)))walk(dir,dir==='.arena'?'arena':'research');
for(const name of fs.readdirSync(path.join(root,'tools')))if(name.startsWith('engine-acceleration-')&&fs.statSync(path.join(root,'tools',name)).isDirectory())walk('tools/'+name,'tools');
for(const ent of fs.readdirSync(root,{withFileTypes:true}))if(ent.isFile()&&!tracked.has(ent.name)&&eligible.has(path.extname(ent.name).toLowerCase()))add(ent.name,'Historical root research source or generated experiment definition.');
const files=[...selected.values()].sort((a,b)=>a.path.localeCompare(b.path));
const totals={};for(const f of files){const group=f.path.split('/').slice(0,f.path.startsWith('.arena/')?2:1).join('/');const t=totals[group]??={files:0,bytes:0};t.files++;t.bytes+=f.bytes;}
const result={schema:'codex-research-publication-catalog-v1',generatedAt:new Date().toISOString(),scope:'Preserve local Codex research sources, frozen inputs, plans, compact results and manageable raw score/telemetry evidence. Include negative results. No runtime environment, credentials or duplicate staging trees; no local file deleted.',files:files.length,bytes:files.reduce((s,f)=>s+f.bytes,0),groups:totals,exclusions:excluded,largeLocalOnly:large,records:files};
fs.writeFileSync(path.join(here,'catalog.json'),JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(here,'stage-paths.nul'),files.map(f=>f.path).join('\0')+'\0');
console.log(JSON.stringify({files:result.files,megabytes:result.bytes/1048576,groups:totals,exclusions:excluded,largeLocalOnly:large},null,2));
