const fs=require('fs'),path=require('path');
const root='C:/Maor/CodeGuru/corewars8086-lab';
const a=fs.readFileSync(root+'/study-notes/good-test-v6/source/V6_1.asm','utf8');
const b=fs.readFileSync(root+'/study-notes/good-test-v6/source/V6_2.asm','utf8');
for(const gap of ['00300h','00500h']){
 const dir=path.join(__dirname,'batch6','bgap'+gap.slice(2,-1));fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'A.asm'),a);
 fs.writeFileSync(path.join(dir,'B.asm'),b.replace('add sp, 00600h','add sp, '+gap));
}
