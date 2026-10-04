const fs=require('fs');const D='agent2/night/scratch/A049/';
function rep(s,o,n){if(!s.includes(o))throw new Error('missing '+o);return s.replace(o,n);}
let a=fs.readFileSync('agent2/night/scratch/A031/K_A.asm','utf8').replace(/\r/g,'');
a=rep(a,"    mov ax, [4A17h]\n    mov [9769h], ax\n    mov ax, 0F2E2h","    mov ax, 0F2E2h");
a=rep(a,"    int 087h\n    mov di, 0FF80h","    int 087h              ; A049: zom20a INT87 now instruction 8 (was 10)\n    mov ax, [4A17h]       ; A049: [4A17h]->[9769h] copy after INT87 (instr 9-10; B writes [4A17h] at instr 6)\n    mov [9769h], ax\n    mov di, 0FF80h");
fs.writeFileSync(D+'R_A.asm',"; A049 (wave 10): KP_A (= A031 K_A) + A003 C1 reorder of A (zero bytes, same turn count).\n"+a);
let b=fs.readFileSync('agent2/night/scratch/B094/KP_B.asm','utf8').replace(/\r/g,'');
b=rep(b,"    mov [4A17h], bx\n    mov [5D13h], bx\n    mov [0CC13h], bx\n    les di, [si + es_ptr - start]","    les di, [si + es_ptr - start]\n    mov [5D13h], bx       ; A049: instruction 4 (unchanged)\n    mov [0CC13h], bx      ; A049: instruction 5 (unchanged)\n    mov [4A17h], bx       ; A049: instruction 6 (was 3): after V6-family B writes at instr 3");
fs.writeFileSync(D+'R_B.asm',"; A049 (wave 10): KP_B (B094) + A003 C1 reorder of B: [4A17h] written at instr 6 (zero bytes, same turn count).\n"+b);
