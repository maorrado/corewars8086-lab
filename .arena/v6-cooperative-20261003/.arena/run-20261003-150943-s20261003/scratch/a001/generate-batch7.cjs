const fs=require('fs'),path=require('path');
const root='C:/Maor/CodeGuru/corewars8086-lab';
const original=[1,2].map(n=>fs.readFileSync(root+'/study-notes/good-test-v6/source/V6_'+n+'.asm','utf8'));
const change=s=>s.replace('mov ax, 01FFFh','mov ax, 018FFh ; equivalent CALL FAR [BX+SI], SI=0').replaceAll('call far [bx]','call far [bx+si] ; preserve two-byte layout and recursive paint');
for(const [id,mask] of [['camo_a',[true,false]],['camo_b',[false,true]],['camo_both',[true,true]]]){
 const dir=path.join(__dirname,'batch7',id);fs.mkdirSync(dir,{recursive:true});
 for(let i=0;i<2;i++)fs.writeFileSync(path.join(dir,i?'B.asm':'A.asm'),mask[i]?change(original[i]):original[i]);
}
