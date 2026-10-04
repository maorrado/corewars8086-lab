const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const own = __dirname;
const root = 'C:/Maor/CodeGuru/corewars8086-lab';
const nasm = 'C:/Maor/CodeGuru/corewars8086-agent2/agent2/tools/nasm-node.cjs';
const originals = ['V6_1.asm', 'V6_2.asm'].map(n => fs.readFileSync(path.join(root, 'study-notes/good-test-v6/source', n), 'utf8'));
function editOnce(src, before, after) {
  if (src.split(before).length !== 2) throw new Error('Expected exactly one edit site: ' + before);
  return src.replace(before, after);
}
const specs = [
  {id:'a002_b_gap100', a:originals[0], b:editOnce(originals[1], 'add sp, 00600h', 'add sp, 00100h'), hypothesis:'Reduce B recursive startup from roughly 405 pushes to 85 while preserving the eventual aligned MOVSB handoff and steady-state worker. A unchanged.', edits:['B startup stack displacement 0600h -> 0100h'], failureModes:['Less initial far-call stack bombing may surrender early kills.', 'Earlier B movement changes collision timing despite identical steady-state worker.']},
  {id:'a002_zero_startup_gaps', a:editOnce(originals[0], 'add sp, 00100h', 'db 081h, 0C4h, 000h, 000h ; add sp,0 with original imm16 width'), b:editOnce(originals[1], 'add sp, 00600h', 'db 081h, 0C4h, 000h, 000h ; add sp,0 with original imm16 width'), hypothesis:'Minimal positive-segment recursive handoff: initial SS:SP remains AX, target is CS:AX-50h, leaving approximately 20 self-calls rather than 84/404. Treat startup recursion as bootstrap latency.', edits:['A startup gap 0100h -> 0000h', 'B startup gap 0600h -> 0000h'], failureModes:['Forego most startup stack paint.', 'May expose next relocation before captured zombies establish their own attack.']},
  {id:'a002_odd_scanner_stride', a:editOnce(originals[0], 'add bx, 00100h', 'add bx, 00101h'), b:originals[1], hypothesis:'A captured-zombie scanner uses an odd modular stride, traversing every offset over time instead of staying in a fixed low-byte residue class. Worker unchanged.', edits:['A zombie_scan stride 0100h -> 0101h'], failureModes:['Aligned barriers previously encountered at every scan may now be missed on early passes.', 'Long coverage period can lose urgency versus dense writers.']},
];
const out = path.join(own, 'batch1');
fs.mkdirSync(out, {recursive:true});
const manifest = {schema:'v6-candidate-batch-v1', baseline:'original_v6', provenance:"Modified derivatives of the user's friend-provided Good_Test V6; not an original design.", requirements:['All authored/generated files confined to agent scratch.', 'Original A/B layout retained exactly, so original absolute internal offsets remain valid.', 'Each warrior at most 256 bytes.', 'No battle claims; coordinator evaluates identical team identities and paired cohorts/seeds.'], candidates:[]};
for (const spec of specs) {
  const dir = path.join(out, spec.id); fs.mkdirSync(dir, {recursive:true});
  const src = ['A.asm','B.asm'].map(n=>path.join(dir,n));
  fs.writeFileSync(src[0], spec.a); fs.writeFileSync(src[1], spec.b);
  cp.execFileSync(process.execPath, [nasm, path.join(dir,'build'), ...src], {stdio:'inherit'});
  const compiled = JSON.parse(fs.readFileSync(path.join(dir,'build/manifest.json'), 'utf8'));
  const originalsBin = ['Good_Test_V6_1','Good_Test_V6_2'].map(n=>fs.readFileSync(path.join(root,'study-notes/good-test-v6/original-binaries',n)));
  const byteDiffs = compiled.map((m,i)=>{const b=fs.readFileSync(m.output); if(b.length!==originalsBin[i].length) throw new Error('Layout changed'); return [...b.keys()].filter(k=>b[k]!==originalsBin[i][k]).map(k=>({offset:k,old:originalsBin[i][k],new:b[k]}));});
  manifest.candidates.push({...spec, a:undefined,b:undefined, sources:src, binaries:compiled.map(m=>m.output), sizes:compiled.map(m=>m.size), sha256:compiled.map(m=>m.binarySha256), byteDiffs, baselineHashes:['3fa67bed880413901ad618b4f7b248e5782d98de93318271ac540ad1690ca2b7','8579e2c2212d72a413a6daacfe3b91ceb72be648bfc085bfeed9430eeaf6657a']});
}
const finalPath=path.join(out,'candidates.json');
if(fs.existsSync(finalPath)) throw new Error('Immutable manifest already exists');
fs.writeFileSync(finalPath, JSON.stringify(manifest,null,2)+'\n');
console.log(finalPath);
