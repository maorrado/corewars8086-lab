const fs=require('fs'),path=require('path');
const project='C:/Maor/CodeGuru/corewars8086-lab';
const a=fs.readFileSync(project+'/study-notes/good-test-v6/source/V6_1.asm','utf8');
const b=fs.readFileSync(project+'/study-notes/good-test-v6/source/V6_2.asm','utf8');
const dir=path.join(__dirname,'batch3','nearboot');
fs.mkdirSync(dir,{recursive:true});
const near=(s,gap)=>s.replace('add sp, '+gap,'db 081h, 0ECh, 048h, 000h ; sub sp,48h, keep four-byte original layout');
fs.writeFileSync(path.join(dir,'A.asm'),near(a,'00100h'));
fs.writeFileSync(path.join(dir,'B.asm'),near(b,'00600h'));
