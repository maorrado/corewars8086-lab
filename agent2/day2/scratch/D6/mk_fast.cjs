const fs=require("fs");
let a=fs.readFileSync("A_late.asm","utf8");
const hdr="; D6 FAST (day2 agent D6): LATE + startup trim. A: the two LATE nops removed (INT87 r9, phoenix_init r20 instead of\n; r11/r22; [1243h] still read at r4). B: band math as A's 16-bit memory divisor (div/mul word [si+kq]; same AX =\n; floor(si/3C00h)*3C00h + 10A2h incl. the wrap), 4 instructions fewer -> phoenix_init r21 instead of r25; hook-cell\n; rounds and B INT87 (r12) unchanged.\n";
const oldA="    nop                             ; 5  D6 LATE: [9769h] now written by B (instr 6)\n    nop                             ; 6\n";
if(!a.includes(oldA)) throw "A";
a=hdr+a.replace(oldA,"");
fs.writeFileSync("A_fast.asm",a);
let b=fs.readFileSync("B_late.asm","utf8");
const oldB=`    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 10h
    mov al, 0A2h
    add si, strict word worker - start
    jmp short phoenix_init`;
if(!b.includes(oldB)) throw "B";
b=hdr+b.replace(oldB,`    mov ax, si                      ; D6 FAST: 16-bit band math, same AX as mov al,ah/../mov al,0A2h
    xor dx, dx
    div word [si + kq - start]
    mul word [si + kq - start]
    add ax, 010A2h
    add si, strict word worker - start
    jmp short phoenix_init`);
const oldD="es_ptr:\n    dw 0EB0Fh, 01000h               ; D6: was dw 0000h, 01000h (les di)\n";
if(!b.includes(oldD)) throw "D";
b=b.replace(oldD,oldD+"kq:\n    dw 03C00h                       ; D6 FAST: band divisor\n");
fs.writeFileSync("B_fast.asm",b);
