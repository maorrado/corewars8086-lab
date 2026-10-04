const fs=require('fs');
let a=fs.readFileSync('../../revisions/rev0/A.asm','utf8').replace(/\r/g,'');
const oldA=`start:
    mov si, ax
    push cs
    pop es
    mov ax, [4A17h]
    mov [9769h], ax
    mov ax, 0F2E2h
    mov dx, 0C381h
    mov bx, 026FFh
    mov cx, 04A17h
    int 087h
`;
const newA=`start:
    mov si, ax
    les ax, [word si + zdata - start] ; A037: ES=1000h (arena), AX=0F2E2h in one turn
    mov dx, 0C381h
    mov bp, [0B6E9h]      ; A037: B's entry from the private cell (B writes it at instr 3)
    mov [9769h], bp       ; instr 5 as in rev0
    mov bx, 026FFh
    mov cx, 0B6E9h        ; A037: zom20a -> jmp [0B6E9h] (private cell)
    nop
    mov [4A17h], bp       ; A037: late steal of the V6-family cell (instr 9, after their instr-3 writes)
    int 087h              ; instr 10 as in rev0
`;
if(!a.includes(oldA))throw 'A';
a=a.replace(oldA,newA).replace('; agent2 variant: removed the [7A00h] redirect patch (ablation)','; agent2 variant: removed the [7A00h] redirect patch (ablation)\n; A037 (night 2026-10-04): double pointer - own captures via private cell [0B6E9h],\n; V6-family captures stolen by a late write of our entry to [4A17h]');
a=a.trimEnd()+'\n\nzdata:\n    dw 0F2E2h, 01000h\n';
fs.writeFileSync('d1A.asm',a);
let b=fs.readFileSync('../../revisions/rev0/B.asm','utf8').replace(/\r/g,'');
const n=(b.match(/mov cx, 04A17h/g)||[]).length; if(n!==2)throw 'B'+n;
b=b.replace('    mov [4A17h], bx','    mov [0B6E9h], bx      ; A037: private hook cell (A steals [4A17h] later)').replace(/mov cx, 04A17h/g,'mov cx, 0B6E9h        ; A037: private cell');
b=b.replace('; offsets replaced by label arithmetic with the original operand widths.','; offsets replaced by label arithmetic with the original operand widths.\n; A037 (night 2026-10-04): hook cell 4A17h -> private 0B6E9h (A writes [4A17h])');
fs.writeFileSync('d1B.asm',b);
