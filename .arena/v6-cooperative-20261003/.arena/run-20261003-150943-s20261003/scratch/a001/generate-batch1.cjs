const fs=require('fs');
const path=require('path');
const scratch=__dirname;
const project='C:/Maor/CodeGuru/corewars8086-lab';
const a=fs.readFileSync(project+'/study-notes/good-test-v6/source/V6_1.asm','utf8');
const b=fs.readFileSync(project+'/study-notes/good-test-v6/source/V6_2.asm','utf8');
for(const count of [8,7]) {
  const dir=path.join(scratch,'batch1','copy'+count);
  fs.mkdirSync(dir,{recursive:true});
  const change=(s,initial)=>s.replace('mov cl, 9','mov cl, '+count).replace('mov cx, '+initial+'\n    mov dx,','mov cx, '+count+'\n    mov dx,');
  fs.writeFileSync(path.join(dir,'A.asm'),change(a,9));
  fs.writeFileSync(path.join(dir,'B.asm'),change(b,8));
}
