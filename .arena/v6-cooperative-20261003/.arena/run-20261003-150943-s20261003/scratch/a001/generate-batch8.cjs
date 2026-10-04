const fs=require('fs'),path=require('path');
const root='C:/Maor/CodeGuru/corewars8086-lab';
const original=[1,2].map(n=>fs.readFileSync(root+'/study-notes/good-test-v6/source/V6_'+n+'.asm','utf8'));
function burst(s,i){
 const shift=i?'03000h':'02000h',stride=i?'02400h':'04000h';
 const block=['add di, '+shift+' ; beyond the original quantized placement bucket','    mov ax, 0CCCCh','    mov dx, ax','    int 086h','    int 086h','    mov di, [bx] ; restore destination even if a captured Zombie spent charges','    mov dx, '+stride].join('\n');
 s=s.replace('mov dx, '+stride,block);
 if(i)s=s.replaceAll('add si, 00B9h','add si, worker-start');
 else s=s.replace('add si, 0088h','add si, worker-start').replace('add di, 0099h','add di, zombie_entry-start');
 return s;
}
for(const [id,mask] of [['burst_b',[false,true]],['burst_a',[true,false]],['burst_both',[true,true]]]){
 const dir=path.join(__dirname,'batch8',id);fs.mkdirSync(dir,{recursive:true});
 for(let i=0;i<2;i++)fs.writeFileSync(path.join(dir,i?'B.asm':'A.asm'),mask[i]?burst(original[i],i):original[i]);
}
