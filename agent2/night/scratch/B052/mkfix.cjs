const fs=require('fs');let s=fs.readFileSync('agent2/night/revisions/rev0/B.asm','utf8');
const i=s.indexOf('zombie_entry:'), j=s.indexOf('    cld\n    call get_ip');
const neu=`zombie_entry:
    ; B052 fix: a captured zom20b/d (CX=0) no longer plants the 0E 07 0E 17 -> CC counter-bomb;
    ; it repeats the zom20a capture (backward: highest remaining E2 F2 81 C3 -> FF 26 17 4A)
    ; so that a zom20a mimic decoy (HRZ_Grindo_Holics, GSA_callfart) that absorbed A's single
    ; INT 87h no longer costs the zom20a capture. CX!=0 (captured zom20a) path unchanged.
    xor di, di
    std
    push cs
    pop es
    mov bx, 026FFh
    mov bp, 3400h
    mov ax, 0F2E2h
    mov dx, 0C381h
    jcxz zombie_search
    mov bp, 2000h
    mov ax, 0F9EBh
    mov dx, 0CCCCh

zombie_search:
    mov cx, 04A17h
    int 087h
`;
if(i<0||j<0)throw 'x';
fs.writeFileSync(process.argv[2],s.slice(0,i)+neu+s.slice(j));
