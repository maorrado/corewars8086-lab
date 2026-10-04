const fs=require("fs");const D="agent2/night/scratch/B054/";let s=fs.readFileSync("agent2/night/revisions/rev0/B.asm","utf8").replace(/\r\n/g,"\n");
const hdr="; B054 (night wave 1, domain 4): rev0 B (Good_Test V6 warrior 2, friend-provided; V6nohunt base by agent2)\n; change: (1) startup EB F9 CC CC search starts at DI=0FFE0h (ES:DI loaded by one les from a data dword,\n; replacing push cs/pop es), zombie_entry search also starts at 0FFE0h -> skips decoys planted at FFE8h/FFECh;\n; (2) writes zombie_entry to [0CC13h] (combo_zrl03 captured-zombie hook cell). INT 87h stays the 12th instruction.\n";
const rep=(a,b)=>{if(!s.includes(a))throw "missing "+a;s=s.replace(a,b)};
rep("    push cs\n    mov [5D13h], bx\n    pop es\n","    mov [5D13h], bx\n    mov [0CC13h], bx        ; B054: steal combo_zrl03 hook cell\n    les di, [si + decoy_skip - start] ; B054: ES=1000h (arena), DI=0FFE0h\n");
rep("    jmp short phoenix_init\n\nzombie_entry:\n    xor di, di","    jmp short phoenix_init\n\ndecoy_skip:\n    dw 0FFE0h, 01000h\n\nzombie_entry:\n    mov di, 0FFE0h          ; B054: was xor di,di");
fs.writeFileSync(D+"fix2stealB.asm",hdr+s);
