const fs=require('fs'),path=require('path');
const project='C:/Maor/CodeGuru/corewars8086-lab';
const dir=path.join(__dirname,'batch4','paintless');fs.mkdirSync(dir,{recursive:true});
for(const [side,n] of [['A',1],['B',2]]){
 const original=fs.readFileSync(project+'/study-notes/good-test-v6/source/V6_'+n+'.asm','utf8');
 const modified=original.replace('mov ax, 01FFFh','mov ax, 01FA4h ; direct MOVSB seed for every relocation').replaceAll('call far [bx]','jmp far [bx] ; recurring relocation bypasses recursive painting');
 fs.writeFileSync(path.join(dir,side+'.asm'),modified);
}
