const fs=require("fs");const D="agent2/night/scratch/B054/";let s=fs.readFileSync("agent2/night/revisions/rev0/B.asm","utf8").replace(/\r\n/g,"\n");
const hdr="; B054 (night wave 1, domain 4): rev0 B (Good_Test V6 warrior 2, friend-provided; V6nohunt base by agent2)\n";
let f=s.replace("    std\n    int 087h\n    cld\n    mov ax, si","    mov di, 0FFE0h          ; B054: start EB F9 CC CC search below FFE0h (skips decoys planted at FFE8h/FFECh)\n    std\n    int 087h\n    cld\n    mov ax, si");
f=f.replace("zombie_entry:\n    xor di, di","zombie_entry:\n    mov di, 0FFE0h          ; B054: was xor di,di");
if((f.match(/B054/g)||[]).length!==2)throw "replace failed";
fs.writeFileSync(D+"fixB.asm",hdr+"; change: both backward INT87 searches start at DI=0FFE0h instead of 0\n"+f);
let g=f.replace("    mov [5D13h], bx\n","    mov [5D13h], bx\n    mov [0CC13h], bx        ; B054: steal combo_zrl03 captured-zombie hook cell\n");
if(g===f)throw "steal failed";
fs.writeFileSync(D+"stealB.asm",hdr+"; change: fixB + writes zombie_entry to [0CC13h] (combo_zrl03 hook cell)\n"+g);
