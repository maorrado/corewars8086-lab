const fs=require('fs'),path=require('path');
const project='C:/Maor/CodeGuru/corewars8086-lab';
const a=fs.readFileSync(project+'/study-notes/good-test-v6/source/V6_1.asm','utf8');
const b=fs.readFileSync(project+'/study-notes/good-test-v6/source/V6_2.asm','utf8');
const changes=[
 ['nohop',a.replace('    jmp short phoenix_init\n','').replace('add di, 0099h','add di, zombie_entry-start').replace('add si, 0088h','add si, worker-start'),b],
 ['shiftattack',a.replace('    add si, si\n    add si, si\n    add si, si\n    add si, si','    mov cl, 4\n    shl si, cl'),b],
 ['strideplus100',a.replace('mov dx, 04000h','mov dx, 04100h').replace('mov bp, 04400h','mov bp, 04500h'),b.replace('mov dx, 02400h','mov dx, 02500h').replace('mov bp, 02C00h','mov bp, 02D00h')],
 ['strideminus100',a.replace('mov dx, 04000h','mov dx, 03F00h').replace('mov bp, 04400h','mov bp, 04300h'),b.replace('mov dx, 02400h','mov dx, 02300h').replace('mov bp, 02C00h','mov bp, 02B00h')]
];
for(const [id,sa,sb] of changes) {
 const dir=path.join(__dirname,'batch2',id);
 fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'A.asm'),sa);
 fs.writeFileSync(path.join(dir,'B.asm'),sb);
}
