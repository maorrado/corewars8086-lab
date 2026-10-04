const fs=require('fs'),path=require('path');
const base=__dirname,batch=path.join(base,'batch5');
const combined=JSON.parse(fs.readFileSync(path.join(batch,'directA_gapB/build/manifest.json'),'utf8'));
const paint=JSON.parse(fs.readFileSync(path.join(base,'batch4/paintless/build/manifest.json'),'utf8'));
const orig=JSON.parse(fs.readFileSync(path.join(base,'baseline/manifest.json'),'utf8'));
function record(id,m,edits,hypothesis,failure_modes){return{id,sources:m.map(x=>x.input),warriors:m.map(x=>x.output),sizes:m.map(x=>x.size),sha256:m.map(x=>x.binarySha256),edits,hypothesis,failure_modes};}
const candidates=[
 record('a001_directA_gapB',combined,'Exact a002_direct_boot_a A plus exact a003_bstackshift B. A initial MOVSB marker/JMP bypass; B initial SP+600->+400. A layout correctly label-rebased, B original layout maintained.','Combine independently promising A-only direct startup and shorter B initial paint while preserving original steady attack geometry. Exploratory combination, not confirmed baseline.','Individual screens may be noise and interaction effects can undo both gains.'),
 record('a001_paintless_a',[paint[0],orig[1]],'A only marker1FFF->1FA4; initial and worker CALL FAR->JMP FAR. B exact original.','A accelerates survival while B preserves recurring paint offense.','A removes its arena-paint attack and may keep revisiting corrupt fragments.'),
 record('a001_paintless_b',[orig[0],paint[1]],'B only marker1FFF->1FA4; initial and worker CALL FAR->JMP FAR. A exact original.','B gains the larger recurring survival acceleration while A preserves paint and captured-scanner attack.','B removes its arena-paint attack; faster B can conflict with A or captured Zombies.')
];
const out=path.join(batch,'candidates.json');if(fs.existsSync(out))throw Error('immutable exists');
fs.writeFileSync(out,JSON.stringify({schema:'cooperative-arena-candidates-v1',baseline:'original_v6',provenance:'Research derivatives of friend-provided V6; no new baseline adopted.',candidates},null,2)+'\n');
