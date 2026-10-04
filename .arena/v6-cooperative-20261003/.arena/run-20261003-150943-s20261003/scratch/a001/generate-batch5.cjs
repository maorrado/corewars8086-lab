const fs=require('fs'),path=require('path');
const run='C:/Maor/CodeGuru/corewars8086-lab/.arena/v6-cooperative-20261003/.arena/run-20261003-150943-s20261003';
const direct=path.join(run,'scratch/a002/batch2/a002_direct_boot_a/A.asm');
const gap=path.join(run,'scratch/a003/batch1/src/bstackshift_B.asm');
const dir=path.join(__dirname,'batch5','directA_gapB');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'A.asm'),fs.readFileSync(direct,'utf8'));
fs.writeFileSync(path.join(dir,'B.asm'),fs.readFileSync(gap,'utf8'));
