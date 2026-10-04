const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const root = 'C:/Maor/CodeGuru/corewars8086-lab';
const own = root + '/.arena/v6-cooperative-20261003/.arena/run-20261003-150943-s20261003/scratch/a003';
const originalA = fs.readFileSync(root + '/study-notes/good-test-v6/source/V6_1.asm', 'utf8');
const originalB = fs.readFileSync(root + '/study-notes/good-test-v6/source/V6_2.asm', 'utf8');
const variants = [
  ['a128lanes', originalA.replace('mov dx, 04000h', 'mov dx, 04200h').replace('mov bp, 04400h', 'mov bp, 04600h'), originalB,
    'A doubles its destination lane orbit from 64 to 128 positions while retaining the 0400h gap between stack and copy steps; A DX4000/BP4400 become DX4200/BP4600.',
    'Denser destinations can collide with live future copies; stack orbit also changes from 4 to 128 lanes.'],
  ['b128lanes', originalA, originalB.replace('mov dx, 02400h', 'mov dx, 02200h').replace('mov bp, 02C00h', 'mov bp, 02A00h'),
    'B doubles its destination lane orbit from 64 to 128 positions, preserving the 0800h difference between stack and copy steps; B DX2400/BP2C00 become DX2200/BP2A00.',
    'More destinations reduce repeat safety; captured Zombies inherit this schedule too.'],
  ['bcopynine', originalA, originalB.replace('mov cx, 8', 'mov cx, 9'),
    'B starts its first replication with nine words, matching every subsequent replication; initial CX8 becomes CX9.',
    'One extra startup round increases exposure and might copy a deliberately excluded pointer byte.'],
  ['astackshift', originalA.replace('add sp, 00100h', 'add sp, 00300h'), originalB,
    'A moves its initial return-frame painting 0200h farther from its first destination; SP +100h becomes +300h without changing replication cadence.',
    'May move useful return bombing away from a favorable interception band.'],
  ['bstackshift', originalA, originalB.replace('add sp, 00600h', 'add sp, 00400h'),
    'B moves its initial return-frame painting 0200h closer to its first destination; SP +600h becomes +400h.',
    'May reduce return-frame attack diversity or collide with another live copy.'],
  ['anrg', null, originalB,
    'A gains one NRG operation in every worker generation, trading one scheduled operation for potential bonus operations across a roughly 20-operation generation.',
    'Energy may decay faster than it accumulates; extra copy latency can erase the bonus and segment-relative return signatures change.']
];
// Rebase every original A layout dependency for the architectural NRG worker.
let nrgA = originalA.replace('add di, 0099h', 'add di, zombie_entry').replace('add si, 0088h', 'add si, worker');
nrgA = nrgA.replaceAll('mov cx, 9', 'mov cx, (worker_end-worker+1)/2').replace('mov cl, 9', 'mov cl, (worker_end-worker+1)/2');
nrgA = nrgA.replace('worker:\n    movsw\n    rep movsw\n', 'worker:\n    movsw\n    rep movsw\n    db 09Bh, 09Bh ; v6 NRG after bootstrap copy\n');
nrgA = nrgA.replace('zombie_entry:', 'worker_end:\nzombie_entry:');
variants[5][1] = nrgA;
const src = own + '/batch1/src';
const bin = own + '/batch1/bin';
fs.mkdirSync(src, {recursive:true});
for (const [id,a,b] of variants) {
  fs.writeFileSync(src+'/'+id+'_A.asm', a);
  fs.writeFileSync(src+'/'+id+'_B.asm', b);
}
cp.execFileSync('node', ['C:/Maor/CodeGuru/corewars8086-agent2/agent2/tools/nasm-node.cjs',bin,...variants.flatMap(([id]) => [src+'/'+id+'_A.asm',src+'/'+id+'_B.asm'])], {stdio:'inherit'});
const builds = JSON.parse(fs.readFileSync(bin+'/manifest.json','utf8'));
const candidates = variants.map(([id,a,b,hypothesis,failureModes]) => ({id:'a003_'+id, hypothesis, failureModes, edits:hypothesis, baseline:'original_v6', warriors:['_A','_B'].map(suffix => {const build=builds.find(x=>path.basename(x.output)===id+suffix);return {source:build.input,binary:build.output,size:build.size,sha256:build.binarySha256};})}));
fs.writeFileSync(own+'/batch1/candidates.json', JSON.stringify({schema:'cooperative-v6-candidates-v1',baseline:'original_v6',candidates},null,2)+'\n');
