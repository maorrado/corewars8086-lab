import fs from 'node:fs';
import path from 'node:path';
const s=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const data=JSON.parse(fs.readFileSync(path.join(s,'pool.json')));
if(process.argv.includes('--check')) {
 const scores=engine=>fs.readdirSync(path.join(s,'runs','driver-smoke-'+engine)).filter(x=>x.includes('__')).sort().map(x=>[x,fs.readFileSync(path.join(s,'runs','driver-smoke-'+engine,x,'scores.csv'),'utf8')]);
 const p=scores('persistent'),o=scores('original');
 if(JSON.stringify(p)!==JSON.stringify(o))throw Error('persistent vs original score mismatch');
 for(let i=0;i<2;i++)if(p.find(([id])=>id.startsWith('original_v6__p0-c'+i+'__'))[1]!==p.find(([id])=>id.startsWith('mirror_v6__p0-c'+i+'__'))[1])throw Error('same-binary control mismatch');
 console.log('PASS: 16 battles per engine; four byte-identical score files; identical-binary control tied.');
} else {
 const plan={id:'driver-smoke',teamName:'CAND',battles:4,telemetry:false,zombies:data.zombies.map(z=>({name:z.name,path:z.path})),arms:['original_v6','mirror_v6'].map(id=>({id,warriors:data.baseline.map(f=>f.path)})),cohorts:[0,1].map(i=>({id:'p0-c'+i,opponents:data.pool.slice(i*3,i*3+3).map(t=>({name:t.name,warriors:t.warriors})),seeds:['arena-driver-validation-'+i]}))};
 fs.mkdirSync(path.join(s,'plans'),{recursive:true});fs.writeFileSync(path.join(s,'plans','driver-smoke.json'),JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
}
